import type { Oferta } from '@/data/exemplo'

export type Vencedor = 'milhas' | 'dinheiro' | 'empate'

export type Comparacao = {
  /** Custo da emissão com milhas convertido em reais: milhas/1000 × milheiro + taxas. */
  custoMilhas: number
  /** Dinheiro − custo em milhas. Positivo quando as milhas compensam. */
  economia: number
  /** |economia| arredondada para reais inteiros, como aparece no veredito. */
  diferencaArredondada: number
  vencedor: Vencedor
  /** Largura da barra do dinheiro na régua, de 0 a 100. */
  larguraDinheiro: number
  /** Largura da barra das milhas na régua, de 0 a 100. */
  larguraMilhas: number
}

export type CriterioOrdenacao = 'economia' | 'horario' | 'duracao'

export function custoMilhasEmReais(milhas: number, taxas: number, milheiro: number): number {
  return (milhas / 1000) * milheiro + taxas
}

export function compararOferta(oferta: Oferta, milheiro: number): Comparacao {
  const custoMilhas = custoMilhasEmReais(oferta.milhas, oferta.taxas, milheiro)
  const economia = oferta.dinheiro - custoMilhas
  // Arredonda primeiro para centavos: sem isso, 112,50 pode virar 112,4999… e cair para 112.
  const diferencaArredondada = Math.round(Number(Math.abs(economia).toFixed(2)))

  // O veredito compara o que o usuário lê: se a diferença some no arredondamento, é empate.
  const vencedor: Vencedor =
    diferencaArredondada === 0 ? 'empate' : economia > 0 ? 'milhas' : 'dinheiro'

  const maior = Math.max(oferta.dinheiro, custoMilhas)
  const largura = (valor: number) => (maior > 0 ? (valor / maior) * 100 : 0)

  return {
    custoMilhas,
    economia,
    diferencaArredondada,
    vencedor,
    larguraDinheiro: largura(oferta.dinheiro),
    larguraMilhas: largura(custoMilhas),
  }
}

export function ordenarOfertas(
  ofertas: readonly Oferta[],
  criterio: CriterioOrdenacao,
  milheiro: number,
): Oferta[] {
  const lista = [...ofertas]
  switch (criterio) {
    case 'economia':
      return lista.sort(
        (a, b) => compararOferta(b, milheiro).economia - compararOferta(a, milheiro).economia,
      )
    case 'horario':
      // "HH:MM" com zero à esquerda ordena corretamente como texto.
      return lista.sort((a, b) => a.partida.localeCompare(b.partida))
    case 'duracao':
      return lista.sort((a, b) => a.duracaoMinutos - b.duracaoMinutos)
  }
}
