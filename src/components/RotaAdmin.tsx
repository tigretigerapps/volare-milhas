import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import { useAuth } from '@/contexts/useAuth'

/** Só administradores veem o conteúdo (a proteção de verdade está nas políticas do banco; isto só evita telas vazias). */
export function RotaAdmin({ children }: { children: ReactNode }) {
  const { carregando, session, perfil } = useAuth()

  // Sem sessão, ou com sessão ainda sem perfil carregado, espera antes de decidir.
  if (carregando || (session && !perfil)) {
    return <p className="text-sm text-texto-secundario">Carregando…</p>
  }
  if (!session) return <Navigate to="/entrar" replace state={{ de: '/admin' }} />
  if (perfil?.papel !== 'admin') return <Navigate to="/buscar" replace />
  return children
}
