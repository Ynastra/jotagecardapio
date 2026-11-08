begin;

select plan(11);

update public.stores set enforce_opening_hours = false where slug = 'zedoburguerlucelia';

insert into public.products (store_id, category_id, name, price_cents, stock)
select store_id, id, 'Item Controlado', 1000, 10
from public.categories
where store_id = (select id from public.stores where slug = 'zedoburguerlucelia')
limit 1;

insert into public.products (store_id, category_id, name, price_cents)
select store_id, id, 'Item Livre', 1000
from public.categories
where store_id = (select id from public.stores where slug = 'zedoburguerlucelia')
limit 1;

create function pg_temp.place(lines jsonb)
returns uuid
language plpgsql
as $$
begin
    perform public.place_order(jsonb_build_object(
        'store_slug', 'zedoburguerlucelia',
        'customer_name', 'Maria Teste',
        'customer_phone', '18999990000',
        'fulfillment', 'pickup',
        'payment_method', 'cash',
        'items', lines
    ));
    return (select id from public.orders order by created_at desc, number desc limit 1);
end;
$$;

create function pg_temp.line(product_name text, quantity integer)
returns jsonb
language sql
as $$
    select jsonb_build_object(
        'product_id', (select id from public.products where name = product_name),
        'quantity', quantity
    );
$$;

create function pg_temp.stock_of(product_name text)
returns integer
language sql
as $$
    select stock from public.products where name = product_name;
$$;

create function pg_temp.set_status(order_id uuid, new_status text)
returns void
language sql
as $$
    update public.orders set status = new_status where id = order_id;
$$;

create temp table placed (label text primary key, order_id uuid);

insert into placed values (
    'simples',
    pg_temp.place(jsonb_build_array(pg_temp.line('Item Controlado', 2)))
);

select is(pg_temp.stock_of('Item Controlado'), 8, 'o pedido dá baixa no estoque');

select pg_temp.set_status((select order_id from placed where label = 'simples'), 'canceled');

select is(pg_temp.stock_of('Item Controlado'), 10, 'cancelar devolve a quantidade pedida');

select pg_temp.set_status((select order_id from placed where label = 'simples'), 'canceled');

select is(pg_temp.stock_of('Item Controlado'), 10, 'cancelar de novo não devolve outra vez');

select pg_temp.set_status((select order_id from placed where label = 'simples'), 'received');

select is(pg_temp.stock_of('Item Controlado'), 8, 'reabrir o pedido dá baixa de novo');

select pg_temp.set_status((select order_id from placed where label = 'simples'), 'canceled');

update public.products set stock = 1 where name = 'Item Controlado';

select throws_ok(
    $$ select pg_temp.set_status((select order_id from placed where label = 'simples'), 'received') $$,
    'P0001',
    'insufficient_stock',
    'não reabre se o estoque não cobre'
);

update public.products set stock = 10 where name = 'Item Controlado';

select pg_temp.set_status((select order_id from placed where label = 'simples'), 'received');

select is(pg_temp.stock_of('Item Controlado'), 8, 'reabrir com estoque que cobre dá baixa de novo');

update public.products set stock = 10 where name = 'Item Controlado';

insert into placed values (
    'duas_linhas',
    pg_temp.place(jsonb_build_array(pg_temp.line('Item Controlado', 1), pg_temp.line('Item Controlado', 3)))
);

select is(pg_temp.stock_of('Item Controlado'), 6, 'duas linhas do mesmo produto dão baixa somadas');

select pg_temp.set_status((select order_id from placed where label = 'duas_linhas'), 'canceled');

select is(pg_temp.stock_of('Item Controlado'), 10, 'duas linhas do mesmo produto voltam somadas');

insert into placed values (
    'livre',
    pg_temp.place(jsonb_build_array(pg_temp.line('Item Livre', 2)))
);

select pg_temp.set_status((select order_id from placed where label = 'livre'), 'canceled');

select is(
    (select stock from public.products where name = 'Item Livre'),
    null,
    'produto sem controle de estoque continua sem controle'
);

with other_store as (
    insert into public.stores (slug, name, whatsapp) values ('outraloja', 'Outra Loja', '5518999999999')
    returning id
), other_category as (
    insert into public.categories (store_id, name) select id, 'Geral' from other_store returning id, store_id
)
insert into public.products (store_id, category_id, name, price_cents, stock)
select store_id, id, 'Item Da Outra Loja', 1000, 7 from other_category;

update public.orders
set items = items || jsonb_build_array(pg_temp.line('Item Da Outra Loja', 3))
where id = (select order_id from placed where label = 'livre');

select pg_temp.set_status((select order_id from placed where label = 'livre'), 'received');
select pg_temp.set_status((select order_id from placed where label = 'livre'), 'canceled');

select is(pg_temp.stock_of('Item Da Outra Loja'), 7, 'produto de outra loja não é mexido');

insert into placed values (
    'fluxo',
    pg_temp.place(jsonb_build_array(pg_temp.line('Item Controlado', 2)))
);

select pg_temp.set_status((select order_id from placed where label = 'fluxo'), 'preparing');
select pg_temp.set_status((select order_id from placed where label = 'fluxo'), 'ready');
select pg_temp.set_status((select order_id from placed where label = 'fluxo'), 'completed');

select is(pg_temp.stock_of('Item Controlado'), 8, 'avançar o status normal não mexe no estoque');

select * from finish();

rollback;
