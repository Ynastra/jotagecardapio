-- Distância no modo raio ---------------------------------------------------
-- A loja guarda a própria coordenada e a place_order mede a distância em linha
-- reta até o endereço do cliente, recusando o que passa de delivery_max_km.

alter table public.stores
    add column latitude numeric(9, 6),
    add column longitude numeric(9, 6),
    add constraint stores_latitude_range check (latitude is null or latitude between -90 and 90),
    add constraint stores_longitude_range check (longitude is null or longitude between -180 and 180),
    add constraint stores_coordinates_together check ((latitude is null) = (longitude is null));

alter table public.orders
    add column delivery_distance_km numeric(5, 1),
    add column distance_unverified boolean not null default false;

-- Haversine, com o raio médio da Terra em km.
create function public.distance_km(
    lat1 double precision,
    lon1 double precision,
    lat2 double precision,
    lon2 double precision
)
returns double precision
language sql
immutable
as $$
    select 2 * 6371 * asin(least(1, sqrt(
        power(sin(radians(lat2 - lat1) / 2), 2)
        + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
    )));
$$;

create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    max_item_quantity constant integer := 99;
    max_text_length constant integer := 280;
    max_name_length constant integer := 80;
    coordinate_pattern constant text := '^-?[0-9]{1,3}(\.[0-9]+)?$';

    target_store public.stores%rowtype;
    target_zone public.delivery_zones%rowtype;
    target_product public.products%rowtype;
    new_order public.orders%rowtype;
    payment_rule public.store_payment_methods%rowtype;

    fulfillment text := payload ->> 'fulfillment';
    payment_method text := payload ->> 'payment_method';
    customer_name text := btrim(coalesce(payload ->> 'customer_name', ''));
    customer_phone text := regexp_replace(coalesce(payload ->> 'customer_phone', ''), '\D', '', 'g');
    order_notes text := nullif(btrim(coalesce(payload ->> 'notes', '')), '');
    zone_id_text text := nullif(payload ->> 'delivery_zone_id', '');
    change_for_cents integer := nullif(payload ->> 'change_for_cents', '')::integer;
    order_address jsonb := null;
    address_cep text := regexp_replace(coalesce(payload -> 'address' ->> 'cep', ''), '\D', '', 'g');
    latitude_text text := btrim(coalesce(payload -> 'address' ->> 'latitude', ''));
    longitude_text text := btrim(coalesce(payload -> 'address' ->> 'longitude', ''));

    customer_latitude numeric;
    customer_longitude numeric;
    distance_to_customer numeric;
    delivery_distance numeric(5, 1) := null;
    distance_is_unverified boolean := false;

    item jsonb;
    chosen jsonb;
    chosen_option record;
    product_group record;
    item_quantity integer;
    chosen_quantity integer;
    group_units integer;
    unit_price_cents integer;
    line_total_cents integer;
    line_options jsonb;
    lines jsonb := '[]'::jsonb;
    subtotal_cents integer := 0;
    delivery_fee_cents integer := 0;
    payment_fee_cents integer := 0;
    total_cents integer;
    next_number integer;
    next_daily_number integer;
    code_suffix_digits constant integer := 6;
begin
    select * into target_store from public.stores where slug = payload ->> 'store_slug' and active;
    if not found then
        raise exception 'store_not_found';
    end if;

    if target_store.enforce_opening_hours and not public.is_store_open(target_store.id, now()) then
        raise exception 'store_closed';
    end if;

    if length(customer_name) < 2 or length(customer_name) > max_name_length then
        raise exception 'invalid_customer_name';
    end if;
    if length(customer_phone) not between 10 and 13 then
        raise exception 'invalid_customer_phone';
    end if;
    if payment_method is null
        or payment_method not in ('pix', 'cash', 'credit', 'debit', 'meal_voucher', 'food_voucher') then
        raise exception 'invalid_payment_method';
    end if;
    if length(coalesce(order_notes, '')) > max_text_length then
        raise exception 'notes_too_long';
    end if;

    if fulfillment = 'delivery' then
        if not target_store.accepts_delivery then
            raise exception 'delivery_unavailable';
        end if;
        if nullif(btrim(coalesce(payload -> 'address' ->> 'street', '')), '') is null
            or nullif(btrim(coalesce(payload -> 'address' ->> 'number', '')), '') is null then
            raise exception 'invalid_address';
        end if;
        if target_store.require_cep and length(address_cep) <> 8 then
            raise exception 'invalid_cep';
        end if;
        order_address := jsonb_build_object(
            'cep', left(address_cep, 8),
            'city', left(btrim(coalesce(payload -> 'address' ->> 'city', '')), max_name_length),
            'state', left(upper(btrim(coalesce(payload -> 'address' ->> 'state', ''))), 2),
            'street', left(btrim(payload -> 'address' ->> 'street'), max_name_length),
            'number', left(btrim(payload -> 'address' ->> 'number'), 20),
            'neighborhood', left(btrim(coalesce(payload -> 'address' ->> 'neighborhood', '')), max_name_length),
            'complement', left(btrim(coalesce(payload -> 'address' ->> 'complement', '')), max_name_length),
            'reference', left(btrim(coalesce(payload -> 'address' ->> 'reference', '')), max_text_length)
        );
        delivery_fee_cents := target_store.delivery_fee_cents;

        if target_store.delivery_mode = 'neighborhood' then
            if zone_id_text is null then
                raise exception 'delivery_zone_required';
            end if;
            select * into target_zone
            from public.delivery_zones
            where id = zone_id_text::uuid and store_id = target_store.id and active;
            if not found then
                raise exception 'invalid_delivery_zone';
            end if;
            delivery_fee_cents := target_zone.fee_cents;
            order_address := order_address || jsonb_build_object('neighborhood', target_zone.neighborhood);
        end if;

        if target_store.delivery_mode = 'radius' then
            -- Coordenada que não é número, ou que cai fora da faixa, conta como ausente.
            if latitude_text ~ coordinate_pattern then
                customer_latitude := latitude_text::numeric;
            end if;
            if longitude_text ~ coordinate_pattern then
                customer_longitude := longitude_text::numeric;
            end if;
            if abs(customer_latitude) > 90 or abs(customer_longitude) > 180 then
                customer_latitude := null;
                customer_longitude := null;
            end if;

            if customer_latitude is null or customer_longitude is null
                or target_store.latitude is null or target_store.longitude is null then
                distance_is_unverified := true;
            else
                distance_to_customer := public.distance_km(
                    target_store.latitude::double precision,
                    target_store.longitude::double precision,
                    customer_latitude::double precision,
                    customer_longitude::double precision
                );
                if target_store.delivery_max_km is not null and distance_to_customer > target_store.delivery_max_km then
                    raise exception 'out_of_delivery_range';
                end if;
                delivery_distance := round(distance_to_customer, 1);
                order_address := order_address || jsonb_build_object(
                    'latitude', customer_latitude,
                    'longitude', customer_longitude
                );
            end if;
        end if;
    elsif fulfillment = 'pickup' then
        if not target_store.accepts_pickup then
            raise exception 'pickup_unavailable';
        end if;
    else
        raise exception 'invalid_fulfillment';
    end if;

    if jsonb_typeof(payload -> 'items') is distinct from 'array' or jsonb_array_length(payload -> 'items') = 0 then
        raise exception 'empty_order';
    end if;

    -- Só produto com estoque controlado é travado, todos de uma vez e em ordem
    -- de id, para pedidos com os mesmos itens em ordem inversa não se travarem.
    perform 1
    from public.products
    where store_id = target_store.id
      and stock is not null
      and id in (
          select (value ->> 'product_id')::uuid from jsonb_array_elements(payload -> 'items')
      )
    order by id
    for update;

    for item in select value from jsonb_array_elements(payload -> 'items') loop
        select * into target_product
        from public.products
        where id = (item ->> 'product_id')::uuid
          and store_id = target_store.id
          and active
          and sell_delivery_pickup;
        if not found then
            raise exception 'product_unavailable';
        end if;

        item_quantity := (item ->> 'quantity')::integer;
        if item_quantity is null or item_quantity < 1 or item_quantity > max_item_quantity then
            raise exception 'invalid_quantity';
        end if;

        if target_product.stock is not null then
            if target_product.stock < item_quantity then
                raise exception 'insufficient_stock' using detail = target_product.name;
            end if;
            update public.products set stock = stock - item_quantity where id = target_product.id;
        end if;

        -- Opção repetida no mesmo item burlaria o max_quantity.
        if (select count(*) from jsonb_array_elements(coalesce(item -> 'options', '[]'::jsonb)))
            <> (select count(distinct value ->> 'option_id') from jsonb_array_elements(coalesce(item -> 'options', '[]'::jsonb))) then
            raise exception 'duplicate_option';
        end if;

        unit_price_cents := coalesce(target_product.promo_price_cents, target_product.price_cents);
        line_options := '[]'::jsonb;

        for chosen in select value from jsonb_array_elements(coalesce(item -> 'options', '[]'::jsonb)) loop
            chosen_quantity := (chosen ->> 'quantity')::integer;

            select o.id, o.name, o.price_cents, o.max_quantity, o.group_id, g.title as group_title
            into chosen_option
            from public.options o
            join public.option_groups g on g.id = o.group_id
            join public.product_option_groups link on link.group_id = g.id and link.product_id = target_product.id
            where o.id = (chosen ->> 'option_id')::uuid and o.active and g.active;
            if not found then
                raise exception 'option_unavailable';
            end if;
            if chosen_quantity is null or chosen_quantity < 1 or chosen_quantity > coalesce(chosen_option.max_quantity, max_item_quantity) then
                raise exception 'invalid_option_quantity';
            end if;

            unit_price_cents := unit_price_cents + chosen_option.price_cents * chosen_quantity;
            line_options := line_options || jsonb_build_object(
                'option_id', chosen_option.id,
                'group_id', chosen_option.group_id,
                'group_title', chosen_option.group_title,
                'name', chosen_option.name,
                'quantity', chosen_quantity,
                'unit_price_cents', chosen_option.price_cents
            );
        end loop;

        for product_group in
            select g.id, g.title, link.min_choices, link.max_choices
            from public.option_groups g
            join public.product_option_groups link on link.group_id = g.id
            where link.product_id = target_product.id and g.active
        loop
            select coalesce(sum((value ->> 'quantity')::integer), 0) into group_units
            from jsonb_array_elements(line_options)
            where (value ->> 'group_id')::uuid = product_group.id;

            if group_units < product_group.min_choices
                or (product_group.max_choices is not null and group_units > product_group.max_choices) then
                raise exception 'invalid_option_selection' using detail = product_group.title;
            end if;
        end loop;

        line_total_cents := unit_price_cents * item_quantity;
        subtotal_cents := subtotal_cents + line_total_cents;
        lines := lines || jsonb_build_object(
            'product_id', target_product.id,
            'name', target_product.name,
            'quantity', item_quantity,
            'unit_price_cents', unit_price_cents,
            'total_cents', line_total_cents,
            'notes', left(nullif(btrim(coalesce(item ->> 'notes', '')), ''), max_text_length),
            'options', line_options
        );
    end loop;

    if subtotal_cents < target_store.min_order_cents then
        raise exception 'below_minimum_order';
    end if;

    if fulfillment = 'delivery'
        and target_store.free_delivery_above_cents is not null
        and subtotal_cents >= target_store.free_delivery_above_cents then
        delivery_fee_cents := 0;
    end if;

    select * into payment_rule
    from public.store_payment_methods
    where store_id = target_store.id and method = payment_method;
    if not found
        or not (case fulfillment when 'delivery' then payment_rule.enabled_delivery else payment_rule.enabled_pickup end) then
        raise exception 'payment_method_unavailable';
    end if;

    if payment_rule.fee_kind = 'percent' then
        payment_fee_cents := round((subtotal_cents + delivery_fee_cents) * payment_rule.fee_percent / 100)::integer;
    else
        payment_fee_cents := payment_rule.fee_fixed_cents;
    end if;

    total_cents := subtotal_cents + delivery_fee_cents + payment_fee_cents;

    if payment_method <> 'cash' then
        change_for_cents := null;
    elsif change_for_cents is not null and change_for_cents < total_cents then
        raise exception 'invalid_change';
    end if;

    -- Trava por loja para dois pedidos simultâneos não pegarem o mesmo número.
    perform pg_advisory_xact_lock(hashtextextended(target_store.id::text, 0));
    select coalesce(max(number), 0) + 1 into next_number from public.orders where store_id = target_store.id;
    select coalesce(max(daily_number), 0) + 1 into next_daily_number
    from public.orders
    where store_id = target_store.id
      and (created_at at time zone target_store.timezone)::date = (now() at time zone target_store.timezone)::date;

    insert into public.orders (
        store_id, number, daily_number, public_code, customer_name, customer_phone, fulfillment, address, delivery_zone_id,
        payment_method, change_for_cents, notes, items, subtotal_cents, delivery_fee_cents, payment_fee_cents,
        total_cents, delivery_distance_km, distance_unverified
    ) values (
        target_store.id, next_number, next_daily_number,
        lpad(next_daily_number::text, 3, '0') || '-'
            || lpad(floor(random() * 10 ^ code_suffix_digits)::integer::text, code_suffix_digits, '0'),
        customer_name, customer_phone, fulfillment, order_address, target_zone.id,
        payment_method, change_for_cents, order_notes, lines, subtotal_cents, delivery_fee_cents, payment_fee_cents,
        total_cents, delivery_distance, distance_is_unverified
    )
    returning * into new_order;

    return jsonb_build_object(
        'id', new_order.id,
        'number', new_order.number,
        'public_code', new_order.public_code,
        'tracking_token', new_order.tracking_token,
        'items', new_order.items,
        'address', new_order.address,
        'subtotal_cents', new_order.subtotal_cents,
        'delivery_fee_cents', new_order.delivery_fee_cents,
        'payment_fee_cents', new_order.payment_fee_cents,
        'total_cents', new_order.total_cents,
        'change_for_cents', new_order.change_for_cents,
        'created_at', new_order.created_at
    );
end;
$$;

revoke execute on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
