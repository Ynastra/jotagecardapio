-- Dados locais: o cardápio do Zé do Burguer e uma conta de dono para testar o
-- painel. Só roda no banco local (supabase db reset); produção recebe a loja
-- pelo painel ou por script próprio, nunca este arquivo.

do $$
declare
    store uuid := '5e1d0000-0000-4000-8000-000000000001';
    owner uuid := '5e1d0000-0000-4000-8000-0000000000aa';
    burgers uuid := gen_random_uuid();
    portions uuid := gen_random_uuid();
    drinks uuid := gen_random_uuid();
    meat_point uuid := gen_random_uuid();
    combo uuid := gen_random_uuid();
    burger_boost uuid := gen_random_uuid();
    sauces uuid := gen_random_uuid();
    fries_boost uuid := gen_random_uuid();
    product record;
begin
    insert into public.stores (
        id, slug, name, address, whatsapp, brand_color, min_order_cents, delivery_fee_cents,
        prep_time_minutes, city, state, address_display, require_cep, order_copy_whatsapp,
        hide_unavailable_items, delivery_mode, delivery_max_km
    ) values (
        store, 'zedoburguerlucelia', 'Zé do Burguer',
        'Rua Francisco Xavier de Oliveira, 48, Lado Este, Lucélia - SP, 17780-043',
        '5518996649346', '#060504', 700, 800,
        30, 'Lucélia', 'SP', 'full', true, true,
        true, 'radius', 6
    );

    insert into public.store_payment_methods (store_id, method, enabled_delivery, enabled_pickup) values
        (store, 'pix', true, true),
        (store, 'cash', true, true),
        (store, 'credit', true, true),
        (store, 'debit', true, true),
        (store, 'meal_voucher', false, false),
        (store, 'food_voucher', false, false);

    insert into public.store_hours (store_id, weekday, opens_at, closes_at) values
        (store, 0, '18:30', '22:00'),
        (store, 1, '18:30', '22:00'),
        (store, 4, '18:30', '22:30'),
        (store, 5, '18:30', '22:30'),
        (store, 6, '18:30', '22:30');

    insert into public.categories (id, store_id, name, position) values
        (burgers, store, 'HAMBÚRGUERES', 0),
        (portions, store, 'PORÇÕES', 1),
        (drinks, store, 'BEBIDAS', 2);

    insert into public.products (
        store_id, category_id, name, description, price_cents, promo_price_cents, serves, portion_label, featured, position
    ) values
        (store, burgers, 'KIDS', 'Pão brioche macio, hambúrguer de 100g suculento, 1 fatia de cheddar e maionese da casa, em uma combinação irresistível para os pequenos.', 2399, null, 1, null, true, 0),
        (store, burgers, 'X-BURGUER', 'Pão de brioche macio, hambúrguer de 180g, 2 fatias de cheddar derretido, ketchup e mostarda, finalizado com cebola e picles de pepino para um toque agridoce e crocante.', 3099, null, 1, null, false, 1),
        (store, burgers, 'X-SALADA', 'Pão de brioche macio, hambúrguer de 180g, 2 fatias de cheddar derretido, alface, tomate, cebola e maionese da casa. O alface poderá ser substituído por rúcula; informe nas observações.', 3199, null, 1, null, false, 2),
        (store, burgers, 'X-BACON', 'Pão de brioche macio, hambúrguer de 180g, 2 fatias de cheddar derretido, 3 fatias de bacon crocante e maionese da casa, combinando suculência, cremosidade e textura irresistível.', 3399, null, 1, null, false, 3),
        (store, burgers, 'X-MELT', 'Pão de brioche macio, hambúrguer de 180g, molho de cheddar, cebola caramelizada e maionese da casa, em uma combinação cremosa e marcante.', 3099, null, 1, null, false, 4),
        (store, burgers, 'X-CHICKEN', 'Pão de brioche macio, hambúrguer de frango empanado de 100 g, 2 fatias de cheddar derretido, 2 fatias de bacon, molho barbecue (BBQ), alface e maionese da casa.', 3099, null, 1, null, true, 5),
        (store, portions, 'BATATA FRITA - SIMPLES P', 'Batata frita crocante, dourada e sequinha. Porção de 150g de batata, pesada antes do preparo. O clássico acompanhamento para seu hambúrguer!', 700, null, 1, '150 g', false, 0),
        (store, portions, 'BATATA FRITA - SIMPLES G', 'Batata frita crocante, dourada e sequinha. Porção de 500g de batata, pesada antes do preparo.', 2400, null, 2, '500 g', false, 1),
        (store, portions, 'BATATA FRITA - CHEDDAR E BACON G', 'Batata frita crocante, dourada e sequinha, coberta com um delicioso molho cheddar cremoso e finalizada com uma irresistível farofa de bacon crocante. Porção de 500g de batata, pesada antes do preparo.', 3600, null, 2, '500 g', false, 2),
        (store, portions, 'MINI CHICKENS', 'Mini Chickens crocantes, dourados e sequinhos. Porção de 6 unidades.', 1400, 1200, 1, '6 un', true, 3),
        (store, drinks, 'COCA COLA ORIGINAL', null, 700, null, 1, '350 ml', false, 0),
        (store, drinks, 'COCA COLA ZERO', null, 700, null, 1, '350 ml', false, 1),
        (store, drinks, 'GUARANÁ ANTARCTICA', null, 600, null, 1, '350 ml', false, 2),
        (store, drinks, 'GUARANÁ ANTARCTICA ZERO', null, 600, null, 1, '350 ml', false, 3),
        (store, drinks, 'FANTA LARANJA', null, 600, null, 1, '350 ml', false, 4),
        (store, drinks, 'SPRITE', null, 600, null, 1, '350 ml', false, 5);

    insert into public.option_groups (id, store_id, title) values
        (meat_point, store, 'Qual o ponto da carne?'),
        (combo, store, 'Deseja transformar em um combo?'),
        (burger_boost, store, 'Que tal turbinar seu hambúrguer?'),
        (sauces, store, 'Deseja adicionar nossos molhos?'),
        (fries_boost, store, 'Que tal turbinar a sua batata?');

    insert into public.options (store_id, group_id, name, description, price_cents, max_quantity, position) values
        (store, meat_point, 'Mal passado', null, 0, 1, 0),
        (store, meat_point, 'Ao ponto', null, 0, 1, 1),
        (store, meat_point, 'Bem passado', null, 0, 1, 2),
        (store, combo, 'Batata Individual', 'Porção de 150g (peso medido antes do preparo)', 700, 1, 0),
        (store, combo, 'Batata Individual + Coca Cola', 'Porção de 150g (peso medido antes do preparo) + refrigerante lata 350ml', 1200, 1, 1),
        (store, combo, 'Batata Individual + Coca Cola Zero', 'Porção de 150g (peso medido antes do preparo) + refrigerante lata 350ml', 1200, 1, 2),
        (store, combo, 'Batata Individual + Guaraná Antarctica', 'Porção de 150g (peso medido antes do preparo) + refrigerante lata 350ml', 1100, 1, 3),
        (store, combo, 'Batata Individual + Guaraná Antarctica Zero', 'Porção de 150g (peso medido antes do preparo) + refrigerante lata 350ml', 1100, 1, 4),
        (store, combo, 'Batata Individual + Fanta Laranja', 'Porção de 150g (peso medido antes do preparo) + refrigerante lata 350ml', 1100, 1, 5),
        (store, combo, 'Batata Individual + Sprite', 'Porção de 150g (peso medido antes do preparo) + refrigerante lata 350ml', 1100, 1, 6),
        (store, burger_boost, 'Hambúrguer Bovino 100g', null, 800, null, 0),
        (store, burger_boost, 'Hambúrguer Bovino 180g', null, 1200, null, 1),
        (store, burger_boost, 'Hambúrguer Chicken Empanado 100g', null, 900, null, 2),
        (store, burger_boost, 'Cheddar Fatiado 2x', null, 400, null, 3),
        (store, burger_boost, 'Bacon Fatiado 3x', null, 400, null, 4),
        (store, burger_boost, 'Farofa de Bacon (pote 30ml)', null, 800, null, 5),
        (store, burger_boost, 'Cebola Caramelizada', null, 300, null, 6),
        (store, burger_boost, 'Alface Americana', null, 200, null, 7),
        (store, burger_boost, 'Rúcula', null, 200, null, 8),
        (store, burger_boost, 'Tomate', null, 200, null, 9),
        (store, burger_boost, 'Cebola Branca', null, 100, null, 10),
        (store, burger_boost, 'Picles de Pepino Hemmer', null, 300, null, 11),
        (store, burger_boost, 'Molho Cheddar (pote 30ml)', null, 400, null, 12),
        (store, burger_boost, 'Molho BBQ (pote 30ml)', null, 200, null, 13),
        (store, burger_boost, 'Maionese da Casa (pote 30ml)', null, 300, null, 14),
        (store, burger_boost, 'Sachê Ketchup Hemmer 2un.', null, 100, null, 15),
        (store, burger_boost, 'Sachê Mostarda Hemmer 2un.', null, 100, null, 16),
        (store, sauces, 'Sachê Ketchup Hemmer', '2 unidades', 0, 1, 0),
        (store, sauces, 'Sachê Mostarda Hemmer', '2 unidades', 0, 1, 1),
        (store, sauces, 'Maionese da Casa', '1 unidade', 0, 1, 2),
        (store, sauces, 'Todos os Molhos', 'Ketchup, Mostarda e Maionese da Casa', 0, 1, 3),
        (store, sauces, 'Nenhum Molho', null, 0, 1, 4),
        (store, fries_boost, 'Molho Cheddar (pote 30ml)', null, 400, null, 0),
        (store, fries_boost, 'Farofa de Bacon (pote 30ml)', null, 800, null, 1);

    for product in select id, name from public.products where store_id = store and category_id = burgers loop
        if product.name in ('X-BURGUER', 'X-SALADA', 'X-BACON', 'X-MELT') then
            insert into public.product_option_groups (store_id, product_id, group_id, position, min_choices, max_choices)
            values (store, product.id, meat_point, 0, 1, 1);
        end if;
        insert into public.product_option_groups (store_id, product_id, group_id, position, min_choices, max_choices) values
            (store, product.id, combo, 1, 0, 1),
            (store, product.id, burger_boost, 2, 0, null),
            (store, product.id, sauces, 3, 1, 3);
    end loop;

    insert into public.product_option_groups (store_id, product_id, group_id, position, min_choices, max_choices)
    select store, id, fries_boost, 0, 0, null from public.products where store_id = store and category_id = portions;

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
