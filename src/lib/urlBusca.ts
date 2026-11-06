import type { ParametrosBusca } from '@/components/BarraBusca'

const iata = /^[A-Z]{3}$/
const data = /^\d{4}-\d{2}-\d{2}$/

/** "/buscar/resultados?origem=GRU&destino=SSA&ida=2026-12-15" (volta só quando houver). */
export function urlResultados(p: ParametrosBusca): string {
  const busca = new URLSearchParams({ origem: p.origem, destino: p.destino, ida: p.ida })
  if (p.volta) busca.set('volta', p.volta)
  return `/buscar/resultados?${busca.toString()}`
}

/** Lê a busca da URL. Devolve null se faltar origem, destino ou ida, ou se vierem malformados. */
export function lerBuscaDaUrl(busca: URLSearchParams): ParametrosBusca | null {
  const origem = (busca.get('origem') ?? '').toUpperCase()
  const destino = (busca.get('destino') ?? '').toUpperCase()
  const ida = busca.get('ida') ?? ''
  const volta = busca.get('volta') ?? ''
  if (!iata.test(origem) || !iata.test(destino) || !data.test(ida)) return null
  return { origem, destino, ida, volta: data.test(volta) && volta >= ida ? volta : '' }
}
