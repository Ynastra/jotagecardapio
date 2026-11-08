begin;

select plan(16);

update public.stores
set enforce_opening_hours = false, delivery_mode = 'radius', delivery_max_km = 6
where slug = 'zedoburguerlucelia';

create function pg_temp.order_payload(fulfillment text, latitude jsonb, longitude jsonb)
returns jsonb
language sql
as $$
    select jsonb_build_object(
        'store_slug', 'zedoburguerlucelia',
        'customer_name', 'Maria Teste',
        'customer_phone', '18999990000',
        'fulfillment', fulfillment,
        'address', jsonb_build_object(
            'cep', '17780000', 'city', 'Lucélia', 'state', 'SP', 'street', 'Rua Teste', 'number', '10',
            'latitude', latitude, 'longitude', longitude
        ),
        'payment_method', 'cash',
        'items', jsonb_build_array(jsonb_build_object(
            'product_id', (select id from public.products where name = 'COCA COLA ORIGINAL'),
            'quantity', 1
        ))
    );
$$;

create function pg_temp.last_order()
returns public.orders
language sql
as $$
    select o from public.orders o order by created_at desc, number desc limit 1;
$$;

select is(
    round(public.distance_km(-21.72028, -51.01889, -21.74028, -51.01889)::numeric, 1),
    2.2,
    'a distância em linha reta entre dois pontos bate com o esperado'
);

select is(
    public.distance_km(-21.72028, -51.01889, -21.72028, -51.01889),
    0::double precision,
    'o mesmo ponto fica a zero km'
);

select public.place_order(pg_temp.order_payload('delivery', to_jsonb(-21.74028), to_jsonb(-51.01889)));

select is((pg_temp.last_order()).delivery_distance_km, 2.2, 'dentro do raio grava a distância');

select is((pg_temp.last_order()).distance_unverified, false, 'dentro do raio a distância fica conferida');

select is(
    (pg_temp.last_order()).address ->> 'latitude',
    '-21.74028',
    'dentro do raio grava a coordenada no endereço do pedido'
);

select is((pg_temp.last_order()).delivery_fee_cents, 800, 'dentro do raio a taxa continua a da loja');

select public.place_order(pg_temp.order_payload('delivery', to_jsonb('-21.74028'::text), to_jsonb('-51.01889'::text)));

select is((pg_temp.last_order()).delivery_distance_km, 2.2, 'aceita a coordenada em texto');

select throws_ok(
    $$ select public.place_order(pg_temp.order_payload('delivery', to_jsonb(-23.5614), to_jsonb(-46.6559))) $$,
    'out_of_delivery_range',
    'fora do raio recusa o pedido'
);

update public.stores set delivery_max_km = null where slug = 'zedoburguerlucelia';

select public.place_order(pg_temp.order_payload('delivery', to_jsonb(-23.5614), to_jsonb(-46.6559)));

select ok(
    (pg_temp.last_order()).delivery_distance_km > 99,
    'sem limite de km calcula a distância e aceita o pedido'
);

update public.stores set delivery_max_km = 6 where slug = 'zedoburguerlucelia';

select public.place_order(pg_temp.order_payload('delivery', null, null));

select is(
    ((pg_temp.last_order()).distance_unverified, (pg_temp.last_order()).delivery_distance_km is null),
    row(true, true),
    'sem coordenada do cliente o pedido entra como não conferido'
);

select public.place_order(pg_temp.order_payload('delivery', to_jsonb('abc'::text), to_jsonb(-51.01889)));

select is(
    ((pg_temp.last_order()).distance_unverified, (pg_temp.last_order()).delivery_distance_km is null),
    row(true, true),
    'coordenada que não é número entra como não conferida'
);

select public.place_order(pg_temp.order_payload('delivery', to_jsonb(95), to_jsonb(-51.01889)));

select is(
    ((pg_temp.last_order()).distance_unverified, (pg_temp.last_order()).delivery_distance_km is null),
    row(true, true),
    'coordenada fora da faixa entra como não conferida'
);

update public.stores set latitude = null, longitude = null where slug = 'zedoburguerlucelia';

select public.place_order(pg_temp.order_payload('delivery', to_jsonb(-21.74028), to_jsonb(-51.01889)));

select is(
    ((pg_temp.last_order()).distance_unverified, (pg_temp.last_order()).delivery_distance_km is null),
    row(true, true),
    'loja sem coordenada recebe o pedido como não conferido'
);

update public.stores
set latitude = -21.72028, longitude = -51.01889, delivery_mode = 'fixed'
where slug = 'zedoburguerlucelia';

select public.place_order(pg_temp.order_payload('delivery', to_jsonb(-23.5614), to_jsonb(-46.6559)));

select is(
    ((pg_temp.last_order()).distance_unverified, (pg_temp.last_order()).delivery_distance_km is null),
    row(false, true),
    'taxa fixa ignora a coordenada'
);

select public.place_order(pg_temp.order_payload('pickup', to_jsonb(-21.74028), to_jsonb(-51.01889)));

select is(
    ((pg_temp.last_order()).distance_unverified, (pg_temp.last_order()).delivery_distance_km is null),
    row(false, true),
    'retirada ignora a coordenada'
);

select throws_ok(
    $$ update public.stores set latitude = -21.72028, longitude = null $$,
    '23514',
    null,
    'latitude e longitude da loja vêm juntas'
);

select * from finish();

rollback;
