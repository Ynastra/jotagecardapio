import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/ui'

import styles from './panel-home.module.css'

type InProgressCardProps = {
    count: number
}

export function InProgressCard({ count }: InProgressCardProps) {
    const navigate = useNavigate()

    return (
        <section className={`${styles.section} ${styles.inProgress}`} aria-labelledby="em-andamento">
            <div className={styles.inProgressText}>
                <h2 id="em-andamento" className={styles.sectionTitle}>
                    Pedidos em andamento
                </h2>
                {count === 0 ? (
                    <p className={styles.muted}>Nenhum pedido em andamento</p>
                ) : (
                    <p className={styles.inProgressCount}>{count}</p>
                )}
            </div>
            <Button variant="secondary" onClick={() => navigate('/painel/pedidos')}>
                Abrir Pedidos
            </Button>
        </section>
    )
}
