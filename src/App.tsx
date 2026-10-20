import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { Layout } from '@/components/Layout'
import { RotaAdmin } from '@/components/RotaAdmin'
import { RotaProtegida } from '@/components/RotaProtegida'
import { AlertasProvider } from '@/contexts/AlertasProvider'
import { AuthProvider } from '@/contexts/AuthProvider'
import { Admin } from '@/pages/Admin'
import { Buscar } from '@/pages/Buscar'
import { Cadastro } from '@/pages/Cadastro'
import { Conta } from '@/pages/Conta'
import { Entrar } from '@/pages/Entrar'
import { EsqueciSenha } from '@/pages/EsqueciSenha'
import { NovaSenha } from '@/pages/NovaSenha'
import { Rotas } from '@/pages/Rotas'

export default function App() {
  return (
    <AuthProvider>
      <AlertasProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/buscar" replace />} />
              <Route path="buscar" element={<Buscar />} />
              <Route path="entrar" element={<Entrar />} />
              <Route path="cadastro" element={<Cadastro />} />
              <Route path="esqueci-senha" element={<EsqueciSenha />} />
              <Route path="nova-senha" element={<NovaSenha />} />
              <Route
                path="rotas"
                element={
                  <RotaProtegida>
                    <Rotas />
                  </RotaProtegida>
                }
              />
              <Route
                path="conta"
                element={
                  <RotaProtegida>
                    <Conta />
                  </RotaProtegida>
                }
              />
              <Route
                path="admin"
                element={
                  <RotaAdmin>
                    <Admin />
                  </RotaAdmin>
                }
              />
              <Route path="*" element={<Navigate to="/buscar" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AlertasProvider>
    </AuthProvider>
  )
}
