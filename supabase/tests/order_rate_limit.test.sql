begin;

select plan(12);

update public.stores set enforce_opening_hours = false where slug = 'zedoburguerlucelia';

create function pg_temp.place(phone text)
returns jsonb
language sql
as $$
    select public.place_order(jsonb_build_object(
        'store_slug', 'zedoburguerlucelia',
        'customer_name', 'Cliente Teste',
        'customer_phone', phone,
        'fulfillment', 'pickup',
        'payment_method', 'pix',
        'items', jsonb_build_array(jsonb_build_object(
            'product_id', (select id from public.products where name = 'COCA COLA ORIGINAL'),
            'quantity', 1
        ))
    ));
$$;

create function pg_temp.insert_order(phone text, placed_at timestamptz)
returns void
language sql
as $$
    insert into public.orders (
        store_id, number, daily_number, public_code, customer_name, customer_phone, fulfillment,
        payment_method, items, subtotal_cents, delivery_fee_cents, total_cents, created_at
    )
    select
        store.id,
        coalesce((select max(number) from public.orders where store_id = store.id), 0) + 1,
        1, 'seed', 'Carga', phone, 'pickup', 'pix', '[]'::jsonb, 0, 0, 0, placed_at
    from public.stores store
    where store.slug = 'zedoburguerlucelia';
$$;

-- Telefone: três passam e o quarto é recusado.
select set_config('request.headers', '{"sb-forwarded-for": "10.0.0.1"}', true);
set local role anon;

select lives_ok(
    $$ select pg_temp.place('18911110000') from generate_series(1, 3) $$,
    'três pedidos do mesmo telefone passam'
);

select throws_ok(
    $$ select pg_temp.place('18911110000') $$,
    'too_many_orders',
    'o quarto pedido do mesmo telefone é recusado'
);

-- IP: cinco registros do mesmo IP, o sexto com outro telefone é recusado.
-- O IP 10.0.0.1 já tem três eventos dos pedidos acima.
select lives_ok(
    $$ select pg_temp.place('1892222000' || n) from generate_series(1, 2) n $$,
    'os pedidos até o limite do IP com telefones diferentes passam'
);

select throws_ok(
    $$ select pg_temp.place('18922220003') $$,
    'too_many_orders',
    'o sexto pedido do mesmo IP com telefone diferente é recusado'
);

-- Janela: pedidos de 11 minutos atrás não contam.
reset role;
select pg_temp.insert_order('18933330000', now() - interval '11 minutes') from generate_series(1, 3);
select set_config('request.headers', '{"sb-forwarded-for": "10.0.0.2"}', true);
set local role anon;

select lives_ok(
    $$ select pg_temp.place('18933330000') $$,
    'pedido fora da janela de 10 minutos não conta'
);

-- Sem cabeçalho de IP o limite por IP não se aplica.
select set_config('request.headers', '{}', true);

select lives_ok(
    $$ select pg_temp.place('1894444' || lpad(n::text, 4, '0')) from generate_series(1, 6) n $$,
    'sem cabeçalho de IP seis pedidos com telefones diferentes passam'
);

-- x-forwarded-for sozinho é ignorado, mesmo repetido.
select set_config('request.headers', '{"x-forwarded-for": "10.0.0.3"}', true);

select lives_ok(
    $$ select pg_temp.place('1895555' || lpad(n::text, 4, '0')) from generate_series(1, 6) n $$,
    'x-forwarded-for sozinho não limita por IP'
);

-- Evento com mais de um dia é apagado quando um pedido passa.
reset role;
insert into public.order_rate_events (store_id, ip_hash, created_at)
select id, 'antigo', now() - interval '2 days' from public.stores where slug = 'zedoburguerlucelia';
select set_config('request.headers', '{"cf-connecting-ip": "10.0.0.4"}', true);
set local role anon;
select pg_temp.place('18966660000');
reset role;

select is(
    (select count(*)::int from public.order_rate_events where ip_hash = 'antigo'),
    0,
    'evento com mais de um dia é apagado'
);

select is(
    (select count(*)::int from public.order_rate_events where ip_hash = encode(sha256(convert_to('10.0.0.4', 'UTF8')), 'hex')),
    1,
    'o evento guarda o hash do IP e não o IP'
);

-- Dono do banco não é limitado, mesmo com cabeçalho de IP presente.
select set_config('request.headers', '{"sb-forwarded-for": "10.0.0.5"}', true);

select lives_ok(
    $$ select pg_temp.place('18977770000') from generate_series(1, 6) $$,
    'insert como dono do banco não é limitado'
);

-- Teto da loja: completa 30 pedidos na janela e o próximo é recusado.
select pg_temp.insert_order('1898' || lpad(n::text, 7, '0'), now())
from generate_series(1, greatest(30 - (
    select count(*)::int from public.orders o join public.stores s on s.id = o.store_id
    where s.slug = 'zedoburguerlucelia' and o.created_at > now() - interval '10 minutes'
), 0)) n;
select set_config('request.headers', '{}', true);
set local role anon;

select throws_ok(
    $$ select pg_temp.place('18999998888') $$,
    'too_many_orders',
    'o pedido seguinte ao teto de 30 da loja é recusado'
);

select throws_ok(
    $$ select count(*) from public.order_rate_events $$,
    '42501',
    null,
    'anon não lê os eventos de limite'
);

select * from finish();

rollback;
