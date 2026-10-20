import { describe, expect, it } from 'vitest'

import { aeroportos, descreverAeroporto, filtrarAeroportos } from './aeroportos'

describe('aeroportos', () => {
  it('não repete códigos e todos têm 3 letras maiúsculas', () => {
    const codigos = aeroportos.map((a) => a.codigo)
    expect(new Set(codigos).size).toBe(codigos.length)
    for (const codigo of codigos) expect(codigo).toMatch(/^[A-Z]{3}$/)
  })

  it('descreve o aeroporto pelo código, sem diferenciar maiúsculas', () => {
    expect(descreverAeroporto('ssa')).toBe('Salvador, Dep. Luís Eduardo Magalhães')
    expect(descreverAeroporto('SAO')).toBe('São Paulo, todos os aeroportos')
    expect(descreverAeroporto('ZZZ')).toBeNull()
  })

  it('filtra por cidade sem depender de acento', () => {
    const codigos = filtrarAeroportos('sao paulo').map((a) => a.codigo)
    expect(codigos).toEqual(expect.arrayContaining(['SAO', 'GRU', 'CGH']))
    expect(filtrarAeroportos('brasilia')[0].codigo).toBe('BSB')
  })

  it('põe o código exato primeiro e acha por nome do aeroporto', () => {
    expect(filtrarAeroportos('gru')[0].codigo).toBe('GRU')
    expect(filtrarAeroportos('guarulhos').map((a) => a.codigo)).toContain('GRU')
  })

  it('devolve a lista inteira sem consulta e nada quando não há correspondência', () => {
    expect(filtrarAeroportos('')).toHaveLength(aeroportos.length)
    expect(filtrarAeroportos('xyzxyz')).toEqual([])
  })
})
