import { useState, type ChangeEvent } from 'react'

import { uploadStoreImage } from '@/shared/api'
import { validateImageFile } from '@/shared/lib'
import { Button } from '@/shared/ui'

import styles from './panel-store.module.css'

const UPLOAD_FAILED_MESSAGE = 'Não deu para enviar a imagem. Tente de novo.'

type StoreImageFieldProps = {
    label: string
    previewClassName: string
    storeId: string
    imageUrl: string | null
    onChange: (imageUrl: string | null) => void
}

export function StoreImageField({ label, previewClassName, storeId, imageUrl, onChange }: StoreImageFieldProps) {
    const [error, setError] = useState<string | null>(null)
    const [isUploading, setUploading] = useState(false)

    async function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) {
            return
        }

        const validationError = validateImageFile(file)
        if (validationError) {
            setError(validationError)
            return
        }

        setUploading(true)
        setError(null)
        try {
            onChange(await uploadStoreImage(storeId, 'loja', file))
        } catch (uploadError) {
            console.error('Falha ao enviar imagem da loja', uploadError)
            setError(UPLOAD_FAILED_MESSAGE)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className={styles.field}>
            {label}
            <div className={styles.imageRow}>
                {imageUrl ? <img className={previewClassName} src={imageUrl} alt="" /> : null}
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    aria-label={imageUrl ? `Trocar ${label.toLowerCase()}` : `Enviar ${label.toLowerCase()}`}
                    disabled={isUploading}
                    onChange={handleChange}
                />
                {imageUrl ? (
                    <Button variant="ghost" onClick={() => onChange(null)}>
                        Remover {label.toLowerCase()}
                    </Button>
                ) : null}
            </div>
            {isUploading ? <span className={styles.hint}>Enviando a imagem</span> : null}
            {error ? <span className={styles.fieldError}>{error}</span> : null}
        </div>
    )
}
