import { Link } from 'react-router'

import { DocumentoLegal } from '@/components/DocumentoLegal'
import { empresa } from '@/lib/empresa'

const contato = (
  <a className="text-texto underline underline-offset-4 decoration-fio hover:decoration-texto" href={`mailto:${empresa.email}`}>
    {empresa.email}
  </a>
)

export function Privacidade() {
  return (
    <DocumentoLegal
      titulo="Política de privacidade"
      introducao={
        <p>
          Esta política explica como {empresa.nome} (CNPJ {empresa.cnpj}), responsável pela plataforma {empresa.fantasia} Milhas, trata os seus dados
          pessoais, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018). Os{' '}
          <Link className="text-texto underline underline-offset-4 decoration-fio hover:decoration-texto" to="/termos">
            Termos de uso
          </Link>{' '}
          complementam este texto.
        </p>
      }
      secoes={[
        {
          titulo: 'Quais dados coletamos',
          conteudo: (
            <ul className="list-disc pl-5">
              <li>Cadastro: nome, e-mail, telefone (opcional) e senha. A senha é guardada de forma protegida, nunca em texto aberto.</li>
              <li>Uso: o custo do milheiro que você informa, as buscas de voos (origem, destino e datas), as rotas que você monitora com as metas de preço e os alertas enviados.</li>
              <li>Pedidos de atendimento: a oferta que você escolheu e os seus dados de contato, enviados à equipe.</li>
              <li>Pagamento: o CPF ou CNPJ que você informa na hora de assinar vai direto ao Asaas e não é guardado por nós. Dados de cartão ficam só com o Asaas.</li>
              <li>Telegram (opcional): o identificador da sua conversa com o bot, para enviar os alertas.</li>
            </ul>
          ),
        },
        {
          titulo: 'Para que usamos',
          conteudo: (
            <ul className="list-disc pl-5">
              <li>Criar e manter a sua conta e permitir o login (execução do contrato).</li>
              <li>Buscar e comparar voos, monitorar as suas rotas e avisar sobre preços (execução do contrato).</li>
              <li>Cobrar a assinatura e controlar o acesso conforme o pagamento (execução do contrato).</li>
              <li>Passar o seu pedido à equipe de atendimento e falar com você sobre ele (execução do contrato).</li>
              <li>Enviar alertas pelo Telegram, quando você conecta o bot (consentimento, que você retira quando quiser).</li>
              <li>Manter a segurança e prevenir fraudes e abusos (legítimo interesse).</li>
            </ul>
          ),
        },
        {
          titulo: 'Com quem compartilhamos',
          conteudo: (
            <>
              <p>Usamos prestadores de serviço que tratam dados por nossa conta e só para esses fins:</p>
              <ul className="list-disc pl-5">
                <li>Supabase: banco de dados e login.</li>
                <li>Cloudflare: hospedagem do site.</li>
                <li>Asaas: cobrança e pagamentos.</li>
                <li>Iddas Agência: sistema de atendimento da equipe, que recebe o seu pedido de atendimento.</li>
                <li>Telegram: entrega dos alertas, se você conectar o bot.</li>
              </ul>
              <p>
                As consultas de preços às companhias aéreas e aos programas de milhas levam só origem, destino e datas, sem dados pessoais. Alguns
                desses prestadores podem processar dados fora do Brasil, com as garantias previstas na lei. Não vendemos os seus dados.
              </p>
            </>
          ),
        },
        {
          titulo: 'Por quanto tempo guardamos',
          conteudo: (
            <p>
              Guardamos os dados enquanto a sua conta existir e pelo tempo necessário para cumprir obrigações legais, fiscais e de defesa em
              processos. Ao excluir a conta, apagamos ou anonimizamos os dados que não precisamos mais guardar.
            </p>
          ),
        },
        {
          titulo: 'Os seus direitos',
          conteudo: (
            <>
              <p>
                Você pode pedir, a qualquer momento: confirmação de que tratamos seus dados, acesso, correção, anonimização ou exclusão, portabilidade,
                informação sobre com quem compartilhamos e a revogação de consentimentos. Parte disso você faz sozinho na página Conta, como editar
                os dados e desconectar o Telegram.
              </p>
              <p>Para os demais pedidos, escreva para {contato}. Respondemos no prazo da lei.</p>
            </>
          ),
        },
        {
          titulo: 'Segurança',
          conteudo: (
            <p>
              Usamos conexão protegida, controle de acesso por conta e restrição de quem enxerga cada dado. Nenhum sistema é totalmente imune a
              falhas; se houver um incidente que possa afetar você, avisaremos você e a autoridade competente, conforme a lei.
            </p>
          ),
        },
        {
          titulo: 'Cookies e armazenamento no navegador',
          conteudo: (
            <p>
              Usamos o armazenamento do navegador só para o que o serviço precisa: manter você conectado e lembrar quais alertas você já viu. Não
              usamos cookies de publicidade nem de rastreamento.
            </p>
          ),
        },
        {
          titulo: 'Crianças e adolescentes',
          conteudo: <p>A plataforma é para maiores de 18 anos. Se soubermos de uma conta de menor, vamos encerrá-la.</p>,
        },
        {
          titulo: 'Mudanças nesta política e contato',
          conteudo: (
            <p>
              Podemos atualizar esta política e avisaremos quando a mudança for relevante. Dúvidas sobre privacidade e proteção de dados: {contato}.
            </p>
          ),
        },
      ]}
    />
  )
}
