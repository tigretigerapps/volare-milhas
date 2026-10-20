export type Aeroporto = {
  codigo: string
  cidade: string
  /** Nome do aeroporto; para códigos de cidade, descreve os aeroportos cobertos. */
  nome: string
  pais: string
  /** Código de cidade (vários aeroportos), como SAO ou RIO. */
  cidadeInteira?: boolean
}

const BR = 'Brasil'

export const aeroportos: readonly Aeroporto[] = [
  { codigo: 'SAO', cidade: 'São Paulo', nome: 'Todos os aeroportos (GRU, CGH, VCP)', pais: BR, cidadeInteira: true },
  { codigo: 'GRU', cidade: 'São Paulo', nome: 'Guarulhos', pais: BR },
  { codigo: 'CGH', cidade: 'São Paulo', nome: 'Congonhas', pais: BR },
  { codigo: 'VCP', cidade: 'Campinas', nome: 'Viracopos', pais: BR },
  { codigo: 'RIO', cidade: 'Rio de Janeiro', nome: 'Todos os aeroportos (GIG, SDU)', pais: BR, cidadeInteira: true },
  { codigo: 'GIG', cidade: 'Rio de Janeiro', nome: 'Galeão', pais: BR },
  { codigo: 'SDU', cidade: 'Rio de Janeiro', nome: 'Santos Dumont', pais: BR },
  { codigo: 'BHZ', cidade: 'Belo Horizonte', nome: 'Todos os aeroportos (CNF, PLU)', pais: BR, cidadeInteira: true },
  { codigo: 'CNF', cidade: 'Belo Horizonte', nome: 'Confins', pais: BR },
  { codigo: 'PLU', cidade: 'Belo Horizonte', nome: 'Pampulha', pais: BR },
  { codigo: 'BSB', cidade: 'Brasília', nome: 'Presidente Juscelino Kubitschek', pais: BR },
  { codigo: 'SSA', cidade: 'Salvador', nome: 'Dep. Luís Eduardo Magalhães', pais: BR },
  { codigo: 'REC', cidade: 'Recife', nome: 'Guararapes', pais: BR },
  { codigo: 'FOR', cidade: 'Fortaleza', nome: 'Pinto Martins', pais: BR },
  { codigo: 'NAT', cidade: 'Natal', nome: 'Aluízio Alves', pais: BR },
  { codigo: 'MCZ', cidade: 'Maceió', nome: 'Zumbi dos Palmares', pais: BR },
  { codigo: 'AJU', cidade: 'Aracaju', nome: 'Santa Maria', pais: BR },
  { codigo: 'JPA', cidade: 'João Pessoa', nome: 'Presidente Castro Pinto', pais: BR },
  { codigo: 'SLZ', cidade: 'São Luís', nome: 'Marechal Cunha Machado', pais: BR },
  { codigo: 'THE', cidade: 'Teresina', nome: 'Senador Petrônio Portella', pais: BR },
  { codigo: 'BEL', cidade: 'Belém', nome: 'Val-de-Cans', pais: BR },
  { codigo: 'MAO', cidade: 'Manaus', nome: 'Eduardo Gomes', pais: BR },
  { codigo: 'MCP', cidade: 'Macapá', nome: 'Alberto Alcolumbre', pais: BR },
  { codigo: 'BVB', cidade: 'Boa Vista', nome: 'Atlas Brasil Cantanhede', pais: BR },
  { codigo: 'PVH', cidade: 'Porto Velho', nome: 'Governador Jorge Teixeira', pais: BR },
  { codigo: 'RBR', cidade: 'Rio Branco', nome: 'Plácido de Castro', pais: BR },
  { codigo: 'PMW', cidade: 'Palmas', nome: 'Brigadeiro Lysias Rodrigues', pais: BR },
  { codigo: 'CGB', cidade: 'Cuiabá', nome: 'Marechal Rondon', pais: BR },
  { codigo: 'CGR', cidade: 'Campo Grande', nome: 'Campo Grande', pais: BR },
  { codigo: 'GYN', cidade: 'Goiânia', nome: 'Santa Genoveva', pais: BR },
  { codigo: 'VIX', cidade: 'Vitória', nome: 'Eurico de Aguiar Salles', pais: BR },
  { codigo: 'CWB', cidade: 'Curitiba', nome: 'Afonso Pena', pais: BR },
  { codigo: 'IGU', cidade: 'Foz do Iguaçu', nome: 'Cataratas', pais: BR },
  { codigo: 'LDB', cidade: 'Londrina', nome: 'Governador José Richa', pais: BR },
  { codigo: 'FLN', cidade: 'Florianópolis', nome: 'Hercílio Luz', pais: BR },
  { codigo: 'NVT', cidade: 'Navegantes (Balneário Camboriú)', nome: 'Ministro Victor Konder', pais: BR },
  { codigo: 'JOI', cidade: 'Joinville', nome: 'Lauro Carneiro de Loyola', pais: BR },
  { codigo: 'POA', cidade: 'Porto Alegre', nome: 'Salgado Filho', pais: BR },
  { codigo: 'BPS', cidade: 'Porto Seguro', nome: 'Porto Seguro', pais: BR },
  { codigo: 'IOS', cidade: 'Ilhéus', nome: 'Jorge Amado', pais: BR },
  { codigo: 'FEN', cidade: 'Fernando de Noronha', nome: 'Governador Carlos Wilson', pais: BR },
  { codigo: 'UDI', cidade: 'Uberlândia', nome: 'Ten. Cel. Aviador César Bombonato', pais: BR },
  { codigo: 'RAO', cidade: 'Ribeirão Preto', nome: 'Leite Lopes', pais: BR },
  { codigo: 'SJP', cidade: 'São José do Rio Preto', nome: 'Prof. Eribelto Manoel Reino', pais: BR },
  { codigo: 'IMP', cidade: 'Imperatriz', nome: 'Prefeito Renato Moreira', pais: BR },

  { codigo: 'LIS', cidade: 'Lisboa', nome: 'Humberto Delgado', pais: 'Portugal' },
  { codigo: 'OPO', cidade: 'Porto', nome: 'Francisco Sá Carneiro', pais: 'Portugal' },
  { codigo: 'FAO', cidade: 'Faro', nome: 'Faro', pais: 'Portugal' },
  { codigo: 'MAD', cidade: 'Madri', nome: 'Adolfo Suárez Madrid-Barajas', pais: 'Espanha' },
  { codigo: 'BCN', cidade: 'Barcelona', nome: 'El Prat', pais: 'Espanha' },
  { codigo: 'PAR', cidade: 'Paris', nome: 'Todos os aeroportos (CDG, ORY)', pais: 'França', cidadeInteira: true },
  { codigo: 'CDG', cidade: 'Paris', nome: 'Charles de Gaulle', pais: 'França' },
  { codigo: 'ORY', cidade: 'Paris', nome: 'Orly', pais: 'França' },
  { codigo: 'LON', cidade: 'Londres', nome: 'Todos os aeroportos (LHR, LGW, STN, LCY)', pais: 'Reino Unido', cidadeInteira: true },
  { codigo: 'LHR', cidade: 'Londres', nome: 'Heathrow', pais: 'Reino Unido' },
  { codigo: 'LGW', cidade: 'Londres', nome: 'Gatwick', pais: 'Reino Unido' },
  { codigo: 'STN', cidade: 'Londres', nome: 'Stansted', pais: 'Reino Unido' },
  { codigo: 'LCY', cidade: 'Londres', nome: 'London City', pais: 'Reino Unido' },
  { codigo: 'FCO', cidade: 'Roma', nome: 'Fiumicino Leonardo da Vinci', pais: 'Itália' },
  { codigo: 'MXP', cidade: 'Milão', nome: 'Malpensa', pais: 'Itália' },
  { codigo: 'AMS', cidade: 'Amsterdã', nome: 'Schiphol', pais: 'Países Baixos' },
  { codigo: 'FRA', cidade: 'Frankfurt', nome: 'Frankfurt', pais: 'Alemanha' },
  { codigo: 'MUC', cidade: 'Munique', nome: 'Franz Josef Strauss', pais: 'Alemanha' },
  { codigo: 'ZRH', cidade: 'Zurique', nome: 'Zurique', pais: 'Suíça' },
  { codigo: 'DXB', cidade: 'Dubai', nome: 'Internacional de Dubai', pais: 'Emirados Árabes Unidos' },
  { codigo: 'DOH', cidade: 'Doha', nome: 'Hamad', pais: 'Catar' },
  { codigo: 'IST', cidade: 'Istambul', nome: 'Istambul', pais: 'Turquia' },

  { codigo: 'NYC', cidade: 'Nova York', nome: 'Todos os aeroportos (JFK, EWR, LGA)', pais: 'Estados Unidos', cidadeInteira: true },
  { codigo: 'JFK', cidade: 'Nova York', nome: 'John F. Kennedy', pais: 'Estados Unidos' },
  { codigo: 'EWR', cidade: 'Nova York (Newark)', nome: 'Newark Liberty', pais: 'Estados Unidos' },
  { codigo: 'LGA', cidade: 'Nova York', nome: 'LaGuardia', pais: 'Estados Unidos' },
  { codigo: 'MIA', cidade: 'Miami', nome: 'Internacional de Miami', pais: 'Estados Unidos' },
  { codigo: 'MCO', cidade: 'Orlando', nome: 'Internacional de Orlando', pais: 'Estados Unidos' },
  { codigo: 'FLL', cidade: 'Fort Lauderdale', nome: 'Fort Lauderdale-Hollywood', pais: 'Estados Unidos' },
  { codigo: 'LAX', cidade: 'Los Angeles', nome: 'Internacional de Los Angeles', pais: 'Estados Unidos' },
  { codigo: 'ATL', cidade: 'Atlanta', nome: 'Hartsfield-Jackson', pais: 'Estados Unidos' },
  { codigo: 'YYZ', cidade: 'Toronto', nome: 'Pearson', pais: 'Canadá' },
  { codigo: 'MEX', cidade: 'Cidade do México', nome: 'Benito Juárez', pais: 'México' },
  { codigo: 'CUN', cidade: 'Cancún', nome: 'Internacional de Cancún', pais: 'México' },
  { codigo: 'PTY', cidade: 'Cidade do Panamá', nome: 'Tocumen', pais: 'Panamá' },
  { codigo: 'BOG', cidade: 'Bogotá', nome: 'El Dorado', pais: 'Colômbia' },
  { codigo: 'LIM', cidade: 'Lima', nome: 'Jorge Chávez', pais: 'Peru' },
  { codigo: 'SCL', cidade: 'Santiago', nome: 'Arturo Merino Benítez', pais: 'Chile' },
  { codigo: 'BUE', cidade: 'Buenos Aires', nome: 'Todos os aeroportos (EZE, AEP)', pais: 'Argentina', cidadeInteira: true },
  { codigo: 'EZE', cidade: 'Buenos Aires', nome: 'Ezeiza (Ministro Pistarini)', pais: 'Argentina' },
  { codigo: 'AEP', cidade: 'Buenos Aires', nome: 'Aeroparque Jorge Newbery', pais: 'Argentina' },
  { codigo: 'MVD', cidade: 'Montevidéu', nome: 'Carrasco', pais: 'Uruguai' },
  { codigo: 'ASU', cidade: 'Assunção', nome: 'Silvio Pettirossi', pais: 'Paraguai' },
]

const porCodigo = new Map(aeroportos.map((a) => [a.codigo, a]))

export function buscarAeroportoPorCodigo(codigo: string): Aeroporto | undefined {
  return porCodigo.get(codigo.trim().toUpperCase())
}

/** "Salvador, Dep. Luís Eduardo Magalhães" — ou só a cidade quando o código cobre vários aeroportos. */
export function descreverAeroporto(codigo: string): string | null {
  const aeroporto = buscarAeroportoPorCodigo(codigo)
  if (!aeroporto) return null
  return aeroporto.cidadeInteira ? `${aeroporto.cidade}, todos os aeroportos` : `${aeroporto.cidade}, ${aeroporto.nome}`
}

const semAcento = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Aeroportos cujo código, cidade, nome ou país contêm o que foi digitado; o código exato vem primeiro. */
export function filtrarAeroportos(consulta: string): Aeroporto[] {
  const termo = semAcento(consulta.trim())
  if (!termo) return [...aeroportos]
  const exato: Aeroporto[] = []
  const comecaCom: Aeroporto[] = []
  const contem: Aeroporto[] = []
  for (const aeroporto of aeroportos) {
    const codigo = aeroporto.codigo.toLowerCase()
    const cidade = semAcento(aeroporto.cidade)
    if (codigo === termo) exato.push(aeroporto)
    else if (codigo.startsWith(termo) || cidade.startsWith(termo)) comecaCom.push(aeroporto)
    else if (semAcento(`${aeroporto.cidade} ${aeroporto.nome} ${aeroporto.pais}`).includes(termo)) contem.push(aeroporto)
  }
  return [...exato, ...comecaCom, ...contem]
}
