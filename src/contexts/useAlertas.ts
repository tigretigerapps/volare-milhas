import { useContext } from 'react'

import { AlertasContext } from './alertas-context'

export function useAlertas() {
  const valor = useContext(AlertasContext)
  if (!valor) throw new Error('useAlertas precisa estar dentro de <AlertasProvider>')
  return valor
}
