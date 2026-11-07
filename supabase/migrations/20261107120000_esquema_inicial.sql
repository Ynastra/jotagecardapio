-- Esquema inicial do cardápio multi-loja.
--
-- Leitura pública: qualquer visitante lê o cardápio de uma loja ativa.
-- Escrita do cardápio: só quem é membro da loja.
-- Pedidos: o visitante nunca grava direto na tabela; passa pela função
-- place_order, que recalcula preços e valida opcionais a partir do banco,
-- porque o preço que vem do navegador não é confiável.

create table public.stores (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    name text not null,
    address text,
    whatsapp text not null,
    logo_url text,
    cover_url text,
    theme text not null default 'base',
    brand_color text,
    min_order_cents integer not null default 0,
    delivery_fee_cents integer not null default 0,
    accepts_delivery boolean not null default true,
    accepts_pickup boolean not null default true,
    enforce_opening_hours boolean not null default true,
    timezone text not null default 'America/Sao_Paulo',
    prep_time_minutes integer not null default 30,
    city text,
    state text,
    address_display text not null default 'full',
    require_cep boolean not null default false,
    order_copy_whatsapp boolean not null default false,
    hide_unavailable_items boolean not null default false,
    cart_notice_title text,
    cart_notice_body text,
    pix_key text,
    pix_key_type text,
    -- Na fase atual o modo radius cobra a taxa base sem conferir a distância.
    delivery_mode text not null default 'fixed',
    delivery_max_km numeric(5, 1),
    free_delivery_above_cents integer,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    constraint stores_prep_time_positive check (prep_time_minutes > 0),
    constraint stores_state_format check (state is null or state ~ '^[A-Z]{2}$'),
    constraint stores_address_display_valid check (address_display in ('hidden', 'city', 'full')),
    constraint stores_pix_key_type_valid check (
        pix_key_type is null or pix_key_type in ('cnpj', 'cpf', 'email', 'phone', 'random')
    ),
    constraint stores_delivery_mode_valid check (delivery_mode in ('fixed', 'radius', 'neighborhood')),
    constraint stores_delivery_max_km_positive check (delivery_max_km is null or delivery_max_km > 0),
    constraint stores_free_delivery_positive check (
        free_delivery_above_cents is null or free_delivery_above_cents >= 0
    ),
    constraint stores_slug_format check (slug ~ '^[a-z0-9]{3,40}$'),
    -- Caminhos que o próprio app usa não podem virar endereço de loja.
    constraint stores_slug_not_reserved check (
        slug not in ('painel', 'admin', 'api', 'entrar', 'temas', 'marca', 'assets', 'app', 'www')
    ),
    constraint stores_whatsapp_digits check (whatsapp ~ '^[0-9]{12,13}$'),
    constraint stores_brand_color_hex check (brand_color is null or brand_color ~ '^#[0-9a-fA-F]{6}$'),
    constraint stores_min_order_positive check (min_order_cents >= 0),
    constraint stores_delivery_fee_positive check (delivery_fee_cents >= 0),
    constraint stores_some_fulfillment check (accepts_delivery or accepts_pickup)
);

-- weekday segue o padrão do Postgres e do JavaScript: 0 = domingo.
-- closes_at menor que opens_at significa que o expediente passa da meia-noite.
create table public.store_hours (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores (id) on delete cascade,
    weekday smallint not null check (weekday between 0 and 6),
    opens_at time not null,
    closes_at time not null,
    constraint store_hours_not_empty check (opens_at <> closes_at)
);

create table public.store_members (
    store_id uuid not null references public.stores (id) on delete cascade,
    user_id uuid not null references auth.users (id) on delete cascade,
    role text not null default 'owner' check (role in ('owner', 'staff')),
    primary key (store_id, user_id)
);

-- A taxa extra de cada forma de pagamento é um percentual do valor a pagar
-- (subtotal mais entrega) ou um valor fixo, conforme fee_kind.
create table public.store_payment_methods (
    store_id uuid not null references public.stores (id) on delete cascade,
    method text not null check (method in ('pix', 'cash', 'credit', 'debit', 'meal_voucher', 'food_voucher')),
    enabled_delivery boolean not null default false,
    enabled_pickup boolean not null default false,
    fee_kind text not null default 'fixed' check (fee_kind in ('percent', 'fixed')),
    fee_percent numeric(5, 2) not null default 0 check (fee_percent between 0 and 100),
    fee_fixed_cents integer not null default 0 check (fee_fixed_cents >= 0),
    primary key (store_id, method)
);

create table public.delivery_zones (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores (id) on delete cascade,
    neighborhood text not null,
    fee_cents integer not null check (fee_cents >= 0),
    active boolean not null default true,
    unique (store_id, neighborhood)
);

create table public.categories (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores (id) on delete cascade,
    name text not null,
    icon_url text,
    position integer not null default 0,
    active boolean not null default true,
    unique (id, store_id)
);

create table public.products (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores (id) on delete cascade,
    category_id uuid not null,
    name text not null,
    description text,
    price_cents integer not null check (price_cents >= 0),
    promo_price_cents integer,
    serves smallint check (serves is null or serves > 0),
    portion_label text,
    image_url text,
    featured boolean not null default false,
    active boolean not null default true,
    position integer not null default 0,
    unique (id, store_id),
    -- A chave composta impede um produto de apontar para categoria de outra loja.
    foreign key (category_id, store_id) references public.categories (id, store_id) on delete cascade,
    constraint products_promo_below_price check (
        promo_price_cents is null or (promo_price_cents >= 0 and promo_price_cents < price_cents)
    )
);

-- Grupos de opcionais pertencem à loja e são ligados a vários produtos, porque
-- o mesmo "Ponto da carne" ou "Turbinar" se repete em todos os lanches. As
-- regras de quantidade (mínimo e máximo) ficam no vínculo com o produto.
create table public.option_groups (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores (id) on delete cascade,
    title text not null,
    unique (id, store_id)
);

create table public.options (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null,
    group_id uuid not null,
    name text not null,
    description text,
    image_url text,
    price_cents integer not null default 0 check (price_cents >= 0),
    -- null = sem limite de unidades deste opcional no item.
    max_quantity integer default 1 check (max_quantity is null or max_quantity >= 1),
    position integer not null default 0,
    active boolean not null default true,
    foreign key (group_id, store_id) references public.option_groups (id, store_id) on delete cascade
);

-- min_choices >= 1 torna o grupo obrigatório neste produto.
-- max_choices nulo significa sem limite de unidades no grupo.
create table public.product_option_groups (
    store_id uuid not null,
    product_id uuid not null,
    group_id uuid not null,
    position integer not null default 0,
    min_choices integer not null default 0 check (min_choices >= 0),
    max_choices integer check (max_choices is null or max_choices >= 1),
    primary key (product_id, group_id),
    foreign key (product_id, store_id) references public.products (id, store_id) on delete cascade,
    foreign key (group_id, store_id) references public.option_groups (id, store_id) on delete cascade,
    constraint product_option_groups_max_covers_min check (max_choices is null or max_choices >= min_choices)
);

create table public.orders (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores (id) on delete cascade,
    number integer not null,
    customer_name text not null,
    customer_phone text not null,
    fulfillment text not null check (fulfillment in ('delivery', 'pickup')),
    address jsonb,
    delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
    payment_method text not null
        check (payment_method in ('pix', 'cash', 'credit', 'debit', 'meal_voucher', 'food_voucher')),
    change_for_cents integer,
    notes text,
    items jsonb not null,
    subtotal_cents integer not null,
    delivery_fee_cents integer not null,
    payment_fee_cents integer not null default 0,
    total_cents integer not null,
    status text not null default 'received'
        check (status in ('received', 'preparing', 'ready', 'completed', 'canceled')),
    payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
    preparing_at timestamptz,
    ready_at timestamptz,
    completed_at timestamptz,
    canceled_at timestamptz,
    -- Sequencial do dia no fuso da loja; o código público é o que o cliente vê.
    daily_number integer not null,
    public_code text not null,
    -- Link de acompanhamento do cliente: não adivinhável e sem login.
    tracking_token text not null unique
        default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    created_at timestamptz not null default now(),
    unique (store_id, number)
);

create index store_hours_store_idx on public.store_hours (store_id);
create index categories_store_idx on public.categories (store_id);
create index products_store_idx on public.products (store_id);
create index option_groups_store_idx on public.option_groups (store_id);
create index options_group_idx on public.options (group_id);
create index product_option_groups_store_idx on public.product_option_groups (store_id);
create index orders_store_created_idx on public.orders (store_id, created_at desc);

-- Funções auxiliares ------------------------------------------------------

create function public.is_store_member(target_store uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.store_members
        where store_id = target_store and user_id = auth.uid()
    );
$$;

create function public.is_store_public(target_store uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (select 1 from public.stores where id = target_store and active);
$$;

create function public.is_store_open(target_store uuid, at_time timestamptz)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    with local_clock as (
        select
            extract(dow from at_time at time zone s.timezone)::int as weekday,
            (at_time at time zone s.timezone)::time as clock_time
        from public.stores s
        where s.id = target_store
    )
    select exists (
        select 1
        from public.store_hours h, local_clock c
        where h.store_id = target_store
          and (
              (h.opens_at < h.closes_at
                  and h.weekday = c.weekday
                  and c.clock_time >= h.opens_at
                  and c.clock_time < h.closes_at)
              or (h.opens_at > h.closes_at
                  and ((h.weekday = c.weekday and c.clock_time >= h.opens_at)
                      or (h.weekday = (c.weekday + 6) % 7 and c.clock_time < h.closes_at)))
          )
    );
$$;

-- RLS ---------------------------------------------------------------------

alter table public.stores enable row level security;
alter table public.store_hours enable row level security;
alter table public.store_members enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.store_payment_methods enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.option_groups enable row level security;
alter table public.options enable row level security;
alter table public.product_option_groups enable row level security;
alter table public.orders enable row level security;

create policy "loja ativa é pública" on public.stores
    for select using (active or public.is_store_member(id));
create policy "membro edita a loja" on public.stores
    for update using (public.is_store_member(id)) with check (public.is_store_member(id));

create policy "membro vê a própria associação" on public.store_members
    for select using (user_id = auth.uid());

create policy "horários públicos" on public.store_hours
    for select using (public.is_store_public(store_id) or public.is_store_member(store_id));
create policy "membro edita horários" on public.store_hours
    for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy "bairros públicos" on public.delivery_zones
    for select using ((active and public.is_store_public(store_id)) or public.is_store_member(store_id));
create policy "membro edita bairros" on public.delivery_zones
    for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy "formas de pagamento públicas" on public.store_payment_methods
    for select using (public.is_store_public(store_id) or public.is_store_member(store_id));
create policy "membro edita formas de pagamento" on public.store_payment_methods
    for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy "categorias públicas" on public.categories
    for select using ((active and public.is_store_public(store_id)) or public.is_store_member(store_id));
create policy "membro edita categorias" on public.categories
    for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy "produtos públicos" on public.products
    for select using ((active and public.is_store_public(store_id)) or public.is_store_member(store_id));
create policy "membro edita produtos" on public.products
    for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy "grupos públicos" on public.option_groups
    for select using (public.is_store_public(store_id) or public.is_store_member(store_id));
create policy "membro edita grupos" on public.option_groups
    for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy "opcionais públicos" on public.options
    for select using ((active and public.is_store_public(store_id)) or public.is_store_member(store_id));
create policy "membro edita opcionais" on public.options
    for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy "vínculos públicos" on public.product_option_groups
    for select using (public.is_store_public(store_id) or public.is_store_member(store_id));
create policy "membro edita vínculos" on public.product_option_groups
    for all using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy "membro vê pedidos da loja" on public.orders
    for select using (public.is_store_member(store_id));
create policy "membro muda status do pedido" on public.orders
    for update using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

-- Pedido só nasce pela place_order, e o painel só mexe no status.
revoke insert, delete, update on public.orders from anon, authenticated;
grant update (status, payment_status) on public.orders to authenticated;

-- Grava o horário da etapa na mudança de status e apaga o das etapas à frente
-- quando o status volta. O cancelamento tem horário próprio e não mexe nas etapas.
create function public.stamp_order_stage()
returns trigger
language plpgsql
as $$
begin
    if new.status is not distinct from old.status then
        return new;
    end if;

    if new.status = 'canceled' then
        new.canceled_at := now();
        return new;
    end if;

    new.canceled_at := null;
    if new.status = 'received' then
        new.preparing_at := null;
    elsif new.status = 'preparing' then
        new.preparing_at := now();
    end if;

    if new.status in ('received', 'preparing') then
        new.ready_at := null;
    elsif new.status = 'ready' then
        new.ready_at := now();
    end if;

    if new.status in ('received', 'preparing', 'ready') then
        new.completed_at := null;
    else
        new.completed_at := now();
    end if;

    return new;
end;
$$;

create trigger orders_stamp_stage
    before update of status on public.orders
    for each row execute function public.stamp_order_stage();

-- Criação de pedido -------------------------------------------------------

create function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    max_item_quantity constant integer := 99;
    max_text_length constant integer := 280;
    max_name_length constant integer := 80;

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
        order_address := jsonb_build_object(
            'street', left(btrim(payload -> 'address' ->> 'street'), max_name_length),
            'number', left(btrim(payload -> 'address' ->> 'number'), 20),
            'neighborhood', left(btrim(coalesce(payload -> 'address' ->> 'neighborhood', '')), max_name_length),
            'complement', left(btrim(coalesce(payload -> 'address' ->> 'complement', '')), max_name_length),
            'reference', left(btrim(coalesce(payload -> 'address' ->> 'reference', '')), max_text_length)
        );
        delivery_fee_cents := target_store.delivery_fee_cents;

        if zone_id_text is not null then
            select * into target_zone
            from public.delivery_zones
            where id = zone_id_text::uuid and store_id = target_store.id and active;
            if not found then
                raise exception 'invalid_delivery_zone';
            end if;
            delivery_fee_cents := target_zone.fee_cents;
            order_address := order_address || jsonb_build_object('neighborhood', target_zone.neighborhood);
        elsif exists (select 1 from public.delivery_zones where store_id = target_store.id and active) then
            raise exception 'delivery_zone_required';
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

    for item in select value from jsonb_array_elements(payload -> 'items') loop
        select * into target_product
        from public.products
        where id = (item ->> 'product_id')::uuid and store_id = target_store.id and active;
        if not found then
            raise exception 'product_unavailable';
        end if;

        item_quantity := (item ->> 'quantity')::integer;
        if item_quantity is null or item_quantity < 1 or item_quantity > max_item_quantity then
            raise exception 'invalid_quantity';
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
            where o.id = (chosen ->> 'option_id')::uuid and o.active;
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
            where link.product_id = target_product.id
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
        total_cents
    ) values (
        target_store.id, next_number, next_daily_number,
        lpad(next_daily_number::text, 3, '0') || '-'
            || lpad(floor(random() * 10 ^ code_suffix_digits)::integer::text, code_suffix_digits, '0'),
        customer_name, customer_phone, fulfillment, order_address, target_zone.id,
        payment_method, change_for_cents, order_notes, lines, subtotal_cents, delivery_fee_cents, payment_fee_cents,
        total_cents
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

-- Acompanhamento pelo cliente -------------------------------------------

-- Devolve só o que a página do cliente mostra, nunca telefone nem endereço.
-- Token desconhecido devolve nulo, sem distinguir de pedido inexistente.
create function public.get_order_tracking(token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
    select jsonb_build_object(
        'store', jsonb_build_object(
            'name', s.name,
            'slug', s.slug,
            'logo_url', s.logo_url,
            'brand_color', s.brand_color,
            'theme', s.theme
        ),
        'public_code', o.public_code,
        'status', o.status,
        'payment_status', o.payment_status,
        'fulfillment', o.fulfillment,
        'payment_method', o.payment_method,
        'created_at', o.created_at,
        'preparing_at', o.preparing_at,
        'ready_at', o.ready_at,
        'completed_at', o.completed_at,
        'canceled_at', o.canceled_at,
        'estimated_ready_at', o.created_at + make_interval(mins => s.prep_time_minutes),
        'items', o.items,
        'subtotal_cents', o.subtotal_cents,
        'delivery_fee_cents', o.delivery_fee_cents,
        'payment_fee_cents', o.payment_fee_cents,
        'total_cents', o.total_cents
    )
    from public.orders o
    join public.stores s on s.id = o.store_id
    where o.tracking_token = token;
$$;

revoke execute on function public.get_order_tracking(text) from public;
grant execute on function public.get_order_tracking(text) to anon, authenticated;

alter publication supabase_realtime add table public.orders;
