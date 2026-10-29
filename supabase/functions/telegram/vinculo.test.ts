import { describe, expect, it } from 'vitest'

import { gerarCodigo, linkDoBot } from './vinculo.ts'

describe('vínculo do Telegram', () => {
  it('gera códigos de 16 caracteres hexadecimais, diferentes a cada vez', () => {
    const a = gerarCodigo()
    expect(a).toMatch(/^[a-f0-9]{16}$/)
    expect(gerarCodigo()).not.toBe(a)
  })
  it('monta o link do bot e recusa nomes estranhos', () => {
    expect(linkDoBot('VolareMilhasBot', '0123456789abcdef')).toBe('https://t.me/VolareMilhasBot?start=0123456789abcdef')
    expect(linkDoBot('@volare_bot', 'abc')).toBe('https://t.me/volare_bot?start=abc')
    expect(linkDoBot('x', 'abc')).toBeNull()
    expect(linkDoBot('bot/../evil', 'abc')).toBeNull()
  })
})
