import { describe, expect, it } from 'vitest'

import { cancelarAssinatura, criarAssinatura, criarCliente, ErroAsaas, faturaEmAberto, URL_ASAAS } from './asaas.ts'
import { validarCpfCnpj } from './documento.ts'

describe('validarCpfCnpj', () => {
  it('aceita CPF e CNPJ válidos, com ou sem máscara', () => {
    expect(validarCpfCnpj('529.982.247-25')).toBe('52998224725')
    expect(validarCpfCnpj('52998224725')).toBe('52998224725')
    expect(validarCpfCnpj('11.222.333/0001-81')).toBe('11222333000181')
  })
  it('recusa dígito errado, tamanho errado, repetidos e lixo', () => {
    expect(validarCpfCnpj('529.982.247-26')).toBeNull()
    expect(validarCpfCnpj('11.222.333/0001-82')).toBeNull()
    expect(validarCpfCnpj('111.111.111-11')).toBeNull()
    expect(validarCpfCnpj('123')).toBeNull()
    expect(validarCpfCnpj('')).toBeNull()
    expect(validarCpfCnpj(null)).toBeNull()
    expect(validarCpfCnpj(52998224725)).toBeNull()
  })
})

type Chamada = { url: string; init: RequestInit }
function simulador(respostas: Record<string, { status?: number; corpo: unknown }>) {
  const chamadas: Chamada[] = []
  const req = ((url: string, init: RequestInit) => {
    chamadas.push({ url, init })
    const chave = Object.keys(respostas).find((k) => url.includes(k))
    const r = chave ? respostas[chave] : { status: 404, corpo: {} }
    return Promise.resolve(new Response(JSON.stringify(r.corpo), { status: r.status ?? 200 }))
  }) as typeof fetch
  return { chamadas, cliente: { ambiente: 'sandbox' as const, chave: 'CHAVE', req } }
}

describe('cliente do Asaas', () => {
  it('cria o cliente com a chave no header e devolve o id', async () => {
    const { chamadas, cliente } = simulador({ '/customers': { corpo: { id: 'cus_1' } } })
    const id = await criarCliente(cliente, { nome: 'Ana', cpfCnpj: '52998224725', email: 'a@b.com', celular: '11999990000', userId: 'u1' })
    expect(id).toBe('cus_1')
    expect(chamadas[0].url).toBe(`${URL_ASAAS.sandbox}/customers`)
    expect((chamadas[0].init.headers as Record<string, string>).access_token).toBe('CHAVE')
    expect(JSON.parse(String(chamadas[0].init.body))).toMatchObject({ name: 'Ana', cpfCnpj: '52998224725', externalReference: 'u1' })
  })

  it('cria a assinatura mensal com o pagamento escolhido na fatura', async () => {
    const { chamadas, cliente } = simulador({ '/subscriptions': { corpo: { id: 'sub_1' } } })
    const id = await criarAssinatura(cliente, { clienteId: 'cus_1', valor: 29.9, vencimento: '2026-10-21', descricao: 'Plano Base', userId: 'u1' })
    expect(id).toBe('sub_1')
    expect(JSON.parse(String(chamadas[0].init.body))).toEqual({
      customer: 'cus_1',
      billingType: 'UNDEFINED',
      value: 29.9,
      nextDueDate: '2026-10-21',
      cycle: 'MONTHLY',
      description: 'Plano Base',
      externalReference: 'u1',
    })
  })

  it('pega o link da fatura em aberto mais antiga e não manda corpo no GET', async () => {
    const { chamadas, cliente } = simulador({
      'status=PENDING': { corpo: { data: [{ status: 'PENDING', dueDate: '2026-11-21', invoiceUrl: 'https://asaas/novo' }] } },
      'status=OVERDUE': { corpo: { data: [{ status: 'OVERDUE', dueDate: '2026-10-21', invoiceUrl: 'https://asaas/velho' }] } },
    })
    expect(await faturaEmAberto(cliente, 'sub_1')).toBe('https://asaas/velho')
    expect(chamadas.every((c) => c.init.body === undefined)).toBe(true)
  })

  it('devolve null quando não há fatura em aberto', async () => {
    const { cliente } = simulador({ '/payments': { corpo: { data: [] } } })
    expect(await faturaEmAberto(cliente, 'sub_1')).toBeNull()
  })

  it('traduz a recusa do Asaas em ErroAsaas com a mensagem em português', async () => {
    const { cliente } = simulador({ '/customers': { status: 400, corpo: { errors: [{ code: 'invalid_object', description: 'O CPF/CNPJ informado é inválido.' }] } } })
    await expect(criarCliente(cliente, { nome: 'A', cpfCnpj: '1', email: null, celular: null, userId: 'u' })).rejects.toMatchObject({
      status: 400,
      descricao: 'O CPF/CNPJ informado é inválido.',
    })
    await expect(criarCliente(cliente, { nome: 'A', cpfCnpj: '1', email: null, celular: null, userId: 'u' })).rejects.toBeInstanceOf(ErroAsaas)
  })

  it('cancela a assinatura anterior com DELETE e aceita uma que já não existe', async () => {
    const { chamadas, cliente } = simulador({ '/subscriptions/sub_velha': { corpo: { deleted: true, id: 'sub_velha' } } })
    await cancelarAssinatura(cliente, 'sub_velha')
    expect(chamadas[0].init.method).toBe('DELETE')
    expect(chamadas[0].url).toBe(`${URL_ASAAS.sandbox}/subscriptions/sub_velha`)
    expect(chamadas[0].init.body).toBeUndefined()

    const { cliente: semAssinatura } = simulador({ '/subscriptions/sub_sumiu': { status: 404, corpo: {} } })
    await expect(cancelarAssinatura(semAssinatura, 'sub_sumiu')).resolves.toBeUndefined()

    const { cliente: caido } = simulador({ '/subscriptions/sub_x': { status: 500, corpo: {} } })
    await expect(cancelarAssinatura(caido, 'sub_x')).rejects.toBeInstanceOf(ErroAsaas)
  })
})
