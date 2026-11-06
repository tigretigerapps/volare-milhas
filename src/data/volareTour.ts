export type CardVolareTour = {
  selo: string
  titulo: string
  texto: string
  rotuloLink: string
  /** Página no site da Volare Tour. null enquanto a Volare não define o endereço. */
  url: string | null
  foto: string
  alt: string
}

/** Bloco "Da Volare Tour para você" na home. A Volare troca os textos e links aqui. */
export const cardsVolareTour: CardVolareTour[] = [
  {
    selo: 'Destinos',
    titulo: 'Lisboa e Porto',
    texto: 'Roteiros montados pela Volare, com hotel e passeios.',
    rotuloLink: 'Ver destinos',
    url: null,
    foto: '/fotos/card-destinos-porto.webp',
    alt: 'Ribeira do Porto e o rio Douro ao entardecer',
  },
  {
    selo: 'Promoções',
    titulo: 'Nordeste em dezembro',
    texto: 'Pacotes com preço fechado por tempo limitado.',
    rotuloLink: 'Ver promoções',
    url: null,
    foto: '/fotos/card-promocoes-nordeste.webp',
    alt: 'Praia de Porto de Galinhas com coqueiros e mar azul',
  },
  {
    selo: 'Clube de Alertas',
    titulo: 'Ofertas antes de todo mundo',
    texto: 'As melhores tarifas garimpadas pela Volare, direto no seu WhatsApp.',
    rotuloLink: 'Conhecer o clube',
    url: null,
    foto: '/fotos/card-clube-janela.webp',
    alt: 'Asa do avião vista pela janela, acima das nuvens',
  },
]
