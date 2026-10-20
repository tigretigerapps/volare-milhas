import { describe, expect, it } from 'vitest'

import { criarSolicitacao } from './iddas.ts'
import { limparNomeCidade, montarSolicitacao, nomeDoCliente, normalizarTelefone, type DadosLead, type OfertaLinha } from './payload.ts'
import { validarPedidoLead } from './validacao.ts'

const oferta: OfertaLinha = {
  origem: 'SAO',
  destino: 'SSA',
  data_voo: '2026-12-15',
  sentido: 'ida',
  companhia: 'GOL',
  programa: 'Smiles',
  tipo_milhas: 'Smiles',
  numero_voo: '1234',
  cabine: 'Econômica',
  conexoes: 0,
  partida: '2026-12-15T08:10:00',
  chegada: '2026-12-15T10:30:00',
  milhas: 12500,
  taxas_rs: 80,
  valor_dinheiro_rs: 900,
}

const dados: DadosLead = {
  nome: 'Rafael Gomes',
  email: 'rafael@exemplo.com',
  telefone: '(11) 91234-5678',
  oferta,
  dataIdaBusca: '2026-12-15',
  dataVoltaBusca: '2026-12-20',
  cidadeOrigem: 'São Paulo',
  cidadeDestino: 'Salvador',
  milheiroCliente: 20,
  referencia: 'VM-AB12CD34',
  fonteDados: 'mock',
}

describe('normalizarTelefone', () => {
  it('formata telefones brasileiros para o padrão do CRM', () => {
    expect(normalizarTelefone('(11) 91234-5678')).toBe('+5511912345678')
    expect(normalizarTelefone('11 3456-7890')).toBe('+551134567890')
    expect(normalizarTelefone('+55 11 91234-5678')).toBe('+5511912345678')
  })
  it('recusa números que não dão telefone', () => {
    expect(normalizarTelefone('123')).toBeNull()
    expect(normalizarTelefone('')).toBeNull()
    expect(normalizarTelefone('abc')).toBeNull()
  })
})

describe('montarSolicitacao', () => {
  it('monta o pedido de uma oferta de ida com volta pedida na busca', () => {
    const s = montarSolicitacao(dados)
    expect(s).toMatchObject({
      nome: 'Rafael Gomes',
      email: 'rafael@exemplo.com',
      telefone: '+5511912345678',
      origem: 'São Paulo (SAO)',
      destino: 'Salvador (SSA)',
      data_ida: '2026-12-15',
      data_volta: '2026-12-20',
      passageiro_adulto: '1',
    })
    expect(s.observacao).toContain('VM-AB12CD34')
    expect(s.observacao).toContain('GOL, voo 1234, voo direto, saída 08:10, chegada 10:30')
    expect(s.observacao).toContain('12.500 milhas + R$ 80,00 de taxas')
    expect(s.observacao).toContain('Em dinheiro: R$ 900,00')
    expect(s.observacao).toContain('Milheiro do cliente: R$ 20,00')
    expect(s.observacao).toContain('dados de teste')
  })

  it('numa oferta de volta, a viagem segue a direção da ida e a data da oferta vira a volta', () => {
    const volta = { ...oferta, sentido: 'volta', origem: 'SSA', destino: 'SAO', data_voo: '2026-12-20' }
    const s = montarSolicitacao({ ...dados, oferta: volta })
    expect(s.origem).toBe('São Paulo (SAO)')
    expect(s.destino).toBe('Salvador (SSA)')
    expect(s.data_ida).toBe('2026-12-15')
    expect(s.data_volta).toBe('2026-12-20')
  })

  it('sem nome de cidade usa só o código; sem volta nem e-mail omite os campos; dados reais não levam aviso de teste', () => {
    const s = montarSolicitacao({ ...dados, cidadeOrigem: null, cidadeDestino: null, dataVoltaBusca: null, email: null, fonteDados: 'real' })
    expect(s.origem).toBe('SAO')
    expect(s.destino).toBe('SSA')
    expect('data_volta' in s).toBe(false)
    expect('email' in s).toBe(false)
    expect(s.observacao).not.toContain('dados de teste')
  })

  it('inclui o canal só quando configurado', () => {
    expect(montarSolicitacao(dados).canal_venda).toBeUndefined()
    expect(montarSolicitacao(dados, '3').canal_venda).toBe('3')
  })
})

describe('nomes', () => {
  it('usa o nome do perfil, depois o começo do e-mail', () => {
    expect(nomeDoCliente(' Ana ', 'a@b.com')).toBe('Ana')
    expect(nomeDoCliente(null, 'ana@b.com')).toBe('ana')
    expect(nomeDoCliente(null, null)).toBe('Cliente Volare Milhas')
  })
  it('limpa o nome da cidade vindo do navegador', () => {
    expect(limparNomeCidade('  São\nPaulo ')).toBe('São Paulo')
    expect(limparNomeCidade('x'.repeat(100))).toHaveLength(60)
    expect(limparNomeCidade('')).toBeNull()
    expect(limparNomeCidade(5)).toBeNull()
  })
})

describe('validarPedidoLead', () => {
  const base = { oferta_id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301', data_ida: '2026-12-15' }
  it('aceita o pedido mínimo', () => {
    const r = validarPedidoLead(base)
    expect(r).toMatchObject({ ok: true, pedido: { dataVolta: null, cidadeOrigem: null } })
  })
  it('recusa id e datas inválidos', () => {
    expect(validarPedidoLead({ ...base, oferta_id: 'abc' })).toMatchObject({ ok: false })
    expect(validarPedidoLead({ ...base, data_ida: '2026-02-30' })).toMatchObject({ ok: false })
    expect(validarPedidoLead({ ...base, data_volta: 'amanhã' })).toMatchObject({ ok: false })
    expect(validarPedidoLead(null)).toMatchObject({ ok: false })
  })
})

describe('criarSolicitacao', () => {
  const resposta = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status })

  it('faz login e depois cria a solicitação com o token', async () => {
    const chamadas: { url: string; init?: RequestInit }[] = []
    const req = ((url: string, init?: RequestInit) => {
      chamadas.push({ url, init })
      return Promise.resolve(url.endsWith('/auth/login') ? resposta(200, { access_token: 'T' }) : resposta(201, { success: true, data: { id: 42, message: 'ok' } }))
    }) as typeof fetch

    const id = await criarSolicitacao('CHAVE', montarSolicitacao(dados), req)
    expect(id).toBe(42)
    expect(chamadas.map((c) => c.url)).toEqual([
      'https://apiagencia.iddas.com.br/api/v1/auth/login',
      'https://apiagencia.iddas.com.br/api/v1/solicitacao',
    ])
    expect(JSON.parse(String(chamadas[0].init?.body))).toEqual({ chave: 'CHAVE' })
    const cabecalhos = (chamadas[1].init?.headers ?? {}) as Record<string, string>
    expect(cabecalhos.Authorization).toBe('Bearer T')
  })

  it('falha com clareza quando o login ou a criação são recusados', async () => {
    const login404 = (() => Promise.resolve(resposta(404, { error: 'x' }))) as typeof fetch
    await expect(criarSolicitacao('x', montarSolicitacao(dados), login404)).rejects.toThrow('login no CRM falhou (HTTP 404)')

    const recusa = ((url: string) =>
      Promise.resolve(url.endsWith('/auth/login') ? resposta(200, { access_token: 'T' }) : resposta(400, { error: 'bad' }))) as typeof fetch
    await expect(criarSolicitacao('x', montarSolicitacao(dados), recusa)).rejects.toThrow('CRM recusou a solicitação (HTTP 400)')
  })
})
