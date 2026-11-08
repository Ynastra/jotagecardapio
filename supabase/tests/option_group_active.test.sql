begin;

select plan(8);

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

update public.option_groups set active = false where title = 'Deseja adicionar nossos molhos?';

set local role anon;

select is(
    (select count(*)::int from public.option_groups where title = 'Deseja adicionar nossos molhos?'),
    0,
    'grupo desativado fica fora da leitura pública'
);

select isnt(
    (select count(*)::int from public.option_groups where active),
    0,
    'grupos ativos continuam na leitura pública'
);

reset role;

update public.product_option_groups link
set min_choices = 1, max_choices = 1
from public.products p, public.option_groups g
where link.product_id = p.id and link.group_id = g.id
  and p.name = 'X-BURGUER' and g.title = 'Deseja adicionar nossos molhos?';

select lives_ok(
    $$ select public.place_order(pg_temp.pickup_payload('X-BURGUER', array['Mal passado'])) $$,
    'regras de mínimo do grupo desativado não valem'
);

select throws_ok(
    $$ select public.place_order(pg_temp.pickup_payload('X-BURGUER', array['Mal passado', 'Maionese da Casa'])) $$,
    'option_unavailable',
    'escolha de item de grupo desativado é recusada'
);

select throws_ok(
    $$ update public.products set name = repeat('a', 121) where name = 'X-BURGUER' $$,
    '23514',
    null,
    'nome de produto acima de 120 é recusado'
);

select throws_ok(
    $$ update public.products set description = repeat('a', 601) where name = 'X-BURGUER' $$,
    '23514',
    null,
    'descrição de produto acima de 600 é recusada'
);

select throws_ok(
    $$ update public.options set description = repeat('a', 201) where name = 'Maionese da Casa' $$,
    '23514',
    null,
    'descrição de item acima de 200 é recusada'
);

select throws_ok(
    $$ update public.option_groups set description = repeat('a', 201) where title = 'Deseja adicionar nossos molhos?' $$,
    '23514',
    null,
    'descrição de grupo acima de 200 é recusada'
);

select * from finish();

rollback;
