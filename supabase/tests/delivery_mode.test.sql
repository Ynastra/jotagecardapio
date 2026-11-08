begin;

select plan(15);

update public.stores set enforce_opening_hours = false where slug = 'zedoburguerlucelia';

insert into public.delivery_zones (id, store_id, neighborhood, fee_cents)
select '20e00000-0000-4000-8000-000000000001', id, 'Centro', 300
from public.stores where slug = 'zedoburguerlucelia';

create function pg_temp.order_payload(zone_id text)
returns jsonb
language sql
as $$
    select jsonb_build_object(
        'store_slug', 'zedoburguerlucelia',
        'customer_name', 'Maria Teste',
        'customer_phone', '18999990000',
        'fulfillment', 'delivery',
        'delivery_zone_id', zone_id,
        'address', jsonb_build_object(
            'cep', '17780000', 'city', 'Lucélia', 'state', 'SP', 'street', 'Rua Teste', 'number', '10'
        ),
        'payment_method', 'cash',
        'items', jsonb_build_array(jsonb_build_object(
            'product_id', (select id from public.products where name = 'COCA COLA ORIGINAL'),
            'quantity', 1
        ))
    );
$$;

create function pg_temp.last_order_fee()
returns integer
language sql
as $$
    select delivery_fee_cents from public.orders order by created_at desc, number desc limit 1;
$$;

create function pg_temp.last_order_zone()
returns uuid
language sql
as $$
    select delivery_zone_id from public.orders order by created_at desc, number desc limit 1;
$$;

update public.stores set delivery_mode = 'neighborhood' where slug = 'zedoburguerlucelia';

select throws_ok(
    $$ select public.place_order(pg_temp.order_payload(null)) $$,
    'delivery_zone_required',
    'por bairro recusa pedido sem bairro'
);

select public.place_order(pg_temp.order_payload('20e00000-0000-4000-8000-000000000001'));

select is(pg_temp.last_order_fee(), 300, 'por bairro cobra a taxa do bairro');

select is(
    pg_temp.last_order_zone(),
    '20e00000-0000-4000-8000-000000000001'::uuid,
    'por bairro grava o bairro no pedido'
);

update public.stores set delivery_mode = 'fixed' where slug = 'zedoburguerlucelia';

select public.place_order(pg_temp.order_payload('20e00000-0000-4000-8000-000000000001'));

select is(pg_temp.last_order_fee(), 800, 'taxa fixa ignora a taxa do bairro');

select is(pg_temp.last_order_zone(), null::uuid, 'taxa fixa grava pedido sem bairro');

select lives_ok(
    $$ select public.place_order(pg_temp.order_payload(null)) $$,
    'taxa fixa aceita pedido sem bairro'
);

update public.stores set delivery_mode = 'radius', delivery_max_km = 6 where slug = 'zedoburguerlucelia';

select public.place_order(pg_temp.order_payload('20e00000-0000-4000-8000-000000000001'));

select is(pg_temp.last_order_fee(), 800, 'raio de km ignora a taxa do bairro');

select is(pg_temp.last_order_zone(), null::uuid, 'raio de km grava pedido sem bairro');

select throws_ok(
    $$ update public.stores set name = repeat('a', 81) $$,
    '23514',
    null,
    'nome da loja tem até 80 caracteres'
);

select throws_ok(
    $$ update public.stores set cart_notice_title = repeat('a', 61) $$,
    '23514',
    null,
    'título do recado tem até 60 caracteres'
);

select throws_ok(
    $$ update public.stores set address = repeat('a', 201) $$,
    '23514',
    null,
    'endereço tem até 200 caracteres'
);

select throws_ok(
    $$ update public.delivery_zones set neighborhood = repeat('a', 81) $$,
    '23514',
    null,
    'nome do bairro tem até 80 caracteres'
);

select throws_ok(
    $$ update public.stores set pix_key = repeat('a', 78) $$,
    '23514',
    null,
    'chave Pix tem até 77 caracteres'
);

select throws_ok(
    $$ update public.stores set delivery_max_km = 50.1 $$,
    '23514',
    null,
    'raio máximo tem até 50 km'
);

select throws_ok(
    $$ update public.stores set prep_time_minutes = 241 $$,
    '23514',
    null,
    'tempo de preparo tem até 240 minutos'
);

select * from finish();

rollback;
