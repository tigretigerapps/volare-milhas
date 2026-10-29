-- Vínculo entre o assinante e o chat do Telegram que recebe os alertas.
-- O código de uso único e o chat_id só são escritos pelas Edge Functions (service_role); o assinante lê o próprio vínculo e pode desfazê-lo.
create table public.telegram_vinculos (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  codigo text unique,
  expira_em timestamptz,
  chat_id bigint unique,
  vinculado_em timestamptz,
  created_at timestamptz not null default now()
);

alter table public.telegram_vinculos enable row level security;

create policy telegram_vinculos_select_own on public.telegram_vinculos
  for select to authenticated using (user_id = (select auth.uid()));
create policy telegram_vinculos_delete_own on public.telegram_vinculos
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.telegram_vinculos from anon, authenticated;
-- O código de uso único não é lido pelo navegador: só a situação do vínculo.
grant select (user_id, vinculado_em, created_at) on public.telegram_vinculos to authenticated;
grant delete on public.telegram_vinculos to authenticated;
grant all on public.telegram_vinculos to service_role;
