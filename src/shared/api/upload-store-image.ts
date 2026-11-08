import { createLocalId, reduceImageToWebp, validateImageFile } from '@/shared/lib'

import { supabase } from './supabase'

const STORE_MEDIA_BUCKET = 'store-media'
const CACHE_CONTROL_SECONDS = '31536000'

export type StoreImageFolder = 'produtos' | 'adicionais'

// O primeiro segmento do caminho é o id da loja: a política do bucket libera
// o envio só para quem é membro dela.
export function buildStoreImagePath(storeId: string, folder: StoreImageFolder, imageId: string): string {
    const path = `${storeId}/${folder}/${imageId}.webp`
    return path
}

export async function uploadStoreImage(storeId: string, folder: StoreImageFolder, file: File): Promise<string> {
    const validationError = validateImageFile(file)
    if (validationError) {
        throw new Error(validationError)
    }

    const blob = await reduceImageToWebp(file)
    const path = buildStoreImagePath(storeId, folder, createLocalId())

    const { error } = await supabase.storage.from(STORE_MEDIA_BUCKET).upload(path, blob, {
        contentType: blob.type,
        cacheControl: CACHE_CONTROL_SECONDS,
    })
    if (error) {
        throw error
    }

    const { data } = supabase.storage.from(STORE_MEDIA_BUCKET).getPublicUrl(path)
    return data.publicUrl
}
