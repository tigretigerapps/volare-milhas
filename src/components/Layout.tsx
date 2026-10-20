import { Outlet } from 'react-router'

import { useAlertas } from '@/contexts/useAlertas'
import { useAuth } from '@/contexts/useAuth'
import { BarraSuperior } from './BarraSuperior'

export function Layout() {
  const { naoVistos } = useAlertas()
  const { perfil } = useAuth()

  return (
    <div className="min-h-dvh">
      <BarraSuperior alertasNaoLidos={naoVistos} admin={perfil?.papel === 'admin'} />
      <main className="container py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
