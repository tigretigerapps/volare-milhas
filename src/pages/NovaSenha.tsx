import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { CampoTexto } from '@/components/CampoTexto'
import { FormularioAuth } from '@/components/FormularioAuth'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { traduzirErroAuth } from '@/lib/erros-auth'

const senhaMinima = 8

/** Destino do link de recuperação: o Supabase abre uma sessão temporária e aqui se define a nova senha. */
export function NovaSenha() {
  const { session, carregando } = useAuth()
  const navigate = useNavigate()

  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (carregando) {
    return <p className="text-texto-secundario">Validando o link…</p>
  }

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-2xl font-medium">Link inválido ou vencido</h1>
        <p className="mt-2 text-texto-secundario">
          Este link para criar uma nova senha não vale mais. Peça um novo e abra-o em seguida.
        </p>
        <Button asChild className="mt-6">
          <Link to="/esqueci-senha">Pedir novo link</Link>
        </Button>
      </div>
    )
  }

  const salvar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (senha.length < senhaMinima) {
      setErro(`A senha precisa ter pelo menos ${senhaMinima} caracteres.`)
      return
    }
    if (senha !== confirmacao) {
      setErro('As senhas não são iguais.')
      return
    }
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setEnviando(false)
    if (error) {
      setErro(traduzirErroAuth(error))
      return
    }
    navigate('/conta', { replace: true })
  }

  return (
    <FormularioAuth
      titulo="Nova senha"
      subtitulo="Escolha a senha que vai usar daqui em diante."
      onSubmit={salvar}
      erro={erro}
    >
      <CampoTexto
        id="nova-senha"
        rotulo="Nova senha"
        type="password"
        autoComplete="new-password"
        ajuda={`Pelo menos ${senhaMinima} caracteres.`}
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        required
      />
      <CampoTexto
        id="nova-senha-confirmacao"
        rotulo="Repita a nova senha"
        type="password"
        autoComplete="new-password"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        required
      />
      <Button type="submit" disabled={enviando}>
        {enviando ? 'Salvando…' : 'Salvar nova senha'}
      </Button>
    </FormularioAuth>
  )
}
