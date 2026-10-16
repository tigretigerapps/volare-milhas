import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'

export type Plano = Tables<'planos'>

/**
 * Limites do plano do usuário (destinos por dia, rotas com alerta).
 * `limiteRotas` e `limiteDestinos`: número, null = sem limite (administrador), undefined = ainda carregando.
 */
export function usePlano() {
  const { perfil } = useAuth()
  const codigo = perfil?.plano ?? null
  const [carregado, setCarregado] = useState<Plano | null>(null)

  useEffect(() => {
    if (!codigo) return
    let cancelado = false
    supabase
      .from('planos')
      .select('*')
      .eq('plano', codigo)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) console.error('Erro ao carregar o plano', error)
        setCarregado(data)
      })
    return () => {
      cancelado = true
    }
  }, [codigo])

  const plano = codigo && carregado?.plano === codigo ? carregado : null
  const admin = perfil?.papel === 'admin'
  const assinaturaAtiva = perfil?.status_assinatura === 'ativo'

  let limiteRotas: number | null | undefined
  let limiteDestinos: number | null | undefined
  if (admin) {
    limiteRotas = null
    limiteDestinos = null
  } else if (perfil && !assinaturaAtiva) {
    limiteRotas = 0
    limiteDestinos = 0
  } else if (plano) {
    limiteRotas = plano.rotas_com_alerta
    limiteDestinos = plano.destinos_por_dia
  }

  return { plano, assinaturaAtiva, limiteRotas, limiteDestinos }
}
