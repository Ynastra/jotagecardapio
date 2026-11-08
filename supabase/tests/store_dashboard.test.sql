begin;

select plan(23);

delete from public.orders;

create function pg_temp.line(product uuid, line_name text, quantity integer, total_cents integer)
returns jsonb
language sql
as $$
    select jsonb_build_object(
        'product_id', product, 'name', line_name, 'quantity', quantity, 'total_cents', total_cents
    );
$$;

create function pg_temp.add_order(
    order_number integer,
    order_status text,
    order_fulfillment text,
    phone text,
    total integer,
    created timestamptz,
    order_items jsonb
)
returns void
language sql
as $$
    insert into public.orders (
        store_id, number, customer_name, customer_phone, fulfillment, payment_method, items,
        subtotal_cents, delivery_fee_cents, total_cents, status, daily_number, public_code, created_at
    ) values (
        '5e1d0000-0000-4000-8000-000000000001', order_number, 'Cliente ' || order_number, phone,
        order_fulfillment, 'pix', order_items, total, 0, total, order_status, order_number,
        lpad(order_number::text, 3, '0') || '-000000', created
    );
$$;

create function pg_temp.cola()
returns uuid
language sql
as $$
    select id from public.products where name = 'COCA COLA ORIGINAL';
$$;

create function pg_temp.other_product()
returns uuid
language sql
as $$
    select id from public.products where name <> 'COCA COLA ORIGINAL' order by name limit 1;
$$;

create function pg_temp.march_dashboard()
returns jsonb
language sql
as $$
    select public.get_store_dashboard(
        '5e1d0000-0000-4000-8000-000000000001', '2020-03-01 03:00+00', '2020-04-01 03:00+00'
    );
$$;

create function pg_temp.month_revenue(month_label text)
returns integer
language sql
as $$
    select (month_entry ->> 'revenue_cents')::integer
    from jsonb_array_elements(
        public.get_store_dashboard(
            '5e1d0000-0000-4000-8000-000000000001', '2020-03-01 03:00+00', '2020-04-01 03:00+00'
        ) -> 'monthly_revenue'
    ) as month_entry
    where month_entry ->> 'month' = month_label;
$$;

select pg_temp.add_order(1, 'completed', 'delivery', '111', 5000, '2020-03-10 15:00+00', jsonb_build_array(
    pg_temp.line(pg_temp.cola(), 'Nome antigo', 2, 3000),
    pg_temp.line(pg_temp.other_product(), 'Outro', 1, 2000)
));
select pg_temp.add_order(2, 'received', 'pickup', '111', 3000, '2020-03-11 15:00+00', jsonb_build_array(
    pg_temp.line(pg_temp.cola(), 'Nome antigo', 1, 1500),
    pg_temp.line('20d00000-0000-4000-8000-000000000001', 'Produto excluído', 3, 1500)
));
select pg_temp.add_order(3, 'canceled', 'pickup', '222', 9999, '2020-03-12 15:00+00', jsonb_build_array(
    pg_temp.line(pg_temp.other_product(), 'Outro', 5, 9999)
));
select pg_temp.add_order(4, 'preparing', 'delivery', '333', 2000, '2020-03-13 15:00+00', jsonb_build_array(
    pg_temp.line(pg_temp.other_product(), 'Outro', 1, 2000)
));
select pg_temp.add_order(5, 'ready', 'pickup', '444', 1000, '2019-06-01 15:00+00', jsonb_build_array(
    pg_temp.line(pg_temp.cola(), 'Nome antigo', 1, 1000)
));

select pg_temp.add_order(
    6, 'completed', 'pickup', '555', 700,
    (date_trunc('month', now() at time zone 'America/Sao_Paulo') - interval '30 minutes') at time zone 'America/Sao_Paulo',
    jsonb_build_array(pg_temp.line(pg_temp.cola(), 'Nome antigo', 1, 700))
);
select pg_temp.add_order(
    7, 'completed', 'pickup', '555', 1100,
    (date_trunc('month', now() at time zone 'America/Sao_Paulo') + interval '30 minutes') at time zone 'America/Sao_Paulo',
    jsonb_build_array(pg_temp.line(pg_temp.cola(), 'Nome antigo', 1, 1100))
);

select pg_temp.add_order(
    8, 'completed', 'pickup', '666', 5000,
    (date_trunc('month', now() at time zone 'America/Sao_Paulo') - interval '11 months' - interval '1 hour') at time zone 'America/Sao_Paulo',
    jsonb_build_array(pg_temp.line(pg_temp.cola(), 'Nome antigo', 1, 5000))
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '5e1d0000-0000-4000-8000-0000000000aa', true);
select set_config('request.jwt.claims', '{"sub": "5e1d0000-0000-4000-8000-0000000000aa", "role": "authenticated"}', true);

select is(
    (pg_temp.march_dashboard() ->> 'revenue_cents')::integer,
    10000,
    'faturamento soma os pedidos não cancelados'
);

select is((pg_temp.march_dashboard() ->> 'orders_count')::integer, 3, 'pedidos não contam o cancelado');

select is((pg_temp.march_dashboard() ->> 'canceled_count')::integer, 1, 'cancelado aparece à parte');

select is((pg_temp.march_dashboard() ->> 'customers_count')::integer, 2, 'clientes são telefones distintos');

select is((pg_temp.march_dashboard() ->> 'delivery_count')::integer, 2, 'conta pedidos de entrega');

select is((pg_temp.march_dashboard() ->> 'pickup_count')::integer, 1, 'conta pedidos de retirada');

select is((pg_temp.march_dashboard() ->> 'items_total')::integer, 8, 'total de itens ignora o cancelado');

select is(
    (select string_agg(top ->> 'quantity', ',' order by rank_position)
        from jsonb_array_elements(pg_temp.march_dashboard() -> 'top_products') with ordinality as t(top, rank_position)),
    '3,3,2',
    'mais vendidos ordenam por quantidade e desempatam pela receita'
);

select is(
    pg_temp.march_dashboard() -> 'top_products' -> 0 ->> 'name',
    'COCA COLA ORIGINAL',
    'mais vendidos usam o nome atual do produto'
);

select is(
    (pg_temp.march_dashboard() -> 'top_products' -> 0 ->> 'revenue_cents')::integer,
    4500,
    'receita soma as linhas do produto'
);

select is(
    pg_temp.march_dashboard() -> 'top_products' -> 1 ->> 'name',
    'Produto excluído',
    'produto excluído mantém o nome do pedido'
);

select is(
    jsonb_array_length(pg_temp.march_dashboard() -> 'monthly_revenue'),
    12,
    'série traz doze meses'
);

select is(
    pg_temp.month_revenue(to_char(
        date_trunc('month', now() at time zone 'America/Sao_Paulo') - interval '1 month', 'YYYY-MM'
    )),
    700,
    'pedido de 23h30 do último dia fica no mês que termina, no fuso da loja'
);

select is(
    pg_temp.month_revenue(to_char(date_trunc('month', now() at time zone 'America/Sao_Paulo'), 'YYYY-MM')),
    1100,
    'pedido de 0h30 do primeiro dia fica no mês que começa, no fuso da loja'
);

select is(
    pg_temp.march_dashboard() -> 'monthly_revenue' -> 0 ->> 'month',
    to_char(date_trunc('month', now() at time zone 'America/Sao_Paulo') - interval '11 months', 'YYYY-MM'),
    'a série começa onze meses antes do atual'
);

select is(
    (select sum((month_entry ->> 'revenue_cents')::integer)::integer
        from jsonb_array_elements(pg_temp.march_dashboard() -> 'monthly_revenue') as month_entry),
    1800,
    'pedido anterior ao primeiro mês da série não entra nela'
);

select is(
    (pg_temp.march_dashboard() ->> 'in_progress_count')::integer,
    3,
    'em andamento conta recebidos, em preparo e prontos sem filtro de período'
);

select is(
    (public.get_store_dashboard(
        '5e1d0000-0000-4000-8000-000000000001', '2010-01-01 03:00+00', '2010-02-01 03:00+00'
    ) ->> 'orders_count')::integer,
    0,
    'período sem pedido zera os pedidos'
);

select set_config('request.jwt.claim.sub', '5e1d0000-0000-4000-8000-0000000000bb', true);
select set_config('request.jwt.claims', '{"sub": "5e1d0000-0000-4000-8000-0000000000bb", "role": "authenticated"}', true);

select is(
    (pg_temp.march_dashboard() ->> 'revenue_cents')::integer,
    0,
    'quem não é membro recebe faturamento zero'
);

select is(
    pg_temp.march_dashboard() -> 'top_products',
    '[]'::jsonb,
    'quem não é membro recebe lista vazia de mais vendidos'
);

select is(
    (pg_temp.march_dashboard() ->> 'in_progress_count')::integer,
    0,
    'quem não é membro recebe zero pedidos em andamento'
);

select is(
    (select sum((month_entry ->> 'revenue_cents')::integer)::integer
        from jsonb_array_elements(pg_temp.march_dashboard() -> 'monthly_revenue') as month_entry),
    0,
    'quem não é membro recebe a série zerada'
);

select is(
    (pg_temp.march_dashboard() ->> 'customers_count')::integer,
    0,
    'quem não é membro recebe zero clientes'
);

select * from finish();

rollback;
