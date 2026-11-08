-- Fotos, logo e capa do Zé do Burguer, guardados no bucket store-media do
-- projeto de produção. As URLs apontam para lá também no banco local, para
-- local e produção usarem uma lista só. Pode rodar mais de uma vez: só grava
-- a URL, e produto que não está na lista continua sem foto.

do $$
declare
    store uuid := '5e1d0000-0000-4000-8000-000000000001';
    media_base text := 'https://aaqtogwuvailqlcrsptl.supabase.co/storage/v1/object/public/store-media/'
        || '5e1d0000-0000-4000-8000-000000000001';
begin
    update public.stores
    set logo_url = media_base || '/loja/logo.webp',
        cover_url = media_base || '/loja/capa.webp'
    where id = store;

    update public.products as product
    set image_url = media_base || '/produtos/' || photo.file_name
    from (values
        ('KIDS', 'kids.webp'),
        ('X-BURGUER', 'x-burguer.webp'),
        ('X-SALADA', 'x-salada.webp'),
        ('X-BACON', 'x-bacon.webp'),
        ('X-MELT', 'x-melt.webp'),
        ('X-CHICKEN', 'x-chicken.webp')
    ) as photo (product_name, file_name)
    where product.store_id = store
      and product.name = photo.product_name;
end;
$$;
