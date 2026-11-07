begin;

select plan(8);

select is(
    (select public from storage.buckets where id = 'store-media'),
    true,
    'bucket store-media é público'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '5e1d0000-0000-4000-8000-0000000000aa', true);
select set_config('request.jwt.claims', '{"sub": "5e1d0000-0000-4000-8000-0000000000aa", "role": "authenticated"}', true);

select lives_ok(
    $$ insert into storage.objects (bucket_id, name) values ('store-media', '5e1d0000-0000-4000-8000-000000000001/logo.png') $$,
    'membro grava na pasta da própria loja'
);

select throws_ok(
    $$ insert into storage.objects (bucket_id, name) values ('store-media', '5e1d0000-0000-4000-8000-0000000000ff/logo.png') $$,
    '42501',
    null,
    'membro não grava na pasta de outra loja'
);

select throws_ok(
    $$ insert into storage.objects (bucket_id, name) values ('store-media', 'sem-pasta-de-loja.png') $$,
    '42501',
    null,
    'caminho fora do padrão por loja é recusado'
);

select lives_ok(
    $$ update storage.objects set name = '5e1d0000-0000-4000-8000-000000000001/capa.png'
        where name = '5e1d0000-0000-4000-8000-000000000001/logo.png' $$,
    'membro troca a imagem da própria loja'
);

select set_config('request.jwt.claim.sub', '5e1d0000-0000-4000-8000-0000000000bb', true);
select set_config('request.jwt.claims', '{"sub": "5e1d0000-0000-4000-8000-0000000000bb", "role": "authenticated"}', true);

select throws_ok(
    $$ insert into storage.objects (bucket_id, name) values ('store-media', '5e1d0000-0000-4000-8000-000000000001/intruso.png') $$,
    '42501',
    null,
    'quem não é membro não grava na pasta da loja'
);

select set_config('storage.allow_delete_query', 'true', true);

with removed as (
    delete from storage.objects where name = '5e1d0000-0000-4000-8000-000000000001/capa.png' returning id
)
select is((select count(*)::int from removed), 0, 'quem não é membro não remove imagem da loja');

select set_config('request.jwt.claim.sub', '5e1d0000-0000-4000-8000-0000000000aa', true);
select set_config('request.jwt.claims', '{"sub": "5e1d0000-0000-4000-8000-0000000000aa", "role": "authenticated"}', true);

with removed as (
    delete from storage.objects where name = '5e1d0000-0000-4000-8000-000000000001/capa.png' returning id
)
select is((select count(*)::int from removed), 1, 'membro remove imagem da própria loja');

select * from finish();

rollback;
