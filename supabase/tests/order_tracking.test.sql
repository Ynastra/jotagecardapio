begin;

select plan(19);

update public.stores set enforce_opening_hours = false where slug = 'zedoburguerlucelia';

create function pg_temp.place_pickup_order(customer text)
returns jsonb
language sql
as $$
    select public.place_order(jsonb_build_object(
        'store_slug', 'zedoburguerlucelia',
        'customer_name', customer,
        'customer_phone', '18999990000',
        'fulfillment', 'pickup',
        'payment_method', 'pix',
        'items', jsonb_build_array(jsonb_build_object(
            'product_id', (select id from public.products where name = 'COCA COLA ORIGINAL'),
            'quantity', 1
        ))
    ));
$$;

create temp table placed (customer text, result jsonb);
insert into placed select 'Primeiro', pg_temp.place_pickup_order('Primeiro');
insert into placed select 'Segundo', pg_temp.place_pickup_order('Segundo');

select matches(
    (select result ->> 'public_code' from placed where customer = 'Primeiro'),
    '^001-[0-9]{6}$',
    'primeiro pedido do dia tem código 001 mais seis dígitos'
);

select matches(
    (select result ->> 'public_code' from placed where customer = 'Segundo'),
    '^002-[0-9]{6}$',
    'número do dia é sequencial'
);

select is(
    (select length(result ->> 'tracking_token') from placed where customer = 'Primeiro'),
    64,
    'token de acompanhamento é longo e aleatório'
);

update public.orders set created_at = created_at - interval '1 day' where customer_name in ('Primeiro', 'Segundo');

select is(
    (pg_temp.place_pickup_order('Terceiro') ->> 'public_code') like '001-%',
    true,
    'número do dia reinicia na virada do dia da loja'
);

select is(
    (select preparing_at is null and ready_at is null and completed_at is null and canceled_at is null
        from public.orders where customer_name = 'Segundo'),
    true,
    'pedido novo nasce sem horário de etapa'
);

update public.orders set status = 'preparing' where customer_name = 'Segundo';
select isnt(
    (select preparing_at from public.orders where customer_name = 'Segundo'),
    null,
    'mudar para em preparo grava o horário'
);

update public.orders set status = 'ready' where customer_name = 'Segundo';
select isnt(
    (select ready_at from public.orders where customer_name = 'Segundo'),
    null,
    'mudar para pronto grava o horário'
);

update public.orders set status = 'completed' where customer_name = 'Segundo';
select isnt(
    (select completed_at from public.orders where customer_name = 'Segundo'),
    null,
    'concluir grava o horário'
);

update public.orders set status = 'preparing' where customer_name = 'Segundo';
select is(
    (select ready_at is null and completed_at is null and preparing_at is not null
        from public.orders where customer_name = 'Segundo'),
    true,
    'voltar o status apaga o horário das etapas à frente'
);

update public.orders set status = 'canceled' where customer_name = 'Segundo';
select isnt(
    (select canceled_at from public.orders where customer_name = 'Segundo'),
    null,
    'cancelar grava o horário'
);

update public.orders set status = 'received' where customer_name = 'Segundo';
select is(
    (select canceled_at is null and preparing_at is null from public.orders where customer_name = 'Segundo'),
    true,
    'reabrir o pedido apaga cancelamento e etapas'
);

select is(
    (public.get_order_tracking((select result ->> 'tracking_token' from placed where customer = 'Segundo'))
        ->> 'public_code') = (select result ->> 'public_code' from placed where customer = 'Segundo'),
    true,
    'token certo devolve o pedido'
);

select is(
    public.get_order_tracking('token-que-nao-existe'),
    null,
    'token errado não devolve nada'
);

select is(
    (select count(*)::int
        from jsonb_object_keys(public.get_order_tracking(
            (select result ->> 'tracking_token' from placed where customer = 'Segundo')
        )) as tracked_key
        where tracked_key in ('customer_phone', 'customer_name', 'address')),
    0,
    'tracking não expõe telefone, nome nem endereço do cliente'
);

select is(
    (select (public.get_order_tracking(
        (select result ->> 'tracking_token' from placed where customer = 'Segundo')
    ) ->> 'estimated_ready_at')::timestamptz - created_at
        from public.orders where customer_name = 'Segundo'),
    interval '30 minutes',
    'prazo estimado soma o tempo de preparo da loja'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '5e1d0000-0000-4000-8000-0000000000aa', true);
select set_config('request.jwt.claims', '{"sub": "5e1d0000-0000-4000-8000-0000000000aa", "role": "authenticated"}', true);

update public.orders set payment_status = 'paid' where customer_name = 'Segundo';
select is(
    (select payment_status from public.orders where customer_name = 'Segundo'),
    'paid',
    'membro marca o pedido como pago'
);

select throws_ok(
    $$ update public.orders set customer_name = 'Outro nome' where customer_name = 'Segundo' $$,
    '42501',
    null,
    'membro não altera outras colunas do pedido'
);

select set_config('request.jwt.claim.sub', '5e1d0000-0000-4000-8000-0000000000bb', true);
select set_config('request.jwt.claims', '{"sub": "5e1d0000-0000-4000-8000-0000000000bb", "role": "authenticated"}', true);

with changed as (
    update public.orders set payment_status = 'pending' where customer_name = 'Segundo' returning id
)
select is((select count(*)::int from changed), 0, 'quem não é membro não muda pedido da loja');

select is(
    (select count(*)::int from public.orders),
    0,
    'quem não é membro não lê pedidos'
);

select * from finish();

rollback;
