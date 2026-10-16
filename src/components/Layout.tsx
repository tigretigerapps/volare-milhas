import { Outlet } from 'react-router'

import { useAlertas } from '@/contexts/useAlertas'
import { BarraSuperior } from './BarraSuperior'

export function Layout() {
  const { naoVistos } = useAlertas()

  return (
    <div className="min-h-dvh">
      <BarraSuperior alertasNaoLidos={naoVistos} />
      <main className="container py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
