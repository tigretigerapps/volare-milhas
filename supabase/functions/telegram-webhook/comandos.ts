// Interpreta o que o usuário digitou no bot. Funções puras, sem rede nem banco.

export type AtualizacaoTelegram = {
  message?: { text?: string; chat?: { id?: number; type?: string } }
}

export type Comando =
  | { tipo: 'vincular'; chatId: number; codigo: string }
  | { tipo: 'parar'; chatId: number }
  | { tipo: 'ajuda'; chatId: number }

/** Código de uso único gerado pela função telegram: 16 caracteres hexadecimais. */
const CODIGO = /^[a-f0-9]{16}$/

/**
 * /start CODIGO vincula a conta; /parar desliga; qualquer outra coisa mostra a ajuda.
 * Só conversas privadas valem (grupos e canais são ignorados).
 */
export function interpretar(atualizacao: AtualizacaoTelegram): Comando | null {
  const chat = atualizacao.message?.chat
  const texto = atualizacao.message?.text?.trim()
  if (!chat || typeof chat.id !== 'number' || chat.type !== 'private' || !texto) return null

  const [comando, argumento] = texto.split(/\s+/, 2)
  const nome = comando.toLowerCase().replace(/@\w+$/, '')

  if (nome === '/start' && argumento && CODIGO.test(argumento.toLowerCase())) {
    return { tipo: 'vincular', chatId: chat.id, codigo: argumento.toLowerCase() }
  }
  if (nome === '/parar' || nome === '/stop') return { tipo: 'parar', chatId: chat.id }
  return { tipo: 'ajuda', chatId: chat.id }
}

export const MENSAGENS = {
  vinculado: 'Pronto! Sua conta da Volare Milhas está conectada. Vou avisar aqui quando um preço bater a meta das suas rotas. Para parar, envie /parar.',
  codigoInvalido: 'Esse código não vale mais. Volte à página Conta no site, toque em Conectar Telegram e use o link novo.',
  parado: 'Alertas desligados. Para voltar a receber, conecte de novo pela página Conta no site.',
  ajuda: 'Sou o bot de alertas da Volare Milhas. Para conectar, abra a página Conta no site e toque em Conectar Telegram. Para parar os alertas, envie /parar.',
} as const
