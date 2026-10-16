import { describe, expect, it } from 'vitest'

import { supabaseConfigurado } from './ambiente'

describe('supabaseConfigurado', () => {
  it('exige as duas variáveis preenchidas', () => {
    expect(supabaseConfigurado({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'chave' })).toBe(true)
  })

  it('falta uma, está vazia ou só tem espaços', () => {
    expect(supabaseConfigurado({})).toBe(false)
    expect(supabaseConfigurado({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toBe(false)
    expect(supabaseConfigurado({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: '' })).toBe(false)
    expect(supabaseConfigurado({ VITE_SUPABASE_URL: '  ', VITE_SUPABASE_ANON_KEY: 'chave' })).toBe(false)
  })
})
