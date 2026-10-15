// Dados fixos de exemplo para a tela de busca. Nada aqui vem do banco.

export type Oferta = {
  id: string
  programa: string
  voo: string
  origem: string
  destino: string
  /** Horário local de partida, "HH:MM". */
  partida: string
  /** Horário local de chegada, "HH:MM". */
  chegada: string
  /** Aeroportos de conexão; vazio quando o voo é direto. */
  paradas: string[]
  duracaoMinutos: number
  /** Preço da passagem paga em dinheiro, em reais. */
  dinheiro: number
  milhas: number
  /** Taxas cobradas na emissão com milhas, em reais. */
  taxas: number
}

export type AlertaPrecoAlvo = {
  origem: string
  destino: string
  programa: string
  milhas: number
  meta: number
}

/** Quanto o usuário paga, em reais, por 1.000 milhas. */
export const milheiroExemplo = 20

export const ofertasExemplo: Oferta[] = [
  {
    id: 'smiles-g31650',
    programa: 'Smiles',
    voo: 'G31650',
    origem: 'GRU',
    destino: 'SSA',
    partida: '07:10',
    chegada: '09:40',
    paradas: [],
    duracaoMinutos: 150,
    dinheiro: 528.15,
    milhas: 18500,
    taxas: 38.25,
  },
  {
    id: 'smiles-clube-g31650',
    programa: 'Smiles (clube)',
    voo: 'G31650',
    origem: 'GRU',
    destino: 'SSA',
    partida: '07:10',
    chegada: '09:40',
    paradas: [],
    duracaoMinutos: 150,
    dinheiro: 528.15,
    milhas: 14800,
    taxas: 38.25,
  },
  {
    id: 'azul-ad4510',
    programa: 'Azul Fidelidade',
    voo: 'AD4510',
    origem: 'VCP',
    destino: 'SSA',
    partida: '06:00',
    chegada: '08:30',
    paradas: [],
    duracaoMinutos: 150,
    dinheiro: 455.07,
    milhas: 12500,
    taxas: 75.17,
  },
  {
    id: 'latam-la3320',
    programa: 'LATAM Pass',
    voo: 'LA3320',
    origem: 'GRU',
    destino: 'SSA',
    partida: '10:15',
    chegada: '15:05',
    paradas: ['BSB'],
    duracaoMinutos: 290,
    dinheiro: 549.81,
    milhas: 41000,
    taxas: 37.41,
  },
]

export const alertaExemplo: AlertaPrecoAlvo = {
  origem: 'GRU',
  destino: 'LIS',
  programa: 'TAP',
  milhas: 35000,
  meta: 40000,
}

/** Quantas rotas monitoradas têm alerta novo (badge de "Minhas rotas"). */
export const alertasNaoLidosExemplo = 1
