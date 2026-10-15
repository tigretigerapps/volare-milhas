import { describe, expect, it } from 'vitest'

import { ofertasExemplo, type Oferta } from '@/data/exemplo'
import { compararOferta, custoMilhasEmReais, ordenarOfertas } from './comparacao'

const oferta = (id: string) => ofertasExemplo.find((o) => o.id === id)!

describe('custoMilhasEmReais', () => {
  it('converte milhas pelo milheiro e soma as taxas', () => {
    expect(custoMilhasEmReais(18500, 38.25, 20)).toBeCloseTo(408.25)
  })

  it('com milhas zeradas custa só as taxas', () => {
    expect(custoMilhasEmReais(0, 50, 20)).toBe(50)
  })
})

describe('compararOferta', () => {
  it('Smiles: milhas economizam cerca de R$ 120', () => {
    const r = compararOferta(oferta('smiles-g31650'), 20)
    expect(r.custoMilhas).toBeCloseTo(408.25)
    expect(r.economia).toBeCloseTo(119.9)
    expect(r.vencedor).toBe('milhas')
    expect(r.diferencaArredondada).toBe(120)
  })

  it('Smiles (clube): milhas economizam R$ 194', () => {
    const r = compararOferta(oferta('smiles-clube-g31650'), 20)
    expect(r.custoMilhas).toBeCloseTo(334.25)
    expect(r.vencedor).toBe('milhas')
    expect(r.diferencaArredondada).toBe(194)
  })

  it('Azul: milhas economizam R$ 130', () => {
    const r = compararOferta(oferta('azul-ad4510'), 20)
    expect(r.custoMilhas).toBeCloseTo(325.17)
    expect(r.vencedor).toBe('milhas')
    expect(r.diferencaArredondada).toBe(130)
  })

  it('LATAM: dinheiro sai R$ 308 mais barato', () => {
    const r = compararOferta(oferta('latam-la3320'), 20)
    expect(r.custoMilhas).toBeCloseTo(857.41)
    expect(r.economia).toBeCloseTo(-307.6)
    expect(r.vencedor).toBe('dinheiro')
    expect(r.diferencaArredondada).toBe(308)
  })

  it('a barra maior ocupa 100% e a outra é proporcional', () => {
    const milhas = compararOferta(oferta('smiles-g31650'), 20)
    expect(milhas.larguraDinheiro).toBe(100)
    expect(milhas.larguraMilhas).toBeCloseTo((408.25 / 528.15) * 100)

    const dinheiro = compararOferta(oferta('latam-la3320'), 20)
    expect(dinheiro.larguraMilhas).toBe(100)
    expect(dinheiro.larguraDinheiro).toBeCloseTo((549.81 / 857.41) * 100)
  })

  it('o veredito muda com o milheiro do usuário', () => {
    // A 30 reais o milheiro, 18.500 milhas + R$ 38,25 custam R$ 593,25: dinheiro vence.
    const r = compararOferta(oferta('smiles-g31650'), 30)
    expect(r.vencedor).toBe('dinheiro')
    expect(r.diferencaArredondada).toBe(65)
  })

  it('arredonda meio real para cima mesmo com imprecisão de ponto flutuante', () => {
    // 14.800 mi a R$ 25,50 + R$ 38,25 = R$ 415,65; 528,15 − 415,65 = 112,50.
    const r = compararOferta(oferta('smiles-clube-g31650'), 25.5)
    expect(r.diferencaArredondada).toBe(113)
  })

  it('diferença que arredonda para zero é empate', () => {
    const quaseIgual: Oferta = { ...oferta('smiles-g31650'), dinheiro: 408.5 }
    const r = compararOferta(quaseIgual, 20)
    expect(r.vencedor).toBe('empate')
    expect(r.diferencaArredondada).toBe(0)
  })

  it('não divide por zero quando tudo custa zero', () => {
    const gratis: Oferta = { ...oferta('smiles-g31650'), dinheiro: 0, milhas: 0, taxas: 0 }
    const r = compararOferta(gratis, 20)
    expect(r.larguraDinheiro).toBe(0)
    expect(r.larguraMilhas).toBe(0)
  })
})

describe('ordenarOfertas', () => {
  const ids = (lista: Oferta[]) => lista.map((o) => o.id)

  it('por maior economia, do que mais economiza ao que menos', () => {
    expect(ids(ordenarOfertas(ofertasExemplo, 'economia', 20))).toEqual([
      'smiles-clube-g31650',
      'azul-ad4510',
      'smiles-g31650',
      'latam-la3320',
    ])
  })

  it('por horário de partida', () => {
    expect(ids(ordenarOfertas(ofertasExemplo, 'horario', 20))[0]).toBe('azul-ad4510')
    expect(ids(ordenarOfertas(ofertasExemplo, 'horario', 20)).at(-1)).toBe('latam-la3320')
  })

  it('por duração, mais curto primeiro', () => {
    expect(ids(ordenarOfertas(ofertasExemplo, 'duracao', 20)).at(-1)).toBe('latam-la3320')
  })

  it('não altera a lista original', () => {
    const copia = [...ofertasExemplo]
    ordenarOfertas(ofertasExemplo, 'economia', 20)
    expect(ofertasExemplo).toEqual(copia)
  })
})
