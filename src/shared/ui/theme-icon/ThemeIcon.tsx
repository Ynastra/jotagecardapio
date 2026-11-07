import {
    ArrowLeft,
    Banknote,
    Bell,
    Bike,
    BookOpen,
    Check,
    ClipboardList,
    Clock,
    CreditCard,
    Flame,
    LogOut,
    MapPin,
    MessageCircle,
    MessageSquareText,
    Minus,
    Phone,
    Plus,
    QrCode,
    Search,
    Settings,
    Share2,
    ShoppingBag,
    Store,
    Tag,
    Trash2,
    TriangleAlert,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'

import { useThemeAsset } from '@/shared/lib'

import styles from './theme-icon.module.css'

// Cada nome é um slot: o arquivo `icone-<nome>.png` (ou .svg) na pasta do tema
// substitui o desenho provisório sem mexer no código.
const PROVISIONAL_ICONS = {
    sacola: ShoppingBag,
    busca: Search,
    voltar: ArrowLeft,
    fechar: X,
    mais: Plus,
    menos: Minus,
    lixeira: Trash2,
    check: Check,
    relogio: Clock,
    local: MapPin,
    entrega: Bike,
    retirada: Store,
    dinheiro: Banknote,
    cartao: CreditCard,
    pessoas: Users,
    observacao: MessageSquareText,
    alerta: TriangleAlert,
    destaque: Flame,
    promocao: Tag,
    compartilhar: Share2,
    telefone: Phone,
    pedidos: ClipboardList,
    sino: Bell,
    cardapio: BookOpen,
    configuracoes: Settings,
    sair: LogOut,
    whatsapp: MessageCircle,
    pix: QrCode,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof PROVISIONAL_ICONS

const DEFAULT_SIZE = 20

type ThemeIconProps = {
    name: IconName
    size?: number
    // Sem rótulo o ícone é decorativo e fica oculto para leitor de tela.
    label?: string
}

export function ThemeIcon({ name, size = DEFAULT_SIZE, label }: ThemeIconProps) {
    const assetUrl = useThemeAsset(`icone-${name}`)
    const accessibility = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }

    if (assetUrl) {
        // O arquivo do tema vem em uma cor só e vira máscara, para herdar a cor
        // do texto ao redor (e com ela a cor da marca de cada loja).
        const maskStyle = { '--icon-url': `url("${assetUrl}")`, '--icon-size': `${size}px` } as CSSProperties
        return <span className={styles.masked} style={maskStyle} {...accessibility} />
    }

    const ProvisionalIcon = PROVISIONAL_ICONS[name]
    return <ProvisionalIcon className={styles.provisional} size={size} strokeWidth={2} {...accessibility} />
}
