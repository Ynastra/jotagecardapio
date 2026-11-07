begin;

select plan(9);

update public.stores set enforce_opening_hours = false where slug = 'zedoburguerlucelia';

create function pg_temp.order_payload(fulfillment_kind text, payment text, quantity integer)
returns jsonb
language sql
as $$
    select jsonb_build_object(
        'store_slug', 'zedoburguerlucelia',
        'customer_name', 'Maria Teste',
        'customer_phone', '18999990000',
        'fulfillment', fulfillment_kind,
        'address', jsonb_build_object('street', 'Rua Teste', 'number', '10'),
        'payment_method', payment,
        'items', jsonb_build_array(jsonb_build_object(
            'product_id', (select id from public.products where name = 'COCA COLA ORIGINAL'),
            'quantity', quantity
        ))
    );
$$;

create function pg_temp.last_order_value(column_name text)
returns integer
language plpgsql
as $$
declare
    result integer;
begin
    execute format(
        'select %I from public.orders order by created_at desc, number desc limit 1', column_name
    ) into result;
    return result;
end;
$$;

select throws_ok(
    $$ select public.place_order(pg_temp.order_payload('delivery', 'meal_voucher', 1)) $$,
    'payment_method_unavailable',
    'método desligado é recusado na entrega'
);

update public.store_payment_methods
set enabled_pickup = true
where method = 'meal_voucher';

select throws_ok(
    $$ select public.place_order(pg_temp.order_payload('delivery', 'meal_voucher', 1)) $$,
    'payment_method_unavailable',
    'método ligado só na retirada continua recusado na entrega'
);

select lives_ok(
    $$ select public.place_order(pg_temp.order_payload('pickup', 'meal_voucher', 1)) $$,
    'método ligado só na retirada é aceito na retirada'
);

update public.store_payment_methods
set fee_kind = 'percent', fee_percent = 2.50
where method = 'pix';

select public.place_order(pg_temp.order_payload('pickup', 'pix', 1));

select is(
    pg_temp.last_order_value('payment_fee_cents'),
    18,
    'taxa percentual é arredondada (2,5% de 700 centavos)'
);

select is(
    pg_temp.last_order_value('total_cents'),
    718,
    'taxa percentual é somada ao total'
);

update public.store_payment_methods
set fee_kind = 'fixed', fee_fixed_cents = 150
where method = 'credit';

select public.place_order(pg_temp.order_payload('pickup', 'credit', 1));

select is(
    pg_temp.last_order_value('payment_fee_cents'),
    150,
    'taxa fixa é cobrada por pedido'
);

update public.stores set free_delivery_above_cents = 1400 where slug = 'zedoburguerlucelia';

select public.place_order(pg_temp.order_payload('delivery', 'cash', 1));

select is(
    pg_temp.last_order_value('delivery_fee_cents'),
    800,
    'abaixo do valor de frete grátis cobra a taxa de entrega'
);

select public.place_order(pg_temp.order_payload('delivery', 'cash', 2));

select is(
    pg_temp.last_order_value('delivery_fee_cents'),
    0,
    'frete grátis no limite exato do valor'
);

select is(
    pg_temp.last_order_value('total_cents'),
    1400,
    'total sem frete nem taxa extra'
);

select * from finish();

rollback;
