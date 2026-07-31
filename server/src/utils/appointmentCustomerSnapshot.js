import { Buffer } from 'node:buffer';

const markerPattern = /(?:\n\n)?<!--appointment-customer:([A-Za-z0-9_-]+)-->/;

function encodeSnapshot(snapshot) {
  return Buffer.from(JSON.stringify(snapshot), 'utf8').toString('base64url');
}

function decodeSnapshot(value) {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

export function withAppointmentCustomerSnapshot(notes, snapshot) {
  const cleanNotes = String(notes || '').replace(markerPattern, '').trim();
  const marker = `<!--appointment-customer:${encodeSnapshot({
    name: snapshot.name || '',
    phone: snapshot.phone || ''
  })}-->`;

  return cleanNotes ? `${cleanNotes}\n\n${marker}` : marker;
}

export function resolveAppointmentCustomer(appointment) {
  const notes = String(appointment.notes || '');
  const match = notes.match(markerPattern);
  const snapshot = match ? decodeSnapshot(match[1]) : {};
  const cleanNotes = notes.replace(markerPattern, '').trim();

  return {
    customer_name: appointment.customer_name_snapshot || snapshot.name || appointment.customer_name || appointment.customers?.name || '',
    customer_phone: appointment.customer_phone_snapshot || snapshot.phone || appointment.customer_phone || appointment.customers?.phone || '',
    notes: cleanNotes || null
  };
}
