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

## 1b. Testar o teste grátis no sandbox

1. Crie uma conta de teste no site (e-mail novo) e abra `/assinatura`.
2. Escolha o plano, informe um CPF válido de teste e toque em "Ativar teste grátis".
3. Na página do Asaas, cadastre um cartão de teste do sandbox (veja "Cartões de teste" na documentação do Asaas).
4. Ao voltar para Conta, a assinatura deve ficar ativa em alguns segundos, com "Teste grátis até ..." 7 dias depois.
5. Conferir no log da função `asaas-webhook` a linha `"teste":"ligado"` (ou, em `assinar`, `"teste":"ligado_na_volta"`).
6. Tentar de novo com outra conta e o mesmo CPF: deve aparecer "O teste grátis já foi usado".

O webhook precisa do evento **SUBSCRIPTION_CREATED** marcado (o diagnóstico acusa se faltar).

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

## Teste grátis

7 dias, com cartão cadastrado no Checkout do Asaas (o cartão não passa pelo Volo); a pessoa escolhe Base ou Plus.
Vale uma vez por conta e por CPF. A conta fica ativa assim que o Asaas cria a assinatura, ligada por três caminhos:
o evento SUBSCRIPTION_CREATED no webhook, a conferência ao voltar para Conta e, se nada disso chegar, a pessoa
ainda pode abrir Conta de novo (a conferência roda a cada visita enquanto estiver pendente).
