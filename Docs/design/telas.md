# Telas

Cinco telas aprovadas. HTML de cada uma em `referencia/`. Valores de voo são **exemplo** (vêm do banco fake / `ofertas_comparadas` em produção); textos de interface são **finais**.

---

## 1. Home (`/` e `/buscar`) — `referencia/Main.html`

1. **BarraSuperior** com "Buscar" ativo.
2. **Hero** (altura 560px, fundo `navy-700` enquanto a foto carrega):
   - Foto `/fotos/hero-lisboa-panorama-desktop.webp` em `object-fit: cover; object-position: 50% 40%`; no celular `/fotos/hero-lisboa-panorama-mobile.webp`.
   - Camada `navy-900` a 30% (`rgba(19,44,71,.30)`), cor chapada, sem gradiente.
   - Texto à esquerda, container 1200px, padding-top 56px, largura máx. 760px (o título cabe em uma linha):
     - "Destino da semana" 15px/500 `gold-300`;
     - **"Lisboa por 35 mil milhas"** em Instrument Serif 68/70px branco (único uso da serifa no produto);
     - "Compare dinheiro e milhas em cada voo, com o seu milheiro, e deixe a Volare cuidar da emissão." 18/28px branco .88, máx. 520px.
   - Celular: título 44/48px, padding-top 40px.
3. **Buscador** sobreposto (−120px), com GRU → LIS, 20/01/2027 de exemplo.
4. **"Da Volare Tour para você"** (`heading-l`, 32/38px 600) + linha "Quando a viagem pede mais que a passagem, a equipe da Volare monta o resto." + 3 **CardVolareTour**:
   - Destinos — "Lisboa e Porto" — "Roteiros montados pela Volare, com hotel e passeios." — "Ver destinos" — `/fotos/card-destinos-porto.webp`
   - Promoções — "Nordeste em dezembro" — "Pacotes com preço fechado por tempo limitado. [Confirmar oferta com a Volare]" — "Ver promoções" — `/fotos/card-promocoes-nordeste.webp`
   - Clube de Alertas — "Ofertas antes de todo mundo" — "As melhores tarifas garimpadas pela Volare, direto no seu WhatsApp." — "Conhecer o clube" — `/fotos/card-clube-janela.webp`
5. **Rodapé.**

O "destino da semana" (foto, título, subtítulo) deve vir de uma configuração simples (constante ou tabela), para a Volare trocar sem deploy de layout.

---

## 2. Resultados (`/buscar/resultados`) — `referencia/Resultados.html`

1. BarraSuperior ("Buscar" ativo).
2. Buscador em barra compacta, preenchido com a busca atual.
3. Cabeçalho (container 1200px, padding 40px 24px):
   - Título `heading-l`: "São Paulo para Salvador, 15 de dezembro" (cidades por extenso, data por extenso).
   - Linha: "4 tarifas em 3 companhias, comparadas com o seu milheiro de **R$ 20,00**. Editar milheiro".
   - À direita (quebra abaixo no celular): "Ordenar por" + pílulas Maior economia (padrão) / Horário / Duração.
4. Lista de **LinhaResultado** num bloco branco `radius-md`, ordenada por maior economia. Exemplo do banco fake:

| Horário | Trecho | Programa | Dinheiro | Milhas | Veredito |
| --- | --- | --- | --- | --- | --- |
| 07:10 – 09:40 | GRU para SSA, direto, 2h30 | Smiles Clube, G31650 | R$ 528 | 14.800 mi + R$ 38 | Milhas economizam R$ 194 |
| 06:00 – 08:30 | VCP para SSA, direto, 2h30 | Azul Fidelidade, AD4510 | R$ 455 | 12.500 pts + R$ 75 | Milhas economizam R$ 130 (inclui R$ 40 de taxa de resgate) |
| 07:10 – 09:40 | GRU para SSA, direto, 2h30 | Smiles, G31650 | R$ 528 | 18.500 mi + R$ 38 | Milhas economizam R$ 120 |
| 10:15 – 15:05 | GRU para SSA, 1 parada em BSB, 4h50 | LATAM Pass, LA3320 | R$ 550 | 41.000 mi + R$ 37 | Dinheiro sai R$ 308 mais barato |

5. Faixa de erro de companhia no fim do bloco (exemplo TAP).
6. **FaixaAlerta** (GRU para LIS).
7. Nota 13px `ink-muted`: "Ao clicar em "Quero essa oferta", você fala com a equipe da Volare pelo WhatsApp, que confirma a disponibilidade e emite a passagem. Valores por adulto, com taxas."

---

## 3. Resultados no celular — `referencia/ResultadosMobile.html`

Mesma tela a 390px: BarraSuperior celular; faixa branca com "GRU para SSA" (18px/600) + "15 de dezembro, só ida, 1 adulto" + botão contorno "Alterar"; título "4 tarifas encontradas" (24/30px 600) + milheiro; cards empilhados com gap 12px; FaixaAlerta ao fim.

---

## 4. Minhas rotas (`/rotas`) — `referencia/MinhasRotas.html`

1. BarraSuperior ("Minhas rotas" ativo, badge 1).
2. Cabeçalho: "Minhas rotas" (`heading-l`) + "2 de 3 rotas com alerta. Conferimos todas uma vez por dia e avisamos você e a Volare quando o preço chega na sua meta." + botão primário "Nova rota".
3. Lista no mesmo padrão da LinhaResultado:
   - Coluna 1: rota "GRU – LIS" 28px/300 + "Ida entre 20 e 27 de janeiro" + companhias.
   - Coluna 2: régua **meta x hoje** (barra de cima `bar-dinheiro` = meta; de baixo `gold-500` = melhor preço de hoje, com opacidade .4 quando acima da meta).
   - Coluna 3, estado **atingiu**: ponto + "Chegou ao seu preço-alvo" em `burgundy-600` 18px/600; "TAP, voo TP82, 20 de janeiro. A Volare já foi avisada."; "Ver ofertas" + "Editar".
   - Coluna 3, estado **monitorando**: "Monitorando" `navy-700`; "Última conferência hoje, às 04:00. Ainda R$ 550 acima da meta."
4. Rodapé do bloco (`surface-page`): "Você ainda pode salvar mais 1 rota. Escolha uma janela de até 7 dias e um preço-alvo em milhas, em reais ou nos dois." + "Salvar nova rota". Com 3 rotas: "Você atingiu o limite de 3 rotas do seu plano." sem botão.
5. Vazio: "Você ainda não salvou nenhuma rota. Salve uma rota e avisamos quando o preço chegar na sua meta." + "Nova rota".

---

## 5. Ativar teste grátis (`/assinatura`) — `referencia/AtivarTeste.html`

Duas colunas (flex com wrap; empilha no celular):

- **Painel de marca** (`flex 1 1 420px`, min-altura 640px): fundo `navy-900` + foto `/fotos/painel-asa-noite.webp` (cover, ancorada embaixo); logo branco 96px; título "30 dias para testar, sem pagar nada" (36/42px 600 branco); 3 itens com marcador 8px `gold-500`: "Compare dinheiro e milhas em cada voo, com o seu milheiro." / "Salve até 3 rotas e receba alerta quando o preço chegar na sua meta." / "A equipe da Volare emite a passagem para você."
- **Formulário** (card branco `radius-md`, máx. 480px, padding 32px):
  - "Passo 3 de 3" + barra de progresso em 3 segmentos (2 `navy-700`, 1 `gold-500`).
  - "Ative seu teste grátis" (28/34px 600).
  - "A primeira cobrança de **R$ 29,90** acontece só depois de 30 dias. Avisamos 3 dias antes, e você pode cancelar quando quiser." (valor vem de `valor_plano()`).
  - Campo CPF (máscara, `inputmode="numeric"`) + ajuda "Usamos o CPF só para criar a assinatura no Asaas. Ele não fica guardado conosco."
  - Botão primário largura total "Ativar teste grátis".
  - Ícone de cadeado + "Você vai cadastrar o cartão numa página segura do Asaas. O cartão não passa pelo Volo."
  - Separador `line` + "Conta criada e milheiro definido em **R$ 20,00**. Alterar".
  - Erros (da Edge Function `assinar`): mensagem em `burgundy-600` abaixo do campo ou acima do botão, com os textos do plano do subsistema 1.
