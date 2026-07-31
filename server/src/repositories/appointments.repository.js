import { supabase } from '../config/supabase.js';
import { memoryStore } from '../data.seed.js';
import { randomUUID } from 'node:crypto';
import { findOrCreateCustomer } from './customers.repository.js';
import { withAppointmentCustomerSnapshot } from '../utils/appointmentCustomerSnapshot.js';

const activeStatuses = ['pending', 'confirmed'];

export async function listAppointmentsByDate(date) {
  if (!supabase) {
    return memoryStore.appointments.filter(
      (appointment) => appointment.appointment_date === date && activeStatuses.includes(appointment.status)
    );
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('id, customer_id, service_id, appointment_date, start_time, end_time, status, source, notes, service_name_snapshot, service_price_snapshot, service_duration_snapshot, created_at, customers(name, phone)')
    .eq('appointment_date', date)
    .in('status', activeStatuses)
    .order('start_time', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createAppointment(payload) {
  const customer = await findOrCreateCustomer({
    name: payload.customer_name,
    phone: payload.customer_phone
  });

  if (!supabase) {
    const appointment = {
      id: randomUUID(),
      customer_id: customer.id,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      status: payload.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...payload
    };
    memoryStore.appointments.push(appointment);
    return appointment;
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      customer_id: customer.id,
      service_id: payload.service_id,
      appointment_date: payload.appointment_date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      status: payload.status || 'pending',
      source: payload.source || 'site',
      notes: withAppointmentCustomerSnapshot(payload.notes || null, {
        name: payload.customer_name,
        phone: payload.customer_phone
      }),
      service_name_snapshot: payload.service_name_snapshot || null,
      service_price_snapshot: payload.service_price_snapshot || null,
      service_duration_snapshot: payload.service_duration_snapshot || null
    })
    .select('id, customer_id, service_id, appointment_date, start_time, end_time, status, source, notes, service_name_snapshot, service_price_snapshot, service_duration_snapshot, created_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
