import { describe, expect, it } from 'vitest'

import { interpretar } from './comandos.ts'

const msg = (text: string, type = 'private') => ({ message: { text, chat: { id: 42, type } } })

describe('interpretar', () => {
  it('/start com código vincula', () => {
    expect(interpretar(msg('/start 0123456789abcdef'))).toEqual({ tipo: 'vincular', chatId: 42, codigo: '0123456789abcdef' })
    expect(interpretar(msg('/start@volare_bot 0123456789ABCDEF'))).toEqual({ tipo: 'vincular', chatId: 42, codigo: '0123456789abcdef' })
  })
  it('/start sem código ou com código malformado mostra a ajuda', () => {
    expect(interpretar(msg('/start'))).toEqual({ tipo: 'ajuda', chatId: 42 })
    expect(interpretar(msg('/start abc'))).toEqual({ tipo: 'ajuda', chatId: 42 })
    expect(interpretar(msg('/start ../../etc'))).toEqual({ tipo: 'ajuda', chatId: 42 })
  })
  it('/parar e /stop desligam', () => {
    expect(interpretar(msg('/parar'))).toEqual({ tipo: 'parar', chatId: 42 })
    expect(interpretar(msg('/STOP'))).toEqual({ tipo: 'parar', chatId: 42 })
  })
  it('qualquer outro texto mostra a ajuda', () => {
    expect(interpretar(msg('oi'))).toEqual({ tipo: 'ajuda', chatId: 42 })
  })
  it('ignora grupos, canais e atualizações sem texto', () => {
    expect(interpretar(msg('/start 0123456789abcdef', 'group'))).toBeNull()
    expect(interpretar({})).toBeNull()
    expect(interpretar({ message: { chat: { id: 1, type: 'private' } } })).toBeNull()
  })
})
