-- Sistema administrativo da Barbearia Elite.
-- Execute depois de database/supabase-schema.sql.

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'admin' check (role in ('owner', 'admin', 'employee')),
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services
  add column if not exists image_url text,
  add column if not exists display_order integer not null default 0,
  add column if not exists category text;

create table if not exists public.service_price_history (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references public.services(id) on delete cascade,
  old_price numeric(10,2),
  new_price numeric(10,2) not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments
  add column if not exists customer_id uuid references public.customers(id),
  add column if not exists service_name_snapshot text,
  add column if not exists service_price_snapshot numeric(10,2),
  add column if not exists service_duration_snapshot integer,
  add column if not exists origin text not null default 'site' check (origin in ('site', 'admin', 'whatsapp', 'telefone', 'presencial'));

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'gallery-images',
  path text not null,
  public_url text,
  title text not null,
  description text,
  alt_text text not null,
  category text,
  display_order integer not null default 0,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  image_key text not null unique,
  bucket text not null default 'site-images',
  path text not null,
  public_url text,
  alt_text text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  content_key text not null,
  content_value jsonb,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(section_key, content_key)
);

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  settings_key text not null unique,
  settings_value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.appointment_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists services_order_idx on public.services (display_order, active);
create index if not exists customers_phone_idx on public.customers (phone);
create index if not exists appointments_customer_idx on public.appointments (customer_id);
create index if not exists gallery_images_order_idx on public.gallery_images (display_order, active);
create index if not exists site_content_lookup_idx on public.site_content (section_key, content_key);
create index if not exists admin_activity_logs_created_idx on public.admin_activity_logs (created_at desc);

insert into public.business_settings (settings_key, settings_value)
values
  ('business', '{"name":"Barbearia Elite","phone":"(35) 98475-2062","whatsapp":"5535984752062","timezone":"America/Sao_Paulo","currency":"BRL","address":"Endereço a definir"}'::jsonb),
  ('booking', '{"maxAdvanceDays":60,"minimumAdvanceMinutes":60,"slotIntervalMinutes":30,"initialStatus":"pending","requireConfirmation":true}'::jsonb),
  ('site', '{"showTestimonials":true,"showGallery":true,"showPrices":true,"showDuration":true,"maintenanceMode":false}'::jsonb)
on conflict (settings_key) do nothing;

insert into public.site_content (section_key, content_key, content_value)
values
  ('hero', 'copy', '{"eyebrow":"Barbearia Elite em Cássia, MG","title":"Corte, barba e presença.","description":"Atendimento masculino com pontualidade, acabamento fino e agenda online."}'::jsonb),
  ('contact', 'main', '{"phone":"(35) 98475-2062","whatsapp":"5535984752062","address":"Endereço a definir","instagram":"Instagram a configurar"}'::jsonb)
on conflict (section_key, content_key) do nothing;
