-- Cobrança recorrente com o Asaas.
alter table public.planos add column preco_mensal numeric(10,2);
update public.planos set preco_mensal = 29.90 where plano = 'base';
update public.planos set preco_mensal = 49.90 where plano = 'plus';
alter table public.planos alter column preco_mensal set not null;
alter table public.planos add constraint planos_preco_check check (preco_mensal > 0);
grant update (preco_mensal) on public.planos to authenticated;

-- Uma assinatura por usuário (trocar de plano atualiza a mesma linha).
alter table public.subscriptions add constraint subscriptions_user_id_key unique (user_id);

-- Eventos do Asaas já processados: o Asaas pode enviar o mesmo evento mais de uma vez.
create table public.asaas_eventos (
  id text primary key,
  tipo text not null,
  recebido_em timestamptz not null default now()
);
alter table public.asaas_eventos enable row level security;
revoke all on public.asaas_eventos from anon, authenticated;
grant all on public.asaas_eventos to service_role;
