-- Retrato textual da loja zedoburguerlucelia, sem ids gerados nem datas, em
-- ordem estável. Serve para comparar duas bases (local e produção) depois da
-- carga: saídas idênticas significam catálogo idêntico.

with loja as (
    select * from public.stores where slug = 'zedoburguerlucelia'
),
linhas as (
    select 1 as secao, 0 as ordem,
        (to_jsonb(loja) - 'id' - 'created_at')::text as linha
    from loja

    union all
    select 2, weekday,
        concat_ws('|', weekday, opens_at, closes_at)
    from public.store_hours
    where store_id = (select id from loja)

    union all
    select 3, 0,
        (to_jsonb(payment) - 'store_id')::text
    from public.store_payment_methods payment
    where store_id = (select id from loja)

    union all
    select 4, 0,
        (to_jsonb(message) - 'store_id')::text
    from public.store_whatsapp_messages message
    where store_id = (select id from loja)

    union all
    select 5, position,
        (to_jsonb(category) - 'id' - 'store_id')::text
    from public.categories category
    where store_id = (select id from loja)

    union all
    select 6, product.position,
        concat_ws(
            '|',
            category.name,
            (to_jsonb(product) - 'id' - 'store_id' - 'category_id')::text
        )
    from public.products product
    join public.categories category
        on category.id = product.category_id and category.store_id = product.store_id
    where product.store_id = (select id from loja)

    union all
    select 7, position,
        (to_jsonb(option_group) - 'id' - 'store_id')::text
    from public.option_groups option_group
    where store_id = (select id from loja)

    union all
    select 8, option.position,
        concat_ws(
            '|',
            option_group.title,
            (to_jsonb(option) - 'id' - 'store_id' - 'group_id')::text
        )
    from public.options option
    join public.option_groups option_group
        on option_group.id = option.group_id and option_group.store_id = option.store_id
    where option.store_id = (select id from loja)

    union all
    select 9, link.position,
        concat_ws(
            '|',
            product.name,
            option_group.title,
            link.position,
            link.min_choices,
            coalesce(link.max_choices::text, 'sem limite')
        )
    from public.product_option_groups link
    join public.products product
        on product.id = link.product_id and product.store_id = link.store_id
    join public.option_groups option_group
        on option_group.id = link.group_id and option_group.store_id = link.store_id
    where link.store_id = (select id from loja)
)
select secao, linha
from linhas
order by secao, ordem, linha;
