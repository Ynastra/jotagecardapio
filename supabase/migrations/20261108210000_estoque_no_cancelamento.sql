-- Estoque no cancelamento ---------------------------------------------------
-- Cancelar devolve ao estoque o que o pedido tirou; reabrir um pedido
-- cancelado tira de novo. Só produto com estoque controlado é mexido.

create function public.adjust_stock_on_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    direction integer;
    item_total record;
begin
    if new.status = 'canceled' and old.status <> 'canceled' then
        direction := 1;
    elsif old.status = 'canceled' and new.status <> 'canceled' then
        direction := -1;
    else
        return new;
    end if;

    -- Travar em ordem de id evita impasse entre pedidos com os mesmos
    -- produtos em ordem inversa.
    for item_total in
        select product.id, product.name, product.stock, totals.quantity
        from (
            select (item ->> 'product_id')::uuid as product_id,
                   sum((item ->> 'quantity')::integer) as quantity
            from jsonb_array_elements(new.items) as item
            group by 1
        ) as totals
        join public.products as product on product.id = totals.product_id
        where product.store_id = new.store_id
          and product.stock is not null
        order by product.id
        for update of product
    loop
        if direction < 0 and item_total.stock < item_total.quantity then
            raise exception 'insufficient_stock' using detail = item_total.name;
        end if;

        update public.products
        set stock = stock + direction * item_total.quantity
        where id = item_total.id;
    end loop;

    return new;
end;
$$;

create trigger orders_adjust_stock
    after update of status on public.orders
    for each row execute function public.adjust_stock_on_order_status_change();
