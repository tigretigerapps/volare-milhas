/** Só os dígitos. */
export const soDigitos = (valor: string) => valor.replace(/\D/g, '')

function digitoVerificador(base: string, pesos: readonly number[]): number {
  const soma = [...base].reduce((acc, d, i) => acc + Number(d) * pesos[i], 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

const PESOS_CPF_1 = [10, 9, 8, 7, 6, 5, 4, 3, 2]
const PESOS_CPF_2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
const PESOS_CNPJ_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const PESOS_CNPJ_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

/** CPF (11 dígitos) ou CNPJ (14 dígitos) com os dígitos verificadores certos. Devolve só os dígitos, ou null. */
export function validarCpfCnpj(bruto: unknown): string | null {
  if (typeof bruto !== 'string') return null
  const d = soDigitos(bruto)
  if (/^(\d)\1+$/.test(d)) return null // 111.111.111-11 e parecidos passam na conta, mas não existem

  if (d.length === 11) {
    const d1 = digitoVerificador(d.slice(0, 9), PESOS_CPF_1)
    const d2 = digitoVerificador(d.slice(0, 9) + d1, PESOS_CPF_2)
    return d === d.slice(0, 9) + d1 + d2 ? d : null
  }
  if (d.length === 14) {
    const d1 = digitoVerificador(d.slice(0, 12), PESOS_CNPJ_1)
    const d2 = digitoVerificador(d.slice(0, 12) + d1, PESOS_CNPJ_2)
    return d === d.slice(0, 12) + d1 + d2 ? d : null
  }
  return null
}
