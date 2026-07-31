alter table public.appointments
  add column if not exists customer_name_snapshot text,
  add column if not exists customer_phone_snapshot text;

update public.appointments as appointment
set
  customer_name_snapshot = coalesce(appointment.customer_name_snapshot, customer.name),
  customer_phone_snapshot = coalesce(appointment.customer_phone_snapshot, customer.phone)
from public.customers as customer
where appointment.customer_id = customer.id
  and (appointment.customer_name_snapshot is null or appointment.customer_phone_snapshot is null);

