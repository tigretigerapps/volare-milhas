import { describe, expect, it } from 'vitest'

import { traduzirErroAuth } from './erros-auth'

describe('traduzirErroAuth', () => {
  it('traduz códigos conhecidos', () => {
    expect(traduzirErroAuth({ code: 'invalid_credentials' })).toBe('E-mail ou senha incorretos.')
    expect(traduzirErroAuth({ code: 'user_already_exists' })).toMatch(/Já existe uma conta/)
  })

  it('trata limite de requisições pelo status', () => {
    expect(traduzirErroAuth({ status: 429 })).toMatch(/Muitas tentativas/)
  })

  it('cai numa mensagem genérica, sem expor o texto em inglês', () => {
    expect(traduzirErroAuth({ code: 'algo_novo', message: 'Something broke' })).toBe(
      'Não foi possível concluir agora. Tente de novo em instantes.',
    )
    expect(traduzirErroAuth(null)).toMatch(/Não foi possível/)
  })
})
