-- Cancelamento com acesso até o fim do período pago: enquanto acesso_ate estiver no futuro, a assinatura segue ativa.
alter table public.subscriptions add column acesso_ate date;

-- Todo dia, pouco depois da meia-noite em São Paulo, encerra as assinaturas canceladas cujo período pago acabou.
-- (O gatilho do banco copia a nova situação para o perfil.)
select cron.schedule('encerrar-assinaturas-canceladas', '30 3 * * *', $job$
  update public.subscriptions
     set status = 'cancelado'
   where status = 'ativo'
     and acesso_ate is not null
     and acesso_ate < (now() at time zone 'America/Sao_Paulo')::date
$job$);
