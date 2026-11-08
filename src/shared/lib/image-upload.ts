export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_IMAGE_SIDE = 1200

const OUTPUT_TYPE = 'image/webp'
const FALLBACK_TYPE = 'image/jpeg'
const OUTPUT_QUALITY = 0.85

type ImageFileInfo = { type: string; size: number }
type ImageSize = { width: number; height: number }

export function validateImageFile(file: ImageFileInfo): string | null {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return 'Use uma imagem JPEG, PNG ou WebP'
    }

    if (file.size > MAX_IMAGE_BYTES) {
        return 'A imagem deve ter no máximo 10 MB'
    }

    return null
}

// Só reduz: imagem que já cabe no limite mantém as dimensões originais.
export function computeOutputSize(width: number, height: number): ImageSize {
    const longestSide = Math.max(width, height)

    if (longestSide <= MAX_IMAGE_SIDE) {
        return { width, height }
    }

    const scale = MAX_IMAGE_SIDE / longestSide
    const outputSize = {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    }
    return outputSize
}

export type ImageFormat = { extension: 'webp' | 'jpg'; contentType: 'image/webp' | 'image/jpeg' }

// O conteúdo manda no formato: navegadores sem encoder WebP devolvem outro tipo
// sem erro, e o nome do arquivo precisa dizer o que ele realmente contém.
export function resolveImageFormat(blobType: string): ImageFormat {
    if (blobType === OUTPUT_TYPE) {
        return { extension: 'webp', contentType: 'image/webp' }
    }

    return { extension: 'jpg', contentType: 'image/jpeg' }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível converter a imagem'))),
            type,
            OUTPUT_QUALITY,
        )
    })
}

// Prefere WebP e cai para JPEG quando o navegador não sabe gerar WebP.
export async function reduceImage(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file)
    const { width, height } = computeOutputSize(bitmap.width, bitmap.height)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
        bitmap.close()
        throw new Error('Não foi possível processar a imagem')
    }

    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const webpBlob = await canvasToBlob(canvas, OUTPUT_TYPE)
    if (webpBlob.type === OUTPUT_TYPE) {
        return webpBlob
    }

    const jpegBlob = await canvasToBlob(canvas, FALLBACK_TYPE)
    return jpegBlob
}
