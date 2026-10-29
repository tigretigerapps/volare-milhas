import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { lerErroFuncao } from '@/lib/busca'

type Resultado = { erro: string | null; url?: string }
const falha = 'Não foi possível conectar o Telegram agora. Tente de novo em instantes.'

/** Situação do Telegram do usuário (conectado ou não) e as ações de conectar e desconectar. */
export function useTelegram() {
  const { user } = useAuth()
  const userId = user?.id
  const [conectadoEm, setConectadoEm] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase.from('telegram_vinculos').select('vinculado_em').eq('user_id', userId).maybeSingle()
    if (error) console.error('Erro ao carregar o Telegram', error)
    else setConectadoEm(data?.vinculado_em ?? null)
    setCarregando(false)
  }, [userId])

  useEffect(() => {
    let cancelado = false
    if (!userId) return
    const ler = () =>
      void supabase
        .from('telegram_vinculos')
        .select('vinculado_em')
        .eq('user_id', userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (cancelado) return
          if (error) console.error('Erro ao carregar o Telegram', error)
          else setConectadoEm(data?.vinculado_em ?? null)
          setCarregando(false)
        })
    ler()
    // O vínculo se completa no app do Telegram: ao voltar para esta aba, confere de novo.
    window.addEventListener('focus', ler)
    return () => {
      cancelado = true
      window.removeEventListener('focus', ler)
    }
  }, [userId])

  const conectar = useCallback(async (): Promise<Resultado> => {
    const { data, error } = await supabase.functions.invoke<{ url: string }>('telegram', { body: {} })
    if (error || !data?.url) {
      const { mensagem } = error ? await lerErroFuncao(error, falha) : { mensagem: falha }
      return { erro: mensagem }
    }
    return { erro: null, url: data.url }
  }, [])

  const desconectar = useCallback(async (): Promise<Resultado> => {
    if (!userId) return { erro: falha }
    const { error } = await supabase.from('telegram_vinculos').delete().eq('user_id', userId)
    if (error) {
      console.error('Erro ao desconectar o Telegram', error)
      return { erro: 'Não foi possível desconectar agora. Tente de novo.' }
    }
    await carregar()
    return { erro: null }
  }, [userId, carregar])

  return { conectado: conectadoEm !== null, carregando, conectar, desconectar }
}
