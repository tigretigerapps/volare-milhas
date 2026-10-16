import { describe, expect, it } from 'vitest'

import {
  descreverAlvo,
  descreverCompanhias,
  formatarData,
  formatarPeriodo,
  formularioVazio,
  mensagemErroRota,
  rotaParaFormulario,
  validarRota,
  type FormularioRota,
  type Rota,
} from './rotas'

const nbsp = ' '
const hoje = '2026-10-15'

const valido: FormularioRota = {
  origem: 'gru',
  destino: 'lis',
  dataInicio: '2026-12-01',
  dataFim: '2027-01-31',
  alvoMilhas: '40.000',
  alvoReais: '',
  companhias: ['TAP', 'AZUL'],
}

describe('validarRota', () => {
  it('normaliza e devolve os dados para o banco', () => {
    const r = validarRota(valido, hoje)
    expect(r).toEqual({
      ok: true,
      dados: {
        origem: 'GRU',
        destino: 'LIS',
        data_inicio: '2026-12-01',
        data_fim: '2027-01-31',
        preco_alvo_milhas: 40000,
        preco_alvo_rs: null,
        companhias: ['AZUL', 'TAP'],
      },
    })
  })

  it('aceita alvo só em reais', () => {
    const r = validarRota({ ...valido, alvoMilhas: '', alvoReais: '2.500,00' }, hoje)
    expect(r.ok && r.dados.preco_alvo_rs).toBe(2500)
    expect(r.ok && r.dados.preco_alvo_milhas).toBeNull()
  })

  it('exige códigos de aeroporto válidos e diferentes', () => {
    const r = validarRota({ ...valido, origem: 'GR', destino: 'GRU1' }, hoje)
    expect(!r.ok && r.erros.origem).toBeTruthy()
    expect(!r.ok && r.erros.destino).toBeTruthy()

    const igual = validarRota({ ...valido, destino: 'GRU' }, hoje)
    expect(!igual.ok && igual.erros.destino).toMatch(/diferente/)
  })

  it('exige período coerente e que não tenha acabado', () => {
    const invertido = validarRota({ ...valido, dataInicio: '2027-02-01', dataFim: '2027-01-01' }, hoje)
    expect(!invertido.ok && invertido.erros.dataFim).toMatch(/depois/)

    const passado = validarRota({ ...valido, dataInicio: '2026-01-01', dataFim: '2026-02-01' }, hoje)
    expect(!passado.ok && passado.erros.dataFim).toMatch(/terminou/)

    const mesmoDia = validarRota({ ...valido, dataInicio: hoje, dataFim: hoje }, hoje)
    expect(mesmoDia.ok).toBe(true)

    const vazio = validarRota({ ...valido, dataInicio: '', dataFim: '' }, hoje)
    expect(!vazio.ok && vazio.erros.dataInicio && vazio.erros.dataFim).toBeTruthy()
  })

  it('exige pelo menos um preço-alvo, e válido', () => {
    const semAlvo = validarRota({ ...valido, alvoMilhas: '', alvoReais: '' }, hoje)
    expect(!semAlvo.ok && semAlvo.erros.alvo).toBeTruthy()

    const invalido = validarRota({ ...valido, alvoMilhas: '40 mil', alvoReais: 'muito' }, hoje)
    expect(!invalido.ok && invalido.erros.alvoMilhas).toBeTruthy()
    expect(!invalido.ok && invalido.erros.alvoReais).toBeTruthy()
  })

  it('formulário vazio aponta todos os campos obrigatórios', () => {
    const r = validarRota(formularioVazio, hoje)
    expect(r.ok).toBe(false)
    expect(!r.ok && Object.keys(r.erros).sort()).toEqual(['alvo', 'dataFim', 'dataInicio', 'destino', 'origem'])
  })
})

describe('rotaParaFormulario', () => {
  it('volta ao formato digitável', () => {
    const rota = {
      origem: 'GRU',
      destino: 'LIS',
      data_inicio: '2026-12-01',
      data_fim: '2027-01-31',
      preco_alvo_milhas: 40000,
      preco_alvo_rs: 2500,
      companhias: ['TAP'],
    } as Rota
    expect(rotaParaFormulario(rota)).toEqual({
      origem: 'GRU',
      destino: 'LIS',
      dataInicio: '2026-12-01',
      dataFim: '2027-01-31',
      alvoMilhas: '40.000',
      alvoReais: '2500,00',
      companhias: ['TAP'],
    })
    // E o que volta valida de novo sem perder nada.
    const r = validarRota(rotaParaFormulario(rota), hoje)
    expect(r.ok && r.dados.preco_alvo_rs).toBe(2500)
  })
})

describe('formatação', () => {
  it('datas curtas sem pontos nem "de"', () => {
    expect(formatarData('2026-12-01')).toBe('1 dez 2026')
    expect(formatarData('2027-01-31')).toBe('31 jan 2027')
  })

  it('período', () => {
    expect(formatarPeriodo('2026-12-01', '2027-01-31')).toBe('1 dez 2026 a 31 jan 2027')
    expect(formatarPeriodo('2026-12-01', '2026-12-01')).toBe('1 dez 2026')
  })

  it('alvo', () => {
    expect(descreverAlvo({ preco_alvo_milhas: 40000, preco_alvo_rs: null })).toBe('até 40.000 milhas')
    expect(descreverAlvo({ preco_alvo_milhas: 40000, preco_alvo_rs: 2500 })).toBe(`até 40.000 milhas ou R$${nbsp}2.500`)
  })

  it('companhias', () => {
    expect(descreverCompanhias([])).toBe('todas as companhias')
    expect(descreverCompanhias(['AZUL', 'GOL'])).toBe('Azul Fidelidade e Smiles (Gol)')
  })
})

describe('mensagemErroRota', () => {
  it('explica o limite do plano', () => {
    expect(mensagemErroRota({ message: 'limite_rotas' }, 'padrão')).toMatch(/limite de rotas ativas do seu plano/)
  })

  it('qualquer outro erro usa a mensagem padrão', () => {
    expect(mensagemErroRota({ message: 'outra coisa' }, 'padrão')).toBe('padrão')
    expect(mensagemErroRota(null, 'padrão')).toBe('padrão')
  })
})
