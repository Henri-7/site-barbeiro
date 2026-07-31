-- Referência futura equivalente para MySQL. Não é usada pelo sistema atual.

create table services (
  id varchar(80) primary key,
  name varchar(120) not null,
  description text not null,
  price decimal(10, 2) not null,
  duration_minutes int not null,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp
);

create table business_hours (
  id bigint primary key auto_increment,
  weekday int not null unique,
  opening_time time not null,
  closing_time time not null,
  break_start time null,
  break_end time null,
  active boolean not null default true
);

create table blocked_dates (
  id bigint primary key auto_increment,
  blocked_date date not null,
  reason varchar(255) null,
  all_day boolean not null default true,
  start_time time null,
  end_time time null,
  created_at timestamp not null default current_timestamp,
  index blocked_dates_date_idx (blocked_date)
);

create table appointments (
  id char(36) primary key,
  customer_name varchar(100) not null,
  customer_phone varchar(20) not null,
  service_id varchar(80) not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status enum('pending', 'confirmed', 'cancelled', 'completed', 'no_show') not null default 'pending',
  notes varchar(280) null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  constraint appointments_service_fk foreign key (service_id) references services(id),
  index appointments_date_status_idx (appointment_date, status, start_time)
);
