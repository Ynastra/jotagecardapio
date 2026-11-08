begin;

select plan(14);

select is(
    (select count(*)::int from public.store_whatsapp_messages where active and custom_body is null),
    8,
    'seed traz as 8 mensagens ativas com texto padrão'
);

insert into public.store_whatsapp_sessions (store_id, provider, state, phone)
select id, 'qr', 'connected', '5518996649346' from public.stores where slug = 'zedoburguerlucelia';

set local role authenticated;
select set_config('request.jwt.claim.sub', '5e1d0000-0000-4000-8000-0000000000aa', true);
select set_config('request.jwt.claims', '{"sub": "5e1d0000-0000-4000-8000-0000000000aa", "role": "authenticated"}', true);

select is(
    (select count(*)::int from public.store_whatsapp_messages),
    8,
    'membro lê as mensagens da loja'
);

select lives_ok(
    $$ update public.store_whatsapp_messages set custom_body = 'Olá!', interval_minutes = 60 where type = 'greeting' $$,
    'membro edita uma mensagem'
);

select lives_ok(
    $$ update public.store_whatsapp_messages set custom_body = repeat('a', 1000) where type = 'away' $$,
    'aceita texto de 1000 caracteres'
);

select throws_ok(
    $$ update public.store_whatsapp_messages set custom_body = repeat('a', 1001) where type = 'away' $$,
    '23514',
    null,
    'recusa texto acima de 1000 caracteres'
);

select lives_ok(
    $$ update public.store_whatsapp_messages set interval_minutes = 10080 where type = 'greeting' $$,
    'aceita intervalo de 10080 minutos'
);

select throws_ok(
    $$ update public.store_whatsapp_messages set interval_minutes = 10081 where type = 'greeting' $$,
    '23514',
    null,
    'recusa intervalo acima de 10080 minutos'
);

select throws_ok(
    $$ update public.store_whatsapp_messages set interval_minutes = 0 where type = 'greeting' $$,
    '23514',
    null,
    'recusa intervalo zero'
);

select is(
    (select count(*)::int from public.store_whatsapp_sessions),
    1,
    'membro lê a sessão da loja'
);

select throws_ok(
    $$ update public.store_whatsapp_sessions set state = 'disconnected' $$,
    '42501',
    null,
    'membro não grava a sessão'
);

select set_config('request.jwt.claim.sub', '5e1d0000-0000-4000-8000-0000000000bb', true);
select set_config('request.jwt.claims', '{"sub": "5e1d0000-0000-4000-8000-0000000000bb", "role": "authenticated"}', true);

select is(
    (select count(*)::int from public.store_whatsapp_messages),
    0,
    'quem não é membro não lê mensagens'
);

with changed as (
    update public.store_whatsapp_messages set custom_body = 'Invasão' returning store_id
)
select is((select count(*)::int from changed), 0, 'quem não é membro não edita mensagens');

select is(
    (select count(*)::int from public.store_whatsapp_sessions),
    0,
    'quem não é membro não lê a sessão'
);

set local role anon;

select is(
    (select count(*)::int from public.store_whatsapp_messages),
    0,
    'visitante anônimo não lê mensagens'
);

select * from finish();

rollback;
