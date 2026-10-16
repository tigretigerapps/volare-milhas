import { createContext } from 'react'

import type { AlertaPrecoAlvo } from '@/lib/alertas'

export type ValorAlertas = {
  /** Alertas de preço-alvo, do mais novo ao mais antigo (cada oferta uma vez). */
  alertas: AlertaPrecoAlvo[]
  /** Alertas que chegaram depois da última vez que o usuário abriu Minhas rotas. */
  naoVistos: number
  /** O alerta mais novo, se ainda for recente; é o que aparece na faixa da busca. */
  recente: AlertaPrecoAlvo | null
  /** Registra que o usuário viu os alertas até agora. */
  marcarVistos: () => void
}

export const AlertasContext = createContext<ValorAlertas | null>(null)
