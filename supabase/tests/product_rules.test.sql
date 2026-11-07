begin;

select plan(9);

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

select * from finish();

rollback;
