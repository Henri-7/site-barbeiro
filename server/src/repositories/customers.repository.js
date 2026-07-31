import { supabase } from '../config/supabase.js';
import { memoryStore } from '../data.seed.js';
import { makeId, nowIso } from '../utils/admin.js';

export async function findOrCreateCustomer({ name, phone }) {
  if (!supabase) {
    const existing = memoryStore.customers.find((customer) => customer.phone === phone);
    if (existing) {
      existing.updated_at = nowIso();
      return existing;
    }

    const customer = {
      id: makeId(),
      name,
      phone,
      notes: null,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    memoryStore.customers.push(customer);
    return customer;
  }

  const { data: existing, error: findError } = await supabase
    .from('customers')
    .select('id, name, phone, notes, created_at, updated_at')
    .eq('phone', phone)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({ name, phone })
    .select('id, name, phone, notes, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
