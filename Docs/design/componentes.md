# Componentes

Tokens citados com o nome do design system (`navy-700` = `var(--vm-navy-700)` = `vm-navy-700` no Tailwind). Breakpoint único: **768px** (abaixo = celular).

---

## BarraSuperior

Barra fixa no topo no modelo da British Airways: navegação à esquerda, logo centralizado, conta à direita.

| Propriedade | Desktop | Celular |
| --- | --- | --- |
| Layout | grid `minmax(0,1fr) auto minmax(0,1fr)`, gap `space-6` | grid `44px 1fr 44px` |
| Altura | 96px | 72px |
| Padding lateral | `space-10` (40px) | 12px |
| Fundo | `navy-900` | `navy-900` |
| Logo | `/brand/volo-logo-branco.svg`, altura 56px, centralizado, link para a home | altura 46px |
| Links | "Buscar", "Minhas rotas"; 15px/500 branco, inativo com opacidade .78; padding `36px 0 34px` | viram menu (botão hambúrguer à esquerda, `aria-label="Abrir menu"`) |
| Link ativo | opacidade 1 + sublinhado 2px `gold-500` colado na base | — |
| Badge de alerta | pílula `burgundy-600`, texto branco 12px/600, min 20×20, ao lado de "Minhas rotas"; só quando há alerta não visto | ponto 8px `burgundy-600` sobre o ícone do menu |
| Conta | "Conta" 15px/500 branco .78, alinhado à direita | ícone de pessoa (traço 1.5px branco), `aria-label="Conta"` |

Acessibilidade: `<header>` + `<nav aria-label="Principal">`; o link ativo leva `aria-current="page"`; alvos de toque ≥ 44px.

---

## Botão

| Variante | Uso | Estilo | Hover | Foco |
| --- | --- | --- | --- | --- |
| Primário | uma ação principal por tela (Buscar, Ativar teste grátis, Nova rota) | fundo `navy-700`, texto branco 15px/600, altura 44–48px, padding 0 20–28px, `radius-sm` | fundo `navy-900` | anel 2px `navy-700`, offset 2px |
| Contorno (CTA de linha) | "Quero essa oferta", "Ver rota", "Tentar de novo" | fundo branco, borda 1.5px `navy-700`, texto `navy-700` 14px/500, altura 38px (44px no celular, largura total) | fundo `navy-700`, texto branco | idem |
| Link | "Editar", "Ver destinos" | texto `gold-700` 14px/500, sublinhado, offset 3px | `navy-700` | outline padrão |
| Pílula de ordenação | "Maior economia", "Horário", "Duração" | altura 36px, `radius-pill`; ativa: fundo `navy-700` texto branco; inativa: borda 1px `border-control` | — | idem |

Estados extras: **desabilitado** opacidade .5 e `cursor:not-allowed`; **carregando** mantém a largura, troca o texto por "Buscando…" e `aria-busy="true"`. Rótulos sempre com verbo, sentence case, sem setas.

---

## Campo

- Rótulo acima (`label` 13px/500, `ink-muted`), gap `space-2`. Nunca só placeholder.
- Input: altura 48px (44 na barra compacta de resultados), padding 0 `space-4`, borda 1px `border-control`, `radius-sm`, fundo branco, texto 16px `navy-700`.
- Código de aeroporto: 18px/600, maiúsculas, com autocomplete (cidade + código).
- Foco: borda `navy-700` + `box-shadow 0 0 0 1px navy-700`.
- Erro: borda e mensagem em `burgundy-600`, mensagem abaixo dizendo o que fazer ("CPF inválido. Confira os números."), `aria-invalid` + `aria-describedby`.
- Ajuda: 13px `ink-muted` abaixo do campo.

---

## Buscador

Bloco branco, `radius-md`, padding `space-6`, gap `space-4`.

- Linha de campos: grid `repeat(auto-fit, minmax(170px,1fr))`, gap 12px, alinhado na base: De, Para, Ida, Volta (placeholder "Só ida") e botão primário "Buscar".
- Abaixo: "Seu milheiro: **R$ 20,00** Editar" (14px `ink-muted`, valor `navy-700` 600 tabular) + frase sobre companhias consultadas.
- Na home fica sobreposto ao hero: `margin-top: -120px`, container `max-width: 1200px`.
- Na tela de resultados vira barra compacta: fundo branco de ponta a ponta, borda inferior `line`, campos 44px, botão contorno "Buscar de novo".
- Celular: campos em 2 colunas, botão em largura total.

---

## LinhaResultado (com a Régua e o Veredito)

A peça principal do produto. Uma linha por tarifa, separadas por fio `line`, dentro de um bloco branco `radius-md`.

**Desktop:** grid `repeat(auto-fit, minmax(260px,1fr))`, gap `space-6`, padding `space-6`, 3 colunas:

1. **Voo:** horário "07:10 – 09:40" 28px/300 tabular (`numeral`); abaixo, 14px `ink-muted`: "GRU para SSA, direto, 2h30" e "Smiles, voo G31650".
2. **Régua:** duas barras de 10px, raio 2px, gap `space-2`, cada uma com o valor ao lado (13px `ink-muted`, sem quebra):
   - de cima: dinheiro, cor `bar-dinheiro`, rótulo "R$ 528";
   - de baixo: milhas, cor `gold-500`, rótulo "18.500 mi + R$ 38" (Azul: "pts").
   - Escala: a barra maior da linha = 100%; a outra proporcional ao valor em reais. Custo das milhas = milhas ÷ 1000 × milheiro + taxas.
   - Se as milhas não compensam, a barra dourada fica com opacidade .4.
3. **Veredito:** 20px/600 tabular.
   - Milhas compensam: "Milhas economizam **R$ 120**" em `gold-700`; abaixo 13px `ink-muted` "com o seu milheiro a R$ 20" (ou "inclui R$ 40 de taxa de resgate" quando houver).
   - Dinheiro compensa: "Dinheiro sai **R$ 308** mais barato" em `navy-700`; abaixo "guarde suas milhas".
   - O valor nunca quebra de linha (`white-space: nowrap` no "R$ 120").
   - Em seguida, botão contorno "Quero essa oferta".

**Celular:** vira card branco `radius-md`, padding 16px, gap 14px, empilhado (voo → régua em largura total → veredito → botão de largura total 44px). Horário 26px.

**Animação:** só as barras crescem da esquerda ao aparecer (`scaleX 0→1`, 300ms, ease-out). Respeitar `prefers-reduced-motion`.

**Acessibilidade:** a régua tem `aria-label` com a frase completa ("Dinheiro R$ 528, milhas 18.500 mais R$ 38, milhas economizam R$ 120"); as barras são decorativas (`aria-hidden`).

**Estados:** carregando por companhia (linha esqueleto com as duas barras em `line`, texto "Consultando Azul…"); companhia sem voos ("Azul sem voos nessa data", linha discreta); companhia com erro (faixa `surface-page`: "Não conseguimos consultar a TAP agora. As outras companhias não foram afetadas." + "Tentar de novo"); lista vazia ("Nenhuma tarifa encontrada para essa data. Tente outro dia ou outra origem.").

---

## FaixaAlerta

Aviso de rota que chegou ao preço-alvo.

- Bloco branco `radius-md` (ou linha com fio dentro de lista), padding 14px `space-6`, gap 12px, 14px.
- Ponto 8px `burgundy-600` + **frase do fato em 600** ("GRU para LIS chegou ao seu preço-alvo.") + complemento `ink-muted` ("35.000 milhas na TAP, sua meta era 40.000.") + botão contorno "Ver rota".
- Celular: ponto alinhado ao topo, link "Ver rota" abaixo do texto.
- `role="status"` quando aparecer sem recarregar a página.

---

## CardVolareTour

Bloco "Da Volare Tour para você" na home: 3 cards (Destinos, Promoções, Clube de Alertas).

- Grid `repeat(auto-fit, minmax(280px,1fr))`, gap 16px.
- Card branco, `radius-md`, overflow hidden. Foto 180px de altura, `object-fit: cover`, `alt` descritivo.
- Corpo: padding 20px 24px 24px, gap 6px: selo 13px/500 `gold-700`; título 20px/600 (`title`); texto 14px `ink-muted`; link `gold-700` sublinhado.
- Links levam ao site da Volare Tour (definir URLs com a Volare).

---

## Rodapé

Fundo `navy-900`, padding 32px 24px, container 1200px, flex com wrap: logo branco 48px; texto 13px branco .78 "Uma plataforma da Volare Tour. A emissão das passagens é feita pela equipe da Volare."; links "Termos de uso" e "Privacidade" (13px branco .78).
