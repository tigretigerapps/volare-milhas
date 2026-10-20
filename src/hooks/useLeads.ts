import { useCallback, useState } from 'react'

import type { Oferta } from '@/data/exemplo'
import { supabase } from '@/integrations/supabase/client'
import { buscarAeroportoPorCodigo } from '@/lib/aeroportos'
import { lerErroFuncao, type PedidoBuscaApp } from '@/lib/busca'

export type EstadoLead =
  | { tipo: 'enviando' }
  | { tipo: 'ok'; referencia: string; simulado: boolean }
  | { tipo: 'erro'; mensagem: string }

type RespostaLead = { modo?: 'simulado' | 'real'; referencia: string }

const falhaGenerica = 'Não foi possível enviar seu pedido agora. Tente de novo em instantes.'

/** "Quero essa oferta": envia o pedido à função criar-lead e guarda o estado de cada oferta. */
export function useLeads() {
  const [estados, setEstados] = useState<Record<string, EstadoLead>>({})

  const querer = useCallback(async (oferta: Oferta, pedido: PedidoBuscaApp) => {
    const definir = (estado: EstadoLead) => setEstados((atuais) => ({ ...atuais, [oferta.id]: estado }))
    definir({ tipo: 'enviando' })

    const { data, error } = await supabase.functions.invoke<RespostaLead>('criar-lead', {
      body: {
        oferta_id: oferta.id,
        data_ida: pedido.dataIda,
        data_volta: pedido.dataVolta,
        cidade_origem: buscarAeroportoPorCodigo(pedido.origem)?.cidade ?? null,
        cidade_destino: buscarAeroportoPorCodigo(pedido.destino)?.cidade ?? null,
      },
    })
    if (error || !data) {
      const { mensagem } = error ? await lerErroFuncao(error, falhaGenerica) : { mensagem: falhaGenerica }
      definir({ tipo: 'erro', mensagem })
      return
    }
    definir({ tipo: 'ok', referencia: data.referencia, simulado: data.modo === 'simulado' })
  }, [])

  return { estados, querer }
}
