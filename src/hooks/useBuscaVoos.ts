import { useCallback, useRef, useState } from 'react'

import type { Oferta } from '@/data/exemplo'
import { supabase } from '@/integrations/supabase/client'
import { lerErroFuncao, ofertaDoBanco, type ErroBusca, type PedidoBuscaApp, type Uso } from '@/lib/busca'

type RespostaFuncao = {
  modo: 'mock' | 'real'
  buscas: { companhia: string; status: 'ok' | 'erro'; busca_id: string | null; do_cache: boolean; mensagem?: string }[]
  uso: Uso
}

export type EstadoBusca =
  | { tipo: 'ocioso' }
  | { tipo: 'carregando' }
  | { tipo: 'erro'; erro: ErroBusca }
  | {
      tipo: 'pronto'
      pedido: PedidoBuscaApp
      ofertas: Oferta[]
      /** Mensagens das companhias que não responderam. */
      falhas: string[]
      uso: Uso
      /** "mock" = banco fake; os preços não são reais. */
      modo: 'mock' | 'real'
    }

const semConexao: ErroBusca = { codigo: 'erro', mensagem: 'Não foi possível buscar agora. Tente de novo em instantes.' }

/**
 * Busca de voos: chama a função buscar-voos (login, plano, limites, cache) e depois lê as ofertas
 * gravadas, com as regras de acesso do próprio usuário.
 */
export function useBuscaVoos() {
  const [estado, setEstado] = useState<EstadoBusca>({ tipo: 'ocioso' })
  // Só a busca mais recente atualiza a tela (o usuário pode buscar de novo antes da anterior terminar).
  const ultima = useRef(0)

  const buscar = useCallback(async (pedido: PedidoBuscaApp) => {
    const numero = ++ultima.current
    const atual = () => numero === ultima.current
    setEstado({ tipo: 'carregando' })

    const { data, error } = await supabase.functions.invoke<RespostaFuncao>('buscar-voos', { body: pedido })
    if (!atual()) return
    if (error || !data) {
      setEstado({ tipo: 'erro', erro: error ? await lerErroFuncao(error) : semConexao })
      return
    }

    const ids = data.buscas.flatMap((b) => (b.status === 'ok' && b.busca_id ? [b.busca_id] : []))
    const falhas = data.buscas.flatMap((b) => (b.status === 'erro' && b.mensagem ? [b.mensagem] : []))

    let ofertas: Oferta[] = []
    if (ids.length > 0) {
      const { data: linhas, error: erroLeitura } = await supabase.from('ofertas').select('*').in('busca_id', ids)
      if (!atual()) return
      if (erroLeitura) {
        console.error('Erro ao ler as ofertas', erroLeitura)
        setEstado({ tipo: 'erro', erro: semConexao })
        return
      }
      ofertas = linhas.flatMap((l) => {
        const oferta = ofertaDoBanco(l)
        return oferta ? [oferta] : []
      })
    }

    setEstado({ tipo: 'pronto', pedido, ofertas, falhas, uso: data.uso, modo: data.modo })
  }, [])

  return { estado, buscar }
}
