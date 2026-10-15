import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { CampoTexto } from '@/components/CampoTexto'
import { FormularioAuth } from '@/components/FormularioAuth'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { traduzirErroAuth } from '@/lib/erros-auth'

const senhaMinima = 8

export function Cadastro() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmarEmail, setConfirmarEmail] = useState<string | null>(null)

  if (session) return <Navigate to="/conta" replace />

  if (confirmarEmail) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-2xl font-medium">Confira seu e-mail</h1>
        <p className="mt-2 text-texto-secundario">
          Enviamos um link de confirmação para <span className="font-normal text-texto">{confirmarEmail}</span>. Abra o
          link para ativar sua conta e depois entre.
        </p>
        <Button asChild variant="contorno" className="mt-6">
          <Link to="/entrar">Ir para entrar</Link>
        </Button>
      </div>
    )
  }

  const cadastrar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Preencha nome, e-mail e senha.')
      return
    }
    if (senha.length < senhaMinima) {
      setErro(`A senha precisa ter pelo menos ${senhaMinima} caracteres.`)
      return
    }
    setEnviando(true)
    setErro(null)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        // O trigger do banco copia nome e telefone daqui para public.profiles.
        data: { nome: nome.trim(), telefone: telefone.trim() || null },
        emailRedirectTo: `${window.location.origin}/conta`,
      },
    })
    setEnviando(false)
    if (error) {
      setErro(traduzirErroAuth(error))
      return
    }
    if (data.session) {
      navigate((location.state as { de?: string } | null)?.de ?? '/conta', { replace: true })
    } else {
      setConfirmarEmail(email.trim())
    }
  }

  return (
    <FormularioAuth
      titulo="Criar conta"
      subtitulo="Salve seu milheiro e acompanhe rotas até o preço-alvo."
      onSubmit={cadastrar}
      erro={erro}
      rodape={
        <>
          Já tem conta?{' '}
          <Link to="/entrar" state={location.state} className="text-texto underline underline-offset-4 decoration-fio hover:decoration-texto">
            Entrar
          </Link>
        </>
      }
    >
      <CampoTexto
        id="cadastro-nome"
        rotulo="Nome"
        autoComplete="name"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
      />
      <CampoTexto
        id="cadastro-telefone"
        rotulo="Telefone (opcional)"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(11) 91234-5678"
        ajuda="Para receber alertas pelo WhatsApp no futuro."
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
      />
      <CampoTexto
        id="cadastro-email"
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <CampoTexto
        id="cadastro-senha"
        rotulo="Senha"
        type="password"
        autoComplete="new-password"
        ajuda={`Pelo menos ${senhaMinima} caracteres.`}
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        required
      />
      <Button type="submit" disabled={enviando}>
        {enviando ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </FormularioAuth>
  )
}
