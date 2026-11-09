-- Fotos, logo e capa do Zé do Burguer, guardados no bucket store-media do
-- projeto de produção. As URLs apontam para lá também no banco local, para
-- local e produção usarem uma lista só. Pode rodar mais de uma vez: só grava
-- a URL, e produto que não está na lista continua sem foto.
--
-- Arquivo trocado ganha nome novo em vez de sobrescrever o antigo: o Storage
-- recusa reenviar a mesma chave, e a URL nova não fica presa no cache do CDN.

do $$
declare
    store uuid := '5e1d0000-0000-4000-8000-000000000001';
    media_base text := 'https://aaqtogwuvailqlcrsptl.supabase.co/storage/v1/object/public/store-media/'
        || '5e1d0000-0000-4000-8000-000000000001';
begin
    update public.stores
    set logo_url = media_base || '/loja/logo-alta.webp',
        cover_url = media_base || '/loja/capa.webp'
    where id = store;

    update public.products as product
    set image_url = media_base || '/produtos/' || photo.file_name
    from (values
        ('KIDS', 'kids-estudio.webp'),
        ('X-BURGUER', 'x-burguer-estudio.webp'),
        ('X-SALADA', 'x-salada-estudio.webp'),
        ('X-BACON', 'x-bacon-estudio.webp'),
        ('X-MELT', 'x-melt-estudio.webp'),
        ('X-CHICKEN', 'x-chicken-estudio.webp'),
        ('BATATA FRITA - SIMPLES P', 'batata-simples-p.webp'),
        ('BATATA FRITA - SIMPLES G', 'batata-simples-g.webp'),
        ('BATATA FRITA - CHEDDAR E BACON G', 'batata-cheddar-bacon-g.webp'),
        ('COCA COLA ORIGINAL', 'coca-cola-original.webp'),
        ('COCA COLA ZERO', 'coca-cola-zero.webp'),
        ('GUARANÁ ANTARCTICA', 'guarana-antarctica.webp'),
        ('GUARANÁ ANTARCTICA ZERO', 'guarana-antarctica-zero.webp'),
        ('FANTA LARANJA', 'fanta-laranja.webp'),
        ('SPRITE', 'sprite.webp')
    ) as photo (product_name, file_name)
    where product.store_id = store
      and product.name = photo.product_name;
end;
$$;
