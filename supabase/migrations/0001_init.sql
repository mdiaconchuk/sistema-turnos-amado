-- Roles de usuario (vinculados a Supabase Auth)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('secretaria', 'facturista'))
);

-- Patrón semanal de atención (0 = domingo ... 6 = sábado)
create table public.weekly_schedule (
  id bigint generated always as identity primary key,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes smallint not null check (slot_minutes > 0),
  check (end_time > start_time)
);

-- Fechas completas bloqueadas
create table public.blocked_dates (
  date date primary key,
  reason text
);

-- Turnos (fecha y hora locales del consultorio, sin zona horaria)
create table public.appointments (
  id bigint generated always as identity primary key,
  date date not null,
  start_time time not null,
  patient_name text not null check (length(trim(patient_name)) > 0),
  dni text not null check (length(trim(dni)) > 0),
  obra_social text not null check (length(trim(obra_social)) > 0),
  phone text,
  status text not null default 'reservado'
    check (status in ('reservado', 'atendido', 'cancelado', 'ausente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Evita doble reserva: un horario solo puede estar ocupado por un turno no cancelado
create unique index appointments_unique_active_slot
  on public.appointments (date, start_time)
  where status <> 'cancelado';

-- Seguridad: activar RLS (sin políticas, el navegador no accede; tu backend usa la service role key)
alter table public.profiles enable row level security;
alter table public.weekly_schedule enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.appointments enable row level security;