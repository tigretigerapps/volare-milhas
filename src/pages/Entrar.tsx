import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { CampoTexto } from '@/components/CampoTexto'
import { FormularioAuth } from '@/components/FormularioAuth'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { traduzirErroAuth } from '@/lib/erros-auth'

export function Entrar() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = (location.state as { de?: string } | null)?.de ?? '/buscar'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (session) return <Navigate to={destino} replace />

  const entrar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.')
      return
    }
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) {
      setErro(traduzirErroAuth(error))
      return
    }
    navigate(destino, { replace: true })
  }

  return (
    <FormularioAuth
      titulo="Entrar"
      subtitulo="Acesse suas rotas monitoradas e o seu milheiro salvo."
      onSubmit={entrar}
      erro={erro}
      rodape={
        <>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" state={location.state} className="text-texto underline underline-offset-4 decoration-fio hover:decoration-texto">
            Criar conta
          </Link>
        </>
      }
    >
      <CampoTexto
        id="entrar-email"
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <CampoTexto
        id="entrar-senha"
        rotulo="Senha"
        type="password"
        autoComplete="current-password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        required
      />
      <Button type="submit" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </Button>
      <Link to="/esqueci-senha" className="text-sm text-texto-secundario underline underline-offset-4 decoration-fio hover:text-texto hover:decoration-texto">
        Esqueci minha senha
      </Link>
    </FormularioAuth>
  )
}
