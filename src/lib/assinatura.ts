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
