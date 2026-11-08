-- Dados só do banco local: a conta de teste do dono e o vínculo dela com a loja
-- carregada por supabase/carga/zedoburguerlucelia.sql. Não deve ir para
-- produção, onde o dono é criado pelo painel de autenticação.

do $$
declare
    store uuid := '5e1d0000-0000-4000-8000-000000000001';
    owner uuid := '5e1d0000-0000-4000-8000-0000000000aa';
begin
    -- O serviço de autenticação não aceita nulo nas colunas de token ao ler o
    -- usuário no login, por isso as strings vazias.
    insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
        '00000000-0000-0000-0000-000000000000', owner, 'authenticated', 'authenticated', 'dono@zedoburguer.test',
        extensions.crypt('cardapio-local-123', extensions.gen_salt('bf')), now(),
        '', '', '', '', '', '', '', '',
        '{"provider": "email", "providers": ["email"]}'::jsonb, '{"email_verified": true}'::jsonb, now(), now()
    );

    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (
        gen_random_uuid(), owner, owner::text, 'email',
        jsonb_build_object('sub', owner::text, 'email', 'dono@zedoburguer.test', 'email_verified', true),
        now(), now(), now()
    );

    insert into public.store_members (store_id, user_id, role) values (store, owner, 'owner');
end;
$$;
