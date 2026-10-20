-- Painel administrativo: reenvio de leads e edição dos limites dos planos.

-- O pedido exato enviado (ou que seria enviado) ao CRM: o reenvio usa este corpo, sem remontar nada.
alter table public.leads add column if not exists crm_payload jsonb;

-- planos: só administrador altera, e só os limites. Ninguém cria nem apaga plano pelo navegador.
revoke insert, delete, truncate on public.planos from authenticated, anon;

create policy planos_update_admin on public.planos
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

alter table public.planos
  add constraint planos_limites_check check (destinos_por_dia >= 0 and rotas_com_alerta >= 0);
