-- Leads enviados ao CRM Iddas: guarda a oferta de origem e o resultado do envio.
-- Só a Edge Function criar-lead (service_role) escreve nestas colunas; o cliente apenas lê os próprios leads.
alter table public.leads
  add column if not exists oferta_id uuid,
  add column if not exists crm_status text not null default 'pendente',
  add column if not exists crm_id bigint,
  add column if not exists crm_erro text,
  add column if not exists crm_enviado_em timestamptz;

alter table public.leads
  add constraint leads_crm_status_check check (crm_status in ('pendente', 'simulado', 'enviado', 'falhou'));

-- Evita lead repetido para a mesma oferta e acelera a checagem das últimas 24 horas.
create index if not exists leads_user_oferta_idx on public.leads (user_id, oferta_id, created_at desc);
-- Fila de reenvio: leads que o CRM não aceitou.
create index if not exists leads_crm_falhou_idx on public.leads (created_at) where crm_status = 'falhou';
