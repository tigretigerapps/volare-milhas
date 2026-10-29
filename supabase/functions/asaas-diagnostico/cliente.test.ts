import { describe, expect, it } from 'vitest'

import { consultar, removerPenalizacao } from './cliente.ts'

function simulador(status: number, corpo: unknown = {}) {
  const chamadas: { url: string; init: RequestInit }[] = []
  const req = ((url: string, init: RequestInit) => {
    chamadas.push({ url, init })
    return Promise.resolve(new Response(status === 204 ? null : JSON.stringify(corpo), { status }))
  }) as typeof fetch
  return { chamadas, req }
}

describe('cliente do diagnóstico', () => {
  it('consulta com GET, sem corpo e com a chave no header', async () => {
    const { chamadas, req } = simulador(200, { data: [] })
    const r = await consultar('sandbox', 'CHAVE', '/webhooks?limit=20', req)
    expect(r).toEqual({ status: 200, corpo: { data: [] } })
    expect(chamadas[0].url).toBe('https://api-sandbox.asaas.com/v3/webhooks?limit=20')
    expect(chamadas[0].init.method).toBe('GET')
    expect(chamadas[0].init.body).toBeUndefined()
    expect((chamadas[0].init.headers as Record<string, string>).access_token).toBe('CHAVE')
  })

  it('remove a penalização com POST e entende o 204', async () => {
    const { chamadas, req } = simulador(204)
    expect(await removerPenalizacao('sandbox', 'CHAVE', 'wh_1', req)).toEqual({ ok: true, status: 204 })
    expect(chamadas[0].url).toBe('https://api-sandbox.asaas.com/v3/webhooks/wh_1/removeBackoff')
    expect(chamadas[0].init.method).toBe('POST')
  })

  it('avisa quando o Asaas recusa', async () => {
    const { req } = simulador(404, {})
    expect(await removerPenalizacao('producao', 'CHAVE', 'wh_x', req)).toEqual({ ok: false, status: 404 })
  })
})
