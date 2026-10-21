-- Motor de alertas: verificação periódica das rotas salvas contra o preço-alvo.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Alertas gerados pelo motor aparecem no site (canal 'app'); WhatsApp, Telegram e e-mail ficam para depois.
alter table public.alertas_enviados drop constraint alertas_enviados_canal_check;
alter table public.alertas_enviados
  add constraint alertas_enviados_canal_check check (canal in ('app', 'whatsapp', 'telegram', 'email'));

-- Histórico das verificações, para o painel administrativo.
create table public.alertas_execucoes (
  id bigint generated always as identity primary key,
  iniciado_em timestamptz not null default now(),
  concluido_em timestamptz,
  origem text not null check (origem in ('agendador', 'manual')),
  rotas_verificadas integer not null default 0,
  buscas integer not null default 0,
  alertas_gerados integer not null default 0,
  erros integer not null default 0,
  detalhe text
);
alter table public.alertas_execucoes enable row level security;
create policy alertas_execucoes_select_admin on public.alertas_execucoes
  for select to authenticated using ((select private.is_admin()));
revoke all on public.alertas_execucoes from anon, authenticated;
grant select on public.alertas_execucoes to authenticated;
grant all on public.alertas_execucoes to service_role;

-- Segredo que o agendador envia à função (fica no Vault, nunca no código).
select vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'alertas_cron', 'Segredo do agendador de alertas');

create or replace function public.validar_segredo_cron(p_segredo text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'alertas_cron' and decrypted_secret = p_segredo
  );
$$;
revoke execute on function public.validar_segredo_cron(text) from public, anon, authenticated;
grant execute on function public.validar_segredo_cron(text) to service_role;

-- Agendamento (aplicado separadamente, com a chave anon pública do projeto no lugar de <CHAVE_ANON>):
-- select cron.schedule('verificar-alertas-diario', '0 11 * * *', $job$
--   select net.http_post(
--     url := 'https://okhldqmyweioegpmxlbw.supabase.co/functions/v1/buscar-voos',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <CHAVE_ANON>',
--       'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'alertas_cron')),
--     body := '{"acao":"verificar_alertas"}'::jsonb)
-- $job$);
