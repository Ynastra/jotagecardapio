export type WhatsappSessionState = 'connected' | 'connecting' | 'disconnected'

export const AUTO_NOTIFY_SENT_MESSAGE = 'Cliente avisado no WhatsApp'
export const AUTO_NOTIFY_FAILED_MESSAGE = 'Não deu para avisar no WhatsApp. Use Avisar cliente.'

export function shouldSendAutomatically(sessionState: WhatsappSessionState | null, message: string | null): boolean {
    const hasActiveMessage = message !== null && message !== ''
    const shouldSend = sessionState === 'connected' && hasActiveMessage
    return shouldSend
}
