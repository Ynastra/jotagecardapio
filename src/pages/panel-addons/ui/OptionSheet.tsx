import { useState, type ChangeEvent, type FormEvent } from 'react'

import { uploadStoreImage } from '@/shared/api'
import { validateImageFile } from '@/shared/lib'
import { Button, Sheet } from '@/shared/ui'

import { OPTION_DESCRIPTION_MAX, OPTION_NAME_MAX, type AddonGroup, type AddonOption } from '../model/addon-group'
import { formatPriceText, validateOptionDraft, type OptionFormErrors, type OptionValue } from '../model/addon-form'
import styles from './addons.module.css'

type OptionSheetProps = {
    storeId: string
    groups: readonly AddonGroup[]
    option: AddonOption | null
    defaultGroupId: string
    onSave: (value: OptionValue) => Promise<boolean>
    onClose: () => void
}

const FORM_ID = 'formulario-item'
const UPLOAD_FAILED_MESSAGE = 'Não deu para enviar a imagem. Tente de novo.'

export function OptionSheet({ storeId, groups, option, defaultGroupId, onSave, onClose }: OptionSheetProps) {
    const [groupId, setGroupId] = useState(option?.groupId ?? defaultGroupId)
    const [name, setName] = useState(option?.name ?? '')
    const [description, setDescription] = useState(option?.description ?? '')
    const [priceText, setPriceText] = useState(option ? formatPriceText(option.priceCents) : '')
    const [maxQuantityText, setMaxQuantityText] = useState(option?.maxQuantity?.toString() ?? '')
    const [imageUrl, setImageUrl] = useState<string | null>(option?.imageUrl ?? null)
    const [errors, setErrors] = useState<OptionFormErrors>({})
    const [imageError, setImageError] = useState<string | null>(null)
    const [isUploading, setUploading] = useState(false)
    const [isSaving, setSaving] = useState(false)

    async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) {
            return
        }

        const validationError = validateImageFile(file)
        if (validationError) {
            setImageError(validationError)
            return
        }

        setUploading(true)
        setImageError(null)
        try {
            const url = await uploadStoreImage(storeId, 'adicionais', file)
            setImageUrl(url)
        } catch (error) {
            console.error('Falha ao enviar imagem do item', error)
            setImageError(UPLOAD_FAILED_MESSAGE)
        } finally {
            setUploading(false)
        }
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        const result = validateOptionDraft({ groupId, name, description, priceText, maxQuantityText, imageUrl })
        setErrors(result.errors)
        if (!result.value) {
            return
        }

        setSaving(true)
        const saved = await onSave(result.value)
        setSaving(false)
        if (saved) {
            onClose()
        }
    }

    const footer = (
        <div className={styles.sheetFooter}>
            <Button variant="secondary" onClick={onClose}>
                Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} disabled={isSaving || isUploading}>
                Salvar
            </Button>
        </div>
    )

    return (
        <Sheet title={option ? 'Editar item' : 'Novo item'} onClose={onClose} footer={footer}>
            <form id={FORM_ID} className={styles.form} onSubmit={handleSubmit} noValidate>
                <label className={styles.field}>
                    Grupo
                    <select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.title}
                            </option>
                        ))}
                    </select>
                    {errors.groupId ? <span className={styles.fieldError}>{errors.groupId}</span> : null}
                </label>

                <div className={styles.field}>
                    Foto
                    <div className={styles.imageRow}>
                        {imageUrl ? <img className={styles.imagePreview} src={imageUrl} alt="" /> : null}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            aria-label="Escolher foto"
                            disabled={isUploading}
                            onChange={handleImageChange}
                        />
                        {imageUrl ? (
                            <Button variant="ghost" onClick={() => setImageUrl(null)}>
                                Remover foto
                            </Button>
                        ) : null}
                    </div>
                    {isUploading ? <span className={styles.hint}>Enviando a imagem</span> : null}
                    {imageError ? <span className={styles.fieldError}>{imageError}</span> : null}
                </div>

                <label className={styles.field}>
                    Nome
                    <input value={name} maxLength={OPTION_NAME_MAX} onChange={(event) => setName(event.target.value)} />
                    {errors.name ? <span className={styles.fieldError}>{errors.name}</span> : null}
                </label>

                <label className={styles.field}>
                    Descrição
                    <textarea
                        rows={3}
                        value={description}
                        maxLength={OPTION_DESCRIPTION_MAX}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                    <span className={styles.hint}>
                        {description.length}/{OPTION_DESCRIPTION_MAX}
                    </span>
                    {errors.description ? <span className={styles.fieldError}>{errors.description}</span> : null}
                </label>

                <label className={styles.field}>
                    Preço
                    <input
                        inputMode="decimal"
                        placeholder="0,00"
                        value={priceText}
                        onChange={(event) => setPriceText(event.target.value)}
                    />
                    {errors.priceText ? <span className={styles.fieldError}>{errors.priceText}</span> : null}
                </label>

                <label className={styles.field}>
                    Máximo por pedido
                    <input
                        inputMode="numeric"
                        placeholder="Sem limite"
                        value={maxQuantityText}
                        onChange={(event) => setMaxQuantityText(event.target.value)}
                    />
                    {errors.maxQuantityText ? <span className={styles.fieldError}>{errors.maxQuantityText}</span> : null}
                </label>
            </form>
        </Sheet>
    )
}
