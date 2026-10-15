import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { Layout } from '@/components/Layout'
import { Buscar } from '@/pages/Buscar'
import { Conta } from '@/pages/Conta'
import { Rotas } from '@/pages/Rotas'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/buscar" replace />} />
          <Route path="buscar" element={<Buscar />} />
          <Route path="rotas" element={<Rotas />} />
          <Route path="conta" element={<Conta />} />
          <Route path="*" element={<Navigate to="/buscar" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
