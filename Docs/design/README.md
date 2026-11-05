# Volo Milhas — Design (handoff)

Fonte da verdade do visual do produto **Volo Milhas** ("Volo by Volare"). Gerado a partir do design system e do canvas de telas aprovados no claude.ai. Em caso de dúvida, este pacote vence o que estiver no código.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `tokens.css` | Todas as variáveis (cores, fontes, espaçamento, raios) + mapeamento para o shadcn/ui. Importar no `src/index.css`. |
| `tailwind.md` | Extensão do `tailwind.config.ts` com os mesmos tokens. |
| `componentes.md` | Especificação de cada componente: medidas, estados, responsivo, acessibilidade. |
| `telas.md` | As 5 telas aprovadas: estrutura, textos finais, dados de exemplo e casos de borda. |
| `componentes-referencia.css` | CSS de referência dos componentes (classes `vm-*`) usado nas prévias. Serve para conferir valores; no app, implementar com Tailwind + tokens. |
| `referencia/*.html` | O HTML das telas como foi desenhado no canvas. Usa tags do editor (`x-dc`, `sc-for`) e `{{ }}`: não é para rodar, é para ler medidas, textos e hierarquia. Os caminhos de imagem já apontam para `public/`. |
| `../../public/brand/` | Logos (SVG) e ícones do app. |
| `../../public/fotos/` | Fotos finais em WebP. Créditos abaixo. |

## Regras que não podem se perder

1. **Modo claro.** Fundo `--vm-surface-page`, superfícies `--vm-surface-card`, tinta `--vm-navy-700`.
2. **Serifa (Instrument Serif) em um único lugar:** o título do hero da home. Todo o resto é Hanken Grotesk.
3. **Sobre navy, o logo é sempre o branco** (`/brand/volo-logo-branco.svg`). Nunca o dourado sobre navy.
4. **Dourado é acento, não base.** `gold-500` em barras, filetes e sublinhado ativo. Texto dourado: `gold-700` sobre claro, `gold-300` sobre foto ou fundo escuro. Nunca `gold-500` em texto pequeno.
5. **Bordô é sinal de alerta** (badge e preço-alvo atingido). Nunca em botão.
6. **A régua é o centro da interface:** duas barras na mesma escala, veredito em reais (nunca só porcentagem).
7. **Resultados em lista com fios**, não grade de cards com sombra. Sem gradientes, sem caixa alta em rótulos, sem setas em botões, sem emoji.
8. **Fotografia só em telas de marca** (home, painel do teste grátis). Telas de trabalho ficam limpas.
9. **Contraste:** texto ≥ 4.5:1, bordas de controle ≥ 3:1. Os tokens já foram escolhidos para isso; não troque por "parecido".

## Pendências conhecidas

- Navy oficial: o PDF do logo usa `#132C47`; os SVG traçados usam `#263954`. Mantido `#132C47` até a Volare confirmar.
- SVGs do logo são traçados automáticos (VTracer). Para impressão e loja de apps, pedir o vetor original.
- Preço do plano (R$ 29,90) e textos de Promoções a confirmar com a Volare.

## Créditos das fotos

Licenças Unsplash e Pexels (uso comercial gratuito, crédito não obrigatório). Recortes já sem marcas de terceiros.

| Arquivo | Autor |
| --- | --- |
| hero-lisboa-panorama-desktop/mobile.webp | ertabbt (Pexels 10870570) |
| card-destinos-porto.webp | David Magalhães (Unsplash c8nRe0LVjgg) |
| card-promocoes-nordeste.webp | Cleber Nadalutti (Unsplash eNWKOxzkBwQ) |
| card-clube-janela.webp | Blake Guidry (Unsplash p9vr45T2scg) |
| painel-asa-noite.webp | Guillaume Lorain (Unsplash kyOWoVvNc0U) |
