import { useEffect, useRef } from 'react'

import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'

/**
 * Rede de segurança do webhook do Asaas: quem tem assinatura pendente ou em atraso e abre a Conta ou a página
 * de assinatura tem a situação conferida no Asaas. Se já foi paga, o plano é ativado e o perfil recarregado.
 */
export function useSincronizarAssinatura() {
  const { perfil, recarregarPerfil } = useAuth()
  const situacao = perfil?.status_assinatura
  const jaConferiu = useRef(false)

  useEffect(() => {
    if (jaConferiu.current || (situacao !== 'pendente' && situacao !== 'inadimplente')) return
    jaConferiu.current = true
    void supabase.functions
      .invoke<{ status: string | null }>('assinar', { body: { acao: 'sincronizar' } })
      .then(({ data, error }) => {
        if (!error && data?.status === 'ativo') void recarregarPerfil()
      })
  }, [situacao, recarregarPerfil])
}
