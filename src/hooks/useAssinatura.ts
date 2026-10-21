import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import { lerErroFuncao } from '@/lib/busca'

export type PlanoComPreco = Tables<'planos'>
type Resultado = { erro: string | null; faturaUrl?: string | null }

const falha = 'Não foi possível abrir o pagamento agora. Tente de novo em instantes.'

/** Planos com preço e as ações de assinar e de abrir a fatura em aberto. */
export function useAssinatura() {
  const [planos, setPlanos] = useState<PlanoComPreco[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false
    supabase
      .from('planos')
      .select('*')
      .order('preco_mensal')
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) console.error('Erro ao carregar os planos', error)
        else setPlanos(data)
        setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const chamar = useCallback(async (corpo: Record<string, unknown>): Promise<Resultado> => {
    const { data, error } = await supabase.functions.invoke<{ fatura_url: string | null }>('assinar', { body: corpo })
    if (error || !data) {
      const { mensagem } = error ? await lerErroFuncao(error, falha) : { mensagem: falha }
      return { erro: mensagem }
    }
    return { erro: null, faturaUrl: data.fatura_url }
  }, [])

  const assinar = useCallback((plano: string, cpfCnpj: string) => chamar({ plano, cpf_cnpj: cpfCnpj }), [chamar])
  const abrirFatura = useCallback(() => chamar({ acao: 'fatura' }), [chamar])

  return { planos, carregando, assinar, abrirFatura }
}
