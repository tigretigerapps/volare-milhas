import { Outlet } from 'react-router'

import { alertasNaoLidosExemplo } from '@/data/exemplo'
import { BarraSuperior } from './BarraSuperior'

export function Layout() {
  return (
    <div className="min-h-dvh">
      <BarraSuperior alertasNaoLidos={alertasNaoLidosExemplo} />
      <main className="container py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
