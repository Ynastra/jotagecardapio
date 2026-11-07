begin;

select plan(6);

update public.stores set enforce_opening_hours = false where slug = 'zedoburguerlucelia';

create function pg_temp.pickup_payload(product_name text, option_names text[])
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
            'quantity', 1,
            'options', coalesce((
                select jsonb_agg(jsonb_build_object('option_id', o.id, 'quantity', 1))
                from public.options o
                where o.name = any (option_names)
            ), '[]'::jsonb)
        ))
    );
$$;

create function pg_temp.set_group_rule(product_name text, group_title text, new_min integer, new_max integer)
returns void
language sql
as $$
    update public.product_option_groups link
    set min_choices = new_min, max_choices = new_max
    from public.products p, public.option_groups g
    where link.product_id = p.id and link.group_id = g.id
      and p.name = product_name and g.title = group_title;
$$;

select pg_temp.set_group_rule('X-BURGUER', 'Deseja adicionar nossos molhos?', 1, 1);
select pg_temp.set_group_rule('X-SALADA', 'Deseja adicionar nossos molhos?', 1, 3);

select throws_ok(
    $$ select public.place_order(pg_temp.pickup_payload('X-BURGUER', array['Mal passado', 'Maionese da Casa', 'Sachê Ketchup Hemmer'])) $$,
    'invalid_option_selection',
    'máximo do grupo estourado no produto A é recusado'
);

select lives_ok(
    $$ select public.place_order(pg_temp.pickup_payload('X-SALADA', array['Mal passado', 'Maionese da Casa', 'Sachê Ketchup Hemmer'])) $$,
    'a mesma quantidade é válida no produto B'
);

select pg_temp.set_group_rule('X-MELT', 'Deseja adicionar nossos molhos?', 0, 3);

select throws_ok(
    $$ select public.place_order(pg_temp.pickup_payload('X-BURGUER', array['Mal passado'])) $$,
    'invalid_option_selection',
    'grupo obrigatório no produto A recusa pedido sem escolha'
);

select lives_ok(
    $$ select public.place_order(pg_temp.pickup_payload('X-MELT', array['Mal passado'])) $$,
    'o mesmo grupo é opcional no produto B'
);

select throws_ok(
    $$ select public.place_order(pg_temp.pickup_payload('X-MELT', array['Maionese da Casa'])) $$,
    'invalid_option_selection',
    'ponto da carne obrigatório continua exigido'
);

select is(
    (select count(*)::int from public.product_option_groups where min_choices >= 1 and max_choices < min_choices),
    0,
    'nenhum vínculo tem máximo abaixo do mínimo'
);

select * from finish();

rollback;
