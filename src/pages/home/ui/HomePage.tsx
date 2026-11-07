import { useEffect } from 'react'

import { ThemeProvider } from '@/shared/lib'
import { ThemeIcon } from '@/shared/ui'

import styles from './home-page.module.css'

export function HomePage() {
    useEffect(() => {
        document.title = 'JG Cardápio'
    }, [])

    return (
        <ThemeProvider folders={['base']}>
            <main className={styles.home}>
                <div className={styles.content}>
                    <h1>
                        <img className={styles.logo} src="/marca/logo-horizontal-branco.png" alt="JG Cardápio" />
                    </h1>
                    <p className={styles.lead}>Cardápio online com pedido direto no WhatsApp e painel em tempo real para a sua loja.</p>
                    <a className={styles.panelLink} href="/painel">
                        <ThemeIcon name="pedidos" size={20} />
                        Entrar no painel da loja
                    </a>
                </div>
            </main>
        </ThemeProvider>
    )
}
