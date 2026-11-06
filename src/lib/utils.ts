import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * O tailwind-merge precisa conhecer os tamanhos de fonte do tailwind.config.ts.
 * Sem isso, "text-label text-vm-ink-muted" parecem duas cores e o tamanho é descartado.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display-xl', 'heading-l', 'numeral', 'title', 'body', 'body-sm', 'label'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
