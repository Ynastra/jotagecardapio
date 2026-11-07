begin;

select plan(13);

update public.stores set enforce_opening_hours = false where slug = 'zedoburguerlucelia';

create function pg_temp.pickup_payload(product_name text, quantity integer)
returns jsonb
language sql
as $$
    select jsonb_build_object(
        'store_slug', 'zedoburguerlucelia',
        'customer_name', 'Maria Teste',
        'customer_phone', '18999990000',
        'fulfillment', 'pickup',
        'payment_method', 'pix',
        'items', jsonb_build_array(jsonb_build_object(
            'product_id', (select id from public.products where name = product_name),
            'quantity', quantity
        ))
    );
$$;

update public.products set stock = 2 where name = 'SPRITE';

select throws_ok(
    $$ select public.place_order(pg_temp.pickup_payload('SPRITE', 3)) $$,
    'insufficient_stock',
    'estoque insuficiente recusa o pedido'
);

select lives_ok(
    $$ select public.place_order(pg_temp.pickup_payload('SPRITE', 2)) $$,
    'quantidade igual ao estoque é aceita'
);

select is(
    (select stock from public.products where name = 'SPRITE'),
    0,
    'o pedido desconta do estoque'
);

select throws_ok(
    $$ select public.place_order(pg_temp.pickup_payload('SPRITE', 1)) $$,
    'insufficient_stock',
    'estoque zerado recusa novo pedido'
);

select lives_ok(
    $$ select public.place_order(pg_temp.pickup_payload('FANTA LARANJA', 5)) $$,
    'produto sem estoque controlado nunca falta'
);

update public.products set sell_delivery_pickup = false where name = 'COCA COLA ZERO';

select throws_ok(
    $$ select public.place_order(pg_temp.pickup_payload('COCA COLA ZERO', 1)) $$,
    'product_unavailable',
    'produto fora de entrega e retirada não entra no pedido'
);

update public.products set featured = true where name in ('X-BURGUER', 'X-SALADA', 'X-BACON');

select throws_ok(
    $$ update public.products set featured = true where name = 'X-MELT' $$,
    'featured_limit_reached',
    'sétimo destaque da loja é recusado'
);

select lives_ok(
    $$
        update public.products set featured = false where name = 'KIDS';
        update public.products set featured = true where name = 'X-MELT';
    $$,
    'tirar um destaque libera vaga'
);

select throws_ok(
    $$ update public.products set info_tags = array['inventada'] where name = 'SPRITE' $$,
    '23514',
    null,
    'etiqueta informativa fora da lista é recusada'
);

update public.products set stock = 5 where name = 'GUARANÁ ANTARCTICA';

select lives_ok(
    $$
        select public.place_order(jsonb_build_object(
            'store_slug', 'zedoburguerlucelia',
            'customer_name', 'Maria Teste',
            'customer_phone', '18999990000',
            'fulfillment', 'pickup',
            'payment_method', 'pix',
            'items', jsonb_build_array(
                jsonb_build_object(
                    'product_id', (select id from public.products where name = 'GUARANÁ ANTARCTICA'), 'quantity', 2),
                jsonb_build_object(
                    'product_id', (select id from public.products where name = 'FANTA LARANJA'), 'quantity', 1),
                jsonb_build_object(
                    'product_id', (select id from public.products where name = 'GUARANÁ ANTARCTICA'), 'quantity', 2)
            )
        ))
    $$,
    'pedido com produto repetido e produto sem estoque controlado é aceito'
);

select is(
    (select stock from public.products where name = 'GUARANÁ ANTARCTICA'),
    1,
    'produto repetido no pedido desconta cada linha do estoque'
);

select is(
    (select stock from public.products where name = 'FANTA LARANJA'),
    null,
    'produto sem estoque controlado continua sem estoque'
);

with other_store as (
    insert into public.stores (slug, name, whatsapp) values ('outraloja', 'Outra Loja', '5518999999999')
    returning id
), other_category as (
    insert into public.categories (store_id, name) select id, 'Geral' from other_store returning id, store_id
)
insert into public.products (store_id, category_id, name, price_cents, featured)
select store_id, id, 'Destaque ' || n, 1000, true
from other_category, generate_series(1, 6) as n;

select throws_ok(
    $$
        update public.products
        set store_id = (select id from public.stores where slug = 'outraloja'),
            category_id = (select id from public.categories where name = 'Geral')
        where name = 'X-MELT'
    $$,
    'featured_limit_reached',
    'mover um destaque para loja já cheia é recusado'
);

select * from finish();

rollback;
