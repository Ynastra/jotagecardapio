export const PANEL_MENU_ID = 'menu-do-painel'

export type MenuItem = {
    path: string
    label: string
    isReady: boolean
}

// Cada tela marca `isReady` quando é entregue; as demais aparecem como "Em breve".
export const MENU_ITEMS: readonly MenuItem[] = [
    { path: 'inicio', label: 'Início', isReady: false },
    { path: 'pedidos', label: 'Pedidos', isReady: true },
    { path: 'produtos', label: 'Produtos', isReady: false },
    { path: 'adicionais', label: 'Adicionais', isReady: false },
    { path: 'whatsapp', label: 'WhatsApp', isReady: false },
    { path: 'minha-loja', label: 'Minha loja', isReady: false },
    { path: 'pagamento', label: 'Pagamento', isReady: false },
    { path: 'horarios', label: 'Horários', isReady: false },
    { path: 'entrega', label: 'Entrega', isReady: false },
]
