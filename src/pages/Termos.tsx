import { Link } from 'react-router'

import { DocumentoLegal } from '@/components/DocumentoLegal'
import { empresa } from '@/lib/empresa'

const contato = (
  <a className="text-vm-navy-700 underline underline-offset-4 decoration-vm-line hover:decoration-vm-navy-700" href={`mailto:${empresa.email}`}>
    {empresa.email}
  </a>
)

export function Termos() {
  return (
    <DocumentoLegal
      titulo="Termos de uso"
      introducao={
        <p>
          Estes termos valem para o uso da plataforma {empresa.fantasia} Milhas, operada por {empresa.nome}, CNPJ {empresa.cnpj}. Ao criar uma
          conta, você declara que leu e aceita estes termos e a{' '}
          <Link className="text-vm-navy-700 underline underline-offset-4 decoration-vm-line hover:decoration-vm-navy-700" to="/privacidade">
            Política de privacidade
          </Link>
          .
        </p>
      }
      secoes={[
        {
          titulo: 'O que é o serviço',
          conteudo: (
            <p>
              A plataforma compara o preço de passagens aéreas em dinheiro e em milhas, calcula qual opção compensa com base no custo do milheiro
              que você informa, monitora rotas e avisa quando um preço bate a sua meta. Quando você encontra uma boa oferta, pode pedir o
              atendimento da equipe da {empresa.fantasia}, que cuida da reserva.
            </p>
          ),
        },
        {
          titulo: 'Conta e cadastro',
          conteudo: (
            <>
              <p>Você precisa ter 18 anos ou mais e informar dados verdadeiros. A conta é pessoal: não compartilhe sua senha nem permita o uso por outras pessoas.</p>
              <p>Se perceber uso indevido da sua conta, avise-nos pelo e-mail {contato} assim que possível.</p>
            </>
          ),
        },
        {
          titulo: 'Planos, preços e cobrança',
          conteudo: (
            <>
              <p>
                O acesso é por assinatura mensal, nos planos e preços exibidos na página de planos, e renova sozinha a cada mês até ser cancelada. Cada
                plano tem limites de uso, como o número de destinos diferentes por dia e de rotas com alerta.
              </p>
              <p>
                A cobrança é feita pelo Asaas, por PIX, cartão de crédito ou boleto, em uma página de pagamento própria dele. Não guardamos dados
                de cartão. Se uma cobrança não for paga, o acesso aos recursos pagos pode ser suspenso até a regularização.
              </p>
            </>
          ),
        },
        {
          titulo: 'Cancelamento',
          conteudo: (
            <>
              <p>
                Você pode cancelar a assinatura a qualquer momento na página Conta. Depois de cancelar, não há novas cobranças e você mantém o
                acesso até o fim do período que já pagou. Você também pode reativar a assinatura antes desse prazo acabar.
              </p>
              <p>
                Na primeira contratação feita pela internet, você pode desistir em até 7 dias, contados da contratação, e pedir o reembolso do que
                pagou, conforme o artigo 49 do Código de Defesa do Consumidor. Para isso, escreva para {contato}.
              </p>
            </>
          ),
        },
        {
          titulo: 'Preços, disponibilidade e comparações',
          conteudo: (
            <>
              <p>
                Os preços e a disponibilidade de voos vêm de fontes de terceiros e mudam o tempo todo. O que aparece na plataforma é informativo e
                não garante que a passagem esteja disponível por aquele valor no momento da reserva.
              </p>
              <p>
                A comparação entre dinheiro e milhas é uma estimativa feita com o custo do milheiro que você informa. Confira as condições finais
                com a equipe antes de decidir.
              </p>
            </>
          ),
        },
        {
          titulo: 'Pedido de atendimento',
          conteudo: (
            <p>
              Ao tocar em &quot;Quero essa oferta&quot;, você envia à equipe da {empresa.fantasia} os dados da oferta e os seus dados de contato
              (nome, e-mail e telefone) para que ela entre em contato. Esse pedido não é uma compra: a reserva só acontece depois de combinada com
              a equipe.
            </p>
          ),
        },
        {
          titulo: 'Alertas',
          conteudo: (
            <p>
              Os alertas de preço aparecem na plataforma e, se você conectar o Telegram, também por lá. Eles dependem das fontes de preços e
              podem atrasar ou falhar. Você pode desligar o Telegram a qualquer momento, na página Conta ou enviando /parar ao bot.
            </p>
          ),
        },
        {
          titulo: 'Uso adequado',
          conteudo: (
            <p>
              Não é permitido usar a plataforma para fraudar o serviço, copiar dados em massa por meios automáticos, tentar burlar os limites do plano
              ou prejudicar a estabilidade do sistema. Contas que fizerem isso podem ser suspensas.
            </p>
          ),
        },
        {
          titulo: 'Responsabilidades',
          conteudo: (
            <p>
              Fazemos o possível para manter a plataforma no ar e correta, mas ela pode ficar indisponível por manutenção ou por falhas de terceiros
              (como as fontes de preços e o provedor de pagamentos). Não nos responsabilizamos por decisões de compra tomadas só com base nas
              informações exibidas, nem por prejuízos que dependam de serviços de terceiros.
            </p>
          ),
        },
        {
          titulo: 'Mudanças nestes termos',
          conteudo: (
            <p>
              Podemos atualizar estes termos. Quando a mudança for relevante, avisaremos na plataforma ou por e-mail. Continuar usando o serviço
              depois do aviso significa que você aceita a nova versão.
            </p>
          ),
        },
        {
          titulo: 'Lei aplicável e contato',
          conteudo: (
            <p>
              Estes termos seguem a lei brasileira, e o foro é o do domicílio do consumidor. Dúvidas, pedidos e reclamações: {contato}.
            </p>
          ),
        },
      ]}
    />
  )
}
