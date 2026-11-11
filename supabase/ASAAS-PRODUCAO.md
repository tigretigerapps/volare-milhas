# Asaas: teste final no sandbox e virada para produção

Nenhuma chave ou token vai neste arquivo. Os segredos ficam só nas Edge Functions do Supabase
(Project Settings > Edge Functions > Secrets) e são gravados por quem tem acesso ao painel.

## Como a cobrança funciona hoje

- `/assinar` chama a função `assinar`, que cria o cliente e a assinatura mensal no Asaas. A pessoa escolhe PIX, cartão ou boleto na fatura do Asaas.
- O Asaas avisa os pagamentos na função `asaas-webhook` (header `asaas-access-token`).
- Rede de segurança 1: ao abrir Conta ou Assinar, a função `assinar` confere o pagamento direto no Asaas.
- Rede de segurança 2: todo dia às 6h (horário de Brasília) a função `asaas-conciliar` confere todas as assinaturas com o Asaas e corrige o que o webhook não avisou.
- O assinante cancela em Conta e mantém o acesso até o fim do período pago. Às 0h30 a tarefa `encerrar-assinaturas-canceladas` encerra quem passou da data.

## 1. Provar o webhook no sandbox (antes da virada)

1. No site, com uma conta de teste, assine um plano e abra a fatura.
2. No painel do sandbox (sandbox.asaas.com), abra essa cobrança e use **Confirmar recebimento** (ou pague com um cartão de teste do Asaas).
3. Em até 1 minuto, a conta de teste deve aparecer como assinante ativo, sem abrir a página Conta.
4. Se não aparecer: em Integrações > Webhooks, confira se a fila está ativa (sem penalização) e se o token é o mesmo do segredo `ASAAS_WEBHOOK_TOKEN`.

## 2. Virada para produção

Na conta de produção do Asaas (a da Volare):

1. Integrações > Chaves de API: gerar a chave de produção (começa com `$aact_prod_`).
2. Integrações > Webhooks: criar o webhook
   - URL: `https://okhldqmyweioegpmxlbw.supabase.co/functions/v1/asaas-webhook`
   - Versão v3, envio não sequencial, fila ativa
   - Eventos de **cobranças** e de **assinaturas**
   - Token de autenticação: um texto novo de pelo menos 32 caracteres

No Supabase, em Edge Functions > Secrets, trocar os três segredos juntos:

| Segredo | Valor |
| --- | --- |
| `ASAAS_API_KEY` | a chave de produção |
| `ASAAS_AMBIENTE` | `producao` |
| `ASAAS_WEBHOOK_TOKEN` | o mesmo token cadastrado no webhook de produção |

Proteção: se a chave e o `ASAAS_AMBIENTE` não combinarem (chave `$aact_prod_` com ambiente sandbox, ou o contrário), as funções recusam a chamada. A pessoa vê "pagamento em manutenção" e o log diz `chave_de_outro_ambiente`.

## 3. Limpeza antes de abrir ao público

- Apagar a assinatura Plus de teste criada à mão (id `db5d5b7e-3c7e-4cba-9dc4-52cf98d97061`, sem ids do Asaas) e conferir que o perfil volta a "pendente".
- As assinaturas criadas no sandbox não existem na conta de produção. Com a chave de produção, a conciliação diária não as encontra e conta um erro por assinatura todo dia; é melhor apagá-las antes da virada.

## 4. Depois da virada

- Fazer uma assinatura real de valor baixo (ou do plano Base) e conferir que o acesso libera sozinho.
- Cancelar essa assinatura em Conta e conferir no painel do Asaas que ela foi cancelada.
- No dia seguinte, conferir no log da função `asaas-conciliar` o resumo `"corrigidas": 0` e `"erros": 0`.

## Pendente de decisão

- Teste grátis de 7 dias pedindo cartão no início (decidido em 11/11/2026). A tela `/assinatura` existe só no visual; falta ligar ao Asaas: a assinatura nasce com a primeira cobrança 7 dias depois.
