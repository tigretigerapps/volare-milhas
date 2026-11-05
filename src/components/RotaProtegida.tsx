import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { useAuth } from '@/contexts/useAuth'

/** Só mostra o conteúdo para quem entrou; os demais vão para /entrar e voltam depois. */
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { carregando, session } = useAuth()
  const location = useLocation()

  if (carregando) {
    return <p className="text-sm text-vm-ink-muted">Carregando…</p>
  }

  if (!session) {
    return <Navigate to="/entrar" replace state={{ de: location.pathname }} />
  }

  return children
}
