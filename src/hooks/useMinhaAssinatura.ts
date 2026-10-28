import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import { lerErroFuncao } from '@/lib/busca'

type Resultado = { erro: string | null }
const falha = 'Não foi possível concluir agora. Tente de novo em instantes.'

/** A assinatura do usuário (a própria linha de subscriptions) e as ações de cancelar e reativar. */
export function useMinhaAssinatura() {
  const { user, perfil } = useAuth()
  const userId = user?.id
  const [assinatura, setAssinatura] = useState<Tables<'subscriptions'> | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle()
    if (error) console.error('Erro ao carregar a assinatura', error)
    else setAssinatura(data)
    setCarregando(false)
  }, [userId])

  // Recarrega também quando a situação no perfil muda (por exemplo, depois da conferência do pagamento).
  const situacaoNoPerfil = perfil?.status_assinatura
  useEffect(() => {
    let cancelado = false
    if (!userId) return
    void supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) console.error('Erro ao carregar a assinatura', error)
        else setAssinatura(data)
        setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [userId, situacaoNoPerfil])

  const chamar = useCallback(
    async (corpo: Record<string, unknown>): Promise<Resultado & { faturaUrl?: string | null }> => {
      const { data, error } = await supabase.functions.invoke<{ fatura_url?: string | null }>('assinar', { body: corpo })
      if (error || !data) {
        const { mensagem } = error ? await lerErroFuncao(error, falha) : { mensagem: falha }
        return { erro: mensagem }
      }
      await carregar()
      return { erro: null, faturaUrl: data.fatura_url }
    },
    [carregar],
  )

  const cancelar = useCallback(() => chamar({ acao: 'cancelar' }), [chamar])
  const reativar = useCallback((plano: string) => chamar({ plano }), [chamar])

  return { assinatura, carregando, cancelar, reativar }
}
