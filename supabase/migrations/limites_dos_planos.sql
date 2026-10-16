-- Já aplicada no projeto (migration "limites_dos_planos"). Cópia para o histórico do repositório.
--
-- Planos de assinatura e seus limites. Fonte única: o gatilho de rotas, a Edge Function buscar-voos
-- e a interface leem daqui.
create table public.planos (
  plano text primary key check (plano in ('base', 'plus')),
  nome text not null,
  destinos_por_dia integer not null check (destinos_por_dia > 0),
  rotas_com_alerta integer not null check (rotas_com_alerta > 0)
);

alter table public.planos enable row level security;

create policy planos_select on public.planos
  for select to authenticated
  using (true);

grant select on public.planos to authenticated;
grant select on public.planos to service_role;

insert into public.planos (plano, nome, destinos_por_dia, rotas_com_alerta) values
  ('base', 'Base', 5, 2),
  ('plus', 'Plus', 10, 5);

-- Limite de rotas com alerta ativas por plano. Admin não tem limite; quem não tem assinatura ativa
-- não cria rotas novas. Rotas pausadas não contam.
create or replace function private.checar_limite_rotas()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_perfil record;
  v_limite integer;
  v_ativas integer;
begin
  if not new.ativo then
    return new;
  end if;

  -- Serializa por usuário: duas criações simultâneas não furam o limite.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  select papel, plano, status_assinatura into v_perfil
    from public.profiles where id = new.user_id;

  if v_perfil.papel = 'admin' then
    return new;
  end if;

  if v_perfil.status_assinatura = 'ativo' then
    select rotas_com_alerta into v_limite from public.planos where plano = v_perfil.plano;
  end if;
  v_limite := coalesce(v_limite, 0);

  select count(*) into v_ativas
    from public.rotas_salvas
   where user_id = new.user_id and ativo and id <> new.id;

  if v_ativas >= v_limite then
    raise exception 'limite_rotas'
      using errcode = 'P0001', detail = format('limite=%s', v_limite);
  end if;

  return new;
end;
$$;

create trigger rotas_limite
  before insert or update of ativo on public.rotas_salvas
  for each row execute function private.checar_limite_rotas();

-- Contagem de destinos por dia na Edge Function.
create index if not exists consultas_log_user_data_idx
  on public.consultas_log (user_id, consultado_em desc);
