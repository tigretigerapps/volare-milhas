import { interpretarDecimalBR } from './numero-br'

/** Lê o milheiro digitado pelo usuário no formato brasileiro. Devolve null se não for um valor positivo. */
export const interpretarMilheiro = interpretarDecimalBR

/** 20 → "20,00", para preencher o campo de edição. */
export function milheiroParaCampo(valor: number): string {
  return valor.toFixed(2).replace('.', ',')
}
