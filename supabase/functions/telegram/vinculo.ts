/** Código de uso único do vínculo: 8 bytes aleatórios em hexadecimal (16 caracteres). */
export function gerarCodigo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** O nome do bot (sem @) vira o link que abre a conversa já com o código: https://t.me/bot?start=codigo. */
export function linkDoBot(usuarioDoBot: string, codigo: string): string | null {
  const nome = usuarioDoBot.trim().replace(/^@/, '')
  return /^[A-Za-z0-9_]{5,32}$/.test(nome) ? `https://t.me/${nome}?start=${codigo}` : null
}

/** Quanto tempo o código vale. */
export const MINUTOS_DE_VALIDADE = 15
