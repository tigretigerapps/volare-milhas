/** "52998224725" → "529.982.247-25"; 14 dígitos → "11.222.333/0001-81". Enquanto digita, formata o que já tem. */
export function formatarCpfCnpj(bruto: string): string {
  const d = bruto.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5')
}

/** Só confere o tamanho: o servidor valida os dígitos verificadores. */
export const documentoCompleto = (valor: string) => [11, 14].includes(valor.replace(/\D/g, '').length)

export const situacaoAssinatura: Record<string, string> = {
  pendente: 'aguardando pagamento',
  ativo: 'ativo',
  inadimplente: 'pagamento em atraso',
  cancelado: 'cancelado',
}

/** Confere os dígitos verificadores do CPF (11 dígitos; recusa sequências como 111.111.111-11). */
export function cpfValido(valor: string): boolean {
  const d = valor.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const digito = (ate: number) => {
    let soma = 0
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10])
}
