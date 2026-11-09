import { useEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from 'react'

import type { OrderPaymentStatus, OrderStatus, PanelOrder } from '@/entities/order'
import type { Store } from '@/entities/store'
import { Button, ThemeIcon } from '@/shared/ui'

import { getNextStep, getPreviousStatus, isActiveOrder } from '../model/order-flow'
import { OrderDetail } from './OrderDetail'
import styles from './order-drawer.module.css'

type OrderDrawerProps = {
    order: PanelOrder
    store: Store
    trackingUrl: string
    notifyUrl: string | null
    isPending: boolean
    onClose: () => void
    onChangeStatus: (orderId: string, status: OrderStatus) => void
    onChangePayment: (orderId: string, paymentStatus: OrderPaymentStatus) => void
    onPrint: (order: PanelOrder) => void
}

export function OrderDrawer({
    order,
    store,
    trackingUrl,
    notifyUrl,
    isPending,
    onClose,
    onChangeStatus,
    onChangePayment,
    onPrint,
}: OrderDrawerProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [isConfirmingCancel, setConfirmingCancel] = useState(false)
    const nextStep = getNextStep(order.status, order.fulfillment)
    const previousStatus = getPreviousStatus(order.status)
    const isActive = isActiveOrder(order)

    useEffect(() => {
        const dialog = dialogRef.current
        const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
        dialog?.showModal()
        return () => {
            dialog?.close()
            opener?.focus()
        }
    }, [])

    function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
        if (event.target === dialogRef.current) {
            onClose()
        }
    }

    function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
        event.preventDefault()
        onClose()
    }

    function cancelOrder() {
        onChangeStatus(order.id, 'canceled')
        setConfirmingCancel(false)
    }

    return (
        <dialog
            ref={dialogRef}
            className={styles.drawer}
            aria-label={`Pedido ${order.publicCode}`}
            onCancel={handleCancel}
            onClick={handleBackdropClick}
        >
            <div className={styles.panel}>
                <header className={styles.header}>
                    <h2 className={styles.title}>Pedido {order.publicCode}</h2>
                    <button type="button" className={styles.link} onClick={() => onPrint(order)}>
                        Imprimir
                    </button>
                    <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
                        <ThemeIcon name="fechar" size={22} />
                    </button>
                </header>

                <div className={styles.body}>
                    <OrderDetail
                        order={order}
                        store={store}
                        trackingUrl={trackingUrl}
                        notifyUrl={notifyUrl}
                        isPending={isPending}
                        onChangePayment={onChangePayment}
                    />
                </div>

                <footer className={styles.footer}>
                    {isConfirmingCancel ? (
                        <div className={styles.confirm} role="alert">
                            <p>Cancelar o pedido {order.publicCode}? O cliente não é avisado sozinho.</p>
                            <div className={styles.footerRow}>
                                <Button variant="secondary" onClick={() => setConfirmingCancel(false)}>
                                    Manter pedido
                                </Button>
                                <Button disabled={isPending} onClick={cancelOrder}>
                                    Sim, cancelar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {nextStep ? (
                                <Button wide disabled={isPending} onClick={() => onChangeStatus(order.id, nextStep.next)}>
                                    {nextStep.label}
                                </Button>
                            ) : null}
                            <div className={styles.footerRow}>
                                {previousStatus ? (
                                    <Button
                                        variant="secondary"
                                        disabled={isPending}
                                        onClick={() => onChangeStatus(order.id, previousStatus)}
                                    >
                                        Voltar status
                                    </Button>
                                ) : null}
                                {isActive ? (
                                    <Button variant="ghost" disabled={isPending} onClick={() => setConfirmingCancel(true)}>
                                        Cancelar pedido
                                    </Button>
                                ) : null}
                            </div>
                        </>
                    )}
                </footer>
            </div>
        </dialog>
    )
}
