begin;

select plan(9);

update public.stores set enforce_opening_hours = false where slug = 'zedoburguerlucelia';

create function pg_temp.delivery_payload(address jsonb, product_name text)
returns jsonb
language sql
as $$
    select jsonb_build_object(
        'store_slug', 'zedoburguerlucelia',
        'customer_name', 'Maria Teste',
        'customer_phone', '18999990000',
        'fulfillment', 'delivery',
        'address', address,
        'payment_method', 'pix',
        'items', jsonb_build_array(jsonb_build_object(
            'product_id', (select id from public.products where name = product_name),
            'quantity', 1
        ))
    );
$$;

select throws_ok(
    $$
        select public.place_order(pg_temp.delivery_payload(
            jsonb_build_object('street', 'Rua Teste', 'number', '10'), 'COCA COLA ORIGINAL'
        ))
    $$,
    'invalid_cep',
    'loja que exige CEP recusa entrega sem CEP'
);

select throws_ok(
    $$
        select public.place_order(pg_temp.delivery_payload(
            jsonb_build_object('cep', '1778', 'street', 'Rua Teste', 'number', '10'), 'COCA COLA ORIGINAL'
        ))
    $$,
    'invalid_cep',
    'CEP com menos de 8 dígitos é recusado'
);

select lives_ok(
    $$
        select public.place_order(pg_temp.delivery_payload(
            jsonb_build_object(
                'cep', '17780-000', 'city', 'Lucélia', 'state', 'sp', 'street', 'Rua Teste', 'number', '10'
            ),
            'COCA COLA ORIGINAL'
        ))
    $$,
    'entrega com CEP válido é aceita'
);

select is(
    (select address ->> 'cep' || '|' || (address ->> 'city') || '|' || (address ->> 'state')
        from public.orders where customer_name = 'Maria Teste'),
    '17780000|Lucélia|SP',
    'pedido grava CEP só com dígitos, cidade e UF em caixa alta'
);

update public.stores set require_cep = false where slug = 'zedoburguerlucelia';

select lives_ok(
    $$
        select public.place_order(pg_temp.delivery_payload(
            jsonb_build_object('street', 'Rua Teste', 'number', '10'), 'COCA COLA ORIGINAL'
        ))
    $$,
    'loja sem exigência de CEP aceita entrega sem CEP'
);

update public.products set active = false where name = 'COCA COLA ORIGINAL';

set local role anon;

select is(
    (select count(*)::int from public.products where name = 'COCA COLA ORIGINAL'),
    0,
    'loja que oculta indisponíveis não mostra produto inativo ao público'
);

reset role;
update public.stores set hide_unavailable_items = false where slug = 'zedoburguerlucelia';
set local role anon;

select is(
    (select count(*)::int from public.products where name = 'COCA COLA ORIGINAL'),
    1,
    'loja que não oculta indisponíveis mostra produto inativo ao público'
);

reset role;

select throws_ok(
    $$
        select public.place_order(pg_temp.delivery_payload(
            jsonb_build_object('street', 'Rua Teste', 'number', '10'), 'COCA COLA ORIGINAL'
        ))
    $$,
    'product_unavailable',
    'produto inativo continua recusado no pedido'
);

update public.products set active = true where name = 'COCA COLA ORIGINAL';
update public.stores
    set pix_key = '12345678000199', pix_key_type = 'cnpj'
    where slug = 'zedoburguerlucelia';

select is(
    (select public.get_order_tracking(tracking_token) -> 'store' ->> 'pix_key'
        from public.orders where customer_name = 'Maria Teste' order by number limit 1),
    '12345678000199',
    'tracking de pedido Pix devolve a chave da loja'
);

select * from finish();

rollback;
