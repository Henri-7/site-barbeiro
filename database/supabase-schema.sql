-- Barbearia Elite - banco público em 3FN para Supabase/PostgreSQL.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
  end if;

  if not exists (select 1 from pg_type where typname = 'appointment_source') then
    create type appointment_source as enum ('site', 'whatsapp', 'telefone', 'presencial');
  end if;
end $$;

create table if not exists public.services (
  id text primary key,
  name text not null,
  description text not null,
  price numeric(10, 2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  active boolean not null default true,
  featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  service_id text not null references public.services(id) on delete restrict,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status appointment_status not null default 'pending',
  source appointment_source not null default 'site',
  notes text,
  service_name_snapshot text not null,
  service_price_snapshot numeric(10, 2) not null check (service_price_snapshot >= 0),
  service_duration_snapshot integer not null check (service_duration_snapshot > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_valid check (start_time < end_time)
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_hours_time_valid check (start_time < end_time),
  constraint business_hours_unique_period unique (weekday, start_time, end_time)
);

create table if not exists public.blocked_periods (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  reason text,
  start_date date not null,
  end_date date not null,
  all_day boolean not null default true,
  start_time time,
  end_time time,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blocked_periods_date_valid check (start_date <= end_date),
  constraint blocked_periods_time_valid check (
    all_day
    or (start_time is not null and end_time is not null and start_time < end_time)
  )
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  public_url text,
  title text not null,
  description text,
  alt_text text not null,
  category text,
  display_order integer not null default 0,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  content_key text not null,
  content_value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_key, content_key)
);

create table if not exists public.booking_settings (
  id uuid primary key default gen_random_uuid(),
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes > 0),
  minimum_advance_minutes integer not null default 60 check (minimum_advance_minutes >= 0),
  maximum_advance_days integer not null default 60 check (maximum_advance_days > 0),
  buffer_minutes integer not null default 0 check (buffer_minutes >= 0),
  allow_same_day boolean not null default true,
  require_confirmation boolean not null default true,
  timezone text not null default 'America/Sao_Paulo',
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_settings_singleton check (id is not null)
);

create unique index if not exists booking_settings_single_row_idx
  on public.booking_settings ((true));

create index if not exists appointments_date_start_idx
  on public.appointments (appointment_date, start_time);

create index if not exists appointments_status_idx
  on public.appointments (status);

create index if not exists appointments_customer_idx
  on public.appointments (customer_id);

create index if not exists appointments_service_idx
  on public.appointments (service_id);

create index if not exists customers_phone_idx
  on public.customers (phone);

create index if not exists business_hours_weekday_idx
  on public.business_hours (weekday);

create index if not exists blocked_periods_range_idx
  on public.blocked_periods (start_date, end_date);

create index if not exists services_active_order_idx
  on public.services (active, display_order);

create index if not exists gallery_images_active_order_idx
  on public.gallery_images (active, display_order);

create index if not exists site_content_lookup_idx
  on public.site_content (section_key, content_key);

insert into public.services (id, name, description, price, duration_minutes, active, featured, display_order)
values
  ('corte-masculino', 'Corte Masculino', 'Corte alinhado ao seu estilo, com acabamento limpo e finalização.', 35.00, 30, true, true, 1),
  ('barba-completa', 'Barba Completa', 'Barba desenhada, alinhamento e finalização para um visual bem cuidado.', 30.00, 30, true, false, 2),
  ('corte-barba', 'Corte + Barba', 'Combo completo para sair com cabelo e barba no ponto.', 55.00, 60, true, true, 3)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  duration_minutes = excluded.duration_minutes,
  active = excluded.active,
  featured = excluded.featured,
  display_order = excluded.display_order,
  updated_at = now();

insert into public.business_hours (weekday, start_time, end_time, active)
values
  (1, '08:00', '12:00', true),
  (1, '14:00', '19:00', true),
  (2, '08:00', '12:00', true),
  (2, '14:00', '19:00', true),
  (3, '08:00', '12:00', true),
  (3, '14:00', '19:00', true),
  (4, '08:00', '12:00', true),
  (4, '14:00', '19:00', true),
  (5, '08:00', '12:00', true),
  (5, '14:00', '19:00', true),
  (6, '08:00', '12:00', true),
  (6, '14:00', '19:00', true)
on conflict (weekday, start_time, end_time) do update set
  active = excluded.active,
  updated_at = now();

insert into public.booking_settings (
  slot_interval_minutes,
  minimum_advance_minutes,
  maximum_advance_days,
  buffer_minutes,
  allow_same_day,
  require_confirmation,
  timezone,
  currency
)
values (30, 60, 60, 0, true, true, 'America/Sao_Paulo', 'BRL')
on conflict ((true)) do update set
  slot_interval_minutes = excluded.slot_interval_minutes,
  minimum_advance_minutes = excluded.minimum_advance_minutes,
  maximum_advance_days = excluded.maximum_advance_days,
  buffer_minutes = excluded.buffer_minutes,
  allow_same_day = excluded.allow_same_day,
  require_confirmation = excluded.require_confirmation,
  timezone = excluded.timezone,
  currency = excluded.currency,
  updated_at = now();

insert into public.blocked_periods (title, reason, start_date, end_date, all_day, active)
values
  ('Ano Novo', 'Feriado recorrente cadastrado para disponibilidade inicial', '2026-01-01', '2026-01-01', true, true),
  ('Tiradentes', 'Feriado recorrente cadastrado para disponibilidade inicial', '2026-04-21', '2026-04-21', true, true),
  ('Dia do Trabalhador', 'Feriado recorrente cadastrado para disponibilidade inicial', '2026-05-01', '2026-05-01', true, true),
  ('Independência do Brasil', 'Feriado recorrente cadastrado para disponibilidade inicial', '2026-09-07', '2026-09-07', true, true),
  ('Nossa Senhora Aparecida', 'Feriado recorrente cadastrado para disponibilidade inicial', '2026-10-12', '2026-10-12', true, true),
  ('Finados', 'Feriado recorrente cadastrado para disponibilidade inicial', '2026-11-02', '2026-11-02', true, true),
  ('Proclamação da República', 'Feriado recorrente cadastrado para disponibilidade inicial', '2026-11-15', '2026-11-15', true, true),
  ('Natal', 'Feriado recorrente cadastrado para disponibilidade inicial', '2026-12-25', '2026-12-25', true, true)
on conflict do nothing;

insert into public.site_content (section_key, content_key, content_value)
values
  ('hero', 'copy', '{"eyebrow":"Barbearia Elite em Cássia, MG","title":"Corte, barba e presença.","description":"Atendimento masculino com pontualidade, acabamento fino e agenda online."}'::jsonb),
  ('contact', 'main', '{"phone":"(35) 98475-2062","whatsapp":"5535984752062","address":"Endereço a definir","instagram":"Instagram a configurar"}'::jsonb)
on conflict (section_key, content_key) do update set
  content_value = excluded.content_value,
  updated_at = now();
