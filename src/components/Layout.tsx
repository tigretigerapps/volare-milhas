import { Link, Outlet } from 'react-router'

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
      <footer className="container border-t border-vm-line py-6 text-sm text-vm-ink-muted">
        <nav aria-label="Informações legais" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/termos" className="underline underline-offset-4 decoration-vm-line hover:text-vm-navy-700 hover:decoration-vm-navy-700">
            Termos de uso
          </Link>
          <Link to="/privacidade" className="underline underline-offset-4 decoration-vm-line hover:text-vm-navy-700 hover:decoration-vm-navy-700">
            Política de privacidade
          </Link>
        </nav>
      </footer>
    </div>
  )
}
