import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { Menu } from 'lucide-react'

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type Props = {
  alertasNaoLidos: number
  /** Mostra o link do painel administrativo. */
  admin?: boolean
}

const links = [
  { para: '/buscar', rotulo: 'Buscar' },
  { para: '/rotas', rotulo: 'Minhas rotas', comBadge: true },
  { para: '/conta', rotulo: 'Conta' },
] as const

const linkAdmin = { para: '/admin', rotulo: 'Painel' } as const

function Badge({ valor }: { valor: number }) {
  return (
    <span
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-vm-burgundy-600 px-1.5 text-xs font-medium tabular-nums text-white"
      aria-label={`${valor} ${valor === 1 ? 'alerta novo' : 'alertas novos'}`}
    >
      {valor}
    </span>
  )
}

export function BarraSuperior({ alertasNaoLidos, admin = false }: Props) {
  const [menuAberto, setMenuAberto] = useState(false)
  const itens = admin ? [...links, linkAdmin] : links

  return (
    <header className="bg-vm-navy-900 text-white">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/buscar" className="text-xl font-medium tracking-tight">
          volare
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {itens.map((link) => (
              <li key={link.para}>
                <NavLink
                  to={link.para}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-normal text-white/75 transition-colors hover:text-white',
                      isActive && 'text-white underline decoration-[1.5px] underline-offset-[6px]',
                    )
                  }
                >
                  {link.rotulo}
                  {'comBadge' in link && alertasNaoLidos > 0 && <Badge valor={alertasNaoLidos} />}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetTrigger
            className="relative -mr-2 rounded-md p-2 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
            {alertasNaoLidos > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-vm-burgundy-600" aria-hidden />
            )}
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>volare</SheetTitle>
            <SheetDescription className="sr-only">Navegação principal</SheetDescription>
            <nav aria-label="Principal">
              <ul className="flex flex-col">
                {itens.map((link) => (
                  <li key={link.para} className="border-b border-vm-line last:border-b-0">
                    <NavLink
                      to={link.para}
                      onClick={() => setMenuAberto(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between py-3 text-base font-normal text-vm-ink-muted',
                          isActive && 'font-medium text-vm-navy-700',
                        )
                      }
                    >
                      {link.rotulo}
                      {'comBadge' in link && alertasNaoLidos > 0 && <Badge valor={alertasNaoLidos} />}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
