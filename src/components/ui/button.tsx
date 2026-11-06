import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Botões do design Volo (Docs/design/componentes.md):
 * - default (primário): uma ação principal por tela; navy-700, hover navy-900.
 * - contorno: CTA de linha ("Quero essa oferta", "Ver rota"); preenche com navy-700 no hover.
 * - link: texto dourado-escuro sublinhado ("Editar", "Ver destinos").
 * - pilula: ordenação; ativa quando aria-pressed.
 * Rótulos sempre com verbo, sem setas. Carregando: troque o texto e passe aria-busy.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-vm-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vm-navy-700 focus-visible:ring-offset-2 focus-visible:ring-offset-vm-surface-page disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border-1.5 border-vm-navy-700 bg-vm-navy-700 text-[15px] text-white enabled:hover:border-vm-navy-900 enabled:hover:bg-vm-navy-900 [a&]:hover:border-vm-navy-900 [a&]:hover:bg-vm-navy-900',
        contorno:
          'border-1.5 border-vm-navy-700 bg-vm-surface-card text-sm font-medium text-vm-navy-700 enabled:hover:bg-vm-navy-700 enabled:hover:text-white [a&]:hover:bg-vm-navy-700 [a&]:hover:text-white',
        fantasma: 'font-medium text-vm-navy-700 hover:bg-vm-line',
        link: 'text-sm font-medium text-vm-gold-700 underline underline-offset-[3px] hover:text-vm-navy-700',
        pilula:
          'rounded-vm-pill border border-vm-border-control bg-vm-surface-card text-[13px] font-medium text-vm-navy-700 aria-pressed:border-1.5 aria-pressed:border-vm-navy-700 aria-pressed:bg-vm-navy-700 aria-pressed:text-white',
      },
      size: {
        default: 'h-11 px-5',
        lg: 'h-12 px-7',
        sm: 'h-[38px] px-3.5',
        icon: 'h-11 w-11',
      },
    },
    compoundVariants: [
      // Link é texto: sem altura nem preenchimento de botão.
      { variant: 'link', class: 'h-auto px-0 py-0' },
      // Pílula: 36px no desktop e 44px no celular (alvo de toque).
      { variant: 'pilula', class: 'h-11 px-3.5 md:h-9' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
