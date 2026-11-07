import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

import { supabase } from '@/shared/api'

// undefined enquanto a sessão salva ainda está sendo lida.
export function useSession(): Session | null | undefined {
    const [session, setSession] = useState<Session | null | undefined>(undefined)

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session))
        const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
        return () => data.subscription.unsubscribe()
    }, [])

    return session
}
