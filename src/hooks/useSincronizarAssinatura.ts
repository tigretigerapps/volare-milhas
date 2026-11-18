import { useEffect, useRef } from 'react'

import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'

/** Intervalo entre as conferências quando a pessoa acabou de voltar do checkout do teste grátis. */
const INTERVALO_MS = 4000

/**
 * Rede de segurança do webhook do Asaas: quem tem assinatura pendente ou em atraso e abre a Conta ou a página
 * de assinatura tem a situação conferida no Asaas. Se já foi paga (ou o cartão do teste já foi cadastrado),
 * o plano é ativado e o perfil recarregado. `tentativas` > 1 repete a conferência, para quem volta do checkout
 * antes de o Asaas terminar de criar a assinatura.
 */
export function useSincronizarAssinatura(tentativas = 1) {
  const { perfil, recarregarPerfil } = useAuth()
  const situacao = perfil?.status_assinatura
  const jaConferiu = useRef(false)

  useEffect(() => {
    if (jaConferiu.current || (situacao !== 'pendente' && situacao !== 'inadimplente')) return
    jaConferiu.current = true
    let cancelado = false
    let espera: ReturnType<typeof setTimeout> | undefined

    const conferir = async (restantes: number) => {
      const { data, error } = await supabase.functions.invoke<{ status: string | null }>('assinar', {
        body: { acao: 'sincronizar' },
      })
      if (cancelado) return
      if (!error && data?.status === 'ativo') {
        void recarregarPerfil()
        return
      }
      if (restantes > 1) espera = setTimeout(() => void conferir(restantes - 1), INTERVALO_MS)
    }
    void conferir(tentativas)

    return () => {
      cancelado = true
      if (espera) clearTimeout(espera)
    }
  }, [situacao, recarregarPerfil, tentativas])
}
