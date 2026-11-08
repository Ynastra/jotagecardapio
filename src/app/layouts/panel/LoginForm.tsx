import { useState, type FormEvent } from 'react'

import { supabase } from '@/shared/api'
import { unlockChime } from '@/shared/lib'
import { Button, MakerSignature } from '@/shared/ui'

import styles from './panel-layout.module.css'

export function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isSubmitting, setSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        unlockChime()
        setSubmitting(true)

        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

        setSubmitting(false)
        setErrorMessage(error ? 'E-mail ou senha não conferem.' : null)
    }

    return (
        <>
            <form className={styles.login} onSubmit={handleSubmit}>
                <h1 className={styles.loginTitle}>Painel da loja</h1>
                <label className={styles.field}>
                    E-mail
                    <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
                <label className={styles.field}>
                    Senha
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </label>
                {errorMessage ? (
                    <p className={styles.error} role="alert">
                        {errorMessage}
                    </p>
                ) : null}
                <Button type="submit" wide disabled={isSubmitting}>
                    {isSubmitting ? 'Entrando' : 'Entrar'}
                </Button>
            </form>
            <MakerSignature className={styles.loginSignature} />
        </>
    )
}
