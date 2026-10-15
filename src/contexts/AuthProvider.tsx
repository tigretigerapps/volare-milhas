import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/integrations/supabase/client'
import { AuthContext, type AlteracaoPerfil, type Perfil, type ValorAuth } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [perfilCarregado, setPerfil] = useState<Perfil | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })

    // O callback não pode esperar outras chamadas ao Supabase (risco de travar o cliente):
    // só guarda a sessão, e o perfil é buscado no efeito abaixo.
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao)
      setCarregando(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  // Ignora um perfil que sobrou de outro usuário (ex.: logo depois de sair).
  const perfil = userId && perfilCarregado?.id === userId ? perfilCarregado : null

  useEffect(() => {
    if (!userId) return
    let cancelado = false
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) console.error('Erro ao carregar o perfil', error)
        setPerfil(data)
      })
    return () => {
      cancelado = true
    }
  }, [userId])

  const atualizarPerfil = useCallback(
    async (alteracao: AlteracaoPerfil) => {
      if (!userId) return { erro: 'Entre na sua conta para salvar.' }
      const { data, error } = await supabase
        .from('profiles')
        .update(alteracao)
        .eq('id', userId)
        .select()
        .maybeSingle()
      if (error || !data) {
        console.error('Erro ao salvar o perfil', error)
        return { erro: 'Não foi possível salvar. Tente de novo.' }
      }
      setPerfil(data)
      return { erro: null }
    },
    [userId],
  )

  const sair = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const valor = useMemo<ValorAuth>(
    () => ({ carregando, session, user: session?.user ?? null, perfil, atualizarPerfil, sair }),
    [carregando, session, perfil, atualizarPerfil, sair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
