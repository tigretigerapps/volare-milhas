type ErroComCodigo = { code?: string; message?: string; status?: number } | null | undefined

const mensagens: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
  user_already_exists: 'Já existe uma conta com este e-mail. Tente entrar.',
  email_exists: 'Já existe uma conta com este e-mail. Tente entrar.',
  weak_password: 'Senha fraca. Escolha uma senha mais longa, misturando letras e números.',
  email_address_invalid: 'Este e-mail não parece válido.',
  over_email_send_rate_limit: 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
  signup_disabled: 'Novos cadastros estão desativados no momento.',
}

/** Converte um erro do Supabase Auth em uma mensagem em português para mostrar ao usuário. */
export function traduzirErroAuth(erro: ErroComCodigo): string {
  if (erro?.code && mensagens[erro.code]) return mensagens[erro.code]
  if (erro?.status === 429) return mensagens.over_request_rate_limit
  return 'Não foi possível concluir agora. Tente de novo em instantes.'
}
