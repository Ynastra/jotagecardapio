begin;

select plan(4);

update public.stores set enforce_opening_hours = false where slug = 'zedoburguerlucelia';

select lives_ok(
    $$
        select public.place_order(jsonb_build_object(
            'store_slug', 'zedoburguerlucelia',
            'customer_name', 'Maria Teste',
            'customer_phone', '18999990000',
            'fulfillment', 'pickup',
            'payment_method', 'pix',
            'items', jsonb_build_array(jsonb_build_object(
                'product_id', (select id from public.products where name = 'COCA COLA ORIGINAL'),
                'quantity', 2
            ))
        ))
    $$,
    'pedido válido de retirada é criado'
);

select is(
    (select subtotal_cents from public.orders where customer_name = 'Maria Teste'),
    1400,
    'subtotal é recalculado a partir do preço do banco'
);

select is(
    (select total_cents from public.orders where customer_name = 'Maria Teste'),
    1400,
    'retirada não soma frete'
);

select throws_ok(
    $$
        select public.place_order(jsonb_build_object(
            'store_slug', 'zedoburguerlucelia',
            'customer_name', 'Maria Teste',
            'customer_phone', '18999990000',
            'fulfillment', 'pickup',
            'payment_method', 'pix',
            'items', jsonb_build_array(jsonb_build_object(
                'product_id', (select id from public.products where name = 'X-BURGUER'),
                'quantity', 1
            ))
        ))
    $$,
    'invalid_option_selection',
    'recusa produto com opcional obrigatório sem escolha'
);

select * from finish();

rollback;
