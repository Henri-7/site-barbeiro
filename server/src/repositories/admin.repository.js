import { supabase } from '../config/supabase.js';
import { memoryStore, seedBusinessHours, seedServices } from '../data.seed.js';
import { makeId, nowIso, paginate } from '../utils/admin.js';
import { resolveAppointmentCustomer, withAppointmentCustomerSnapshot } from '../utils/appointmentCustomerSnapshot.js';

function serviceSort(first, second) {
  return (first.display_order || 0) - (second.display_order || 0) || first.name.localeCompare(second.name);
}

const serviceBaseColumns = 'id, name, description, price, duration_minutes, active, featured, display_order, created_at, updated_at';
const serviceFullColumns = `${serviceBaseColumns}, image_url, category`;
let servicesHasOptionalColumns = true;

function missingColumn(error, tableName) {
  return String(error?.message || '').includes(`column ${tableName}.`);
}

function withServiceDefaults(service) {
  return {
    image_url: null,
    category: null,
    ...service
  };
}

function servicePayloadForCurrentSchema(payload) {
  if (servicesHasOptionalColumns) return payload;
  const safePayload = { ...payload };
  delete safePayload.image_url;
  delete safePayload.category;
  return safePayload;
}

export async function adminListServices() {
  if (!supabase) {
    return seedServices.map((service, index) => ({ display_order: index + 1, ...service })).sort(serviceSort);
  }

  const selectColumns = servicesHasOptionalColumns ? serviceFullColumns : serviceBaseColumns;
  const { data, error } = await supabase
    .from('services')
    .select(selectColumns)
    .order('display_order', { ascending: true });

  if (error && servicesHasOptionalColumns && missingColumn(error, 'services')) {
    servicesHasOptionalColumns = false;
    return adminListServices();
  }

  if (error) throw error;
  return (data || []).map(withServiceDefaults);
}

export async function adminUpsertService(payload, adminId) {
  if (!supabase) {
    const current = seedServices.find((service) => service.id === payload.id);
    const next = {
      id: payload.id || payload.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name: payload.name,
      description: payload.description,
      price: Number(payload.price),
      duration_minutes: Number(payload.duration_minutes),
      active: Boolean(payload.active),
      featured: Boolean(payload.featured),
      image_url: payload.image_url || null,
      display_order: Number(payload.display_order || seedServices.length + 1),
      category: payload.category || null,
      updated_at: nowIso()
    };
    if (current) Object.assign(current, next);
    else seedServices.push(next);
    memoryStore.activityLogs.unshift({ id: makeId(), admin_id: adminId, action: current ? 'update' : 'create', entity_type: 'service', entity_id: next.id, new_data: next, created_at: nowIso() });
    return next;
  }

  const { data: oldService } = payload.id
    ? await supabase.from('services').select('price').eq('id', payload.id).maybeSingle()
    : { data: null };
  const selectColumns = servicesHasOptionalColumns ? serviceFullColumns : serviceBaseColumns;
  const { data, error } = await supabase
    .from('services')
    .upsert(servicePayloadForCurrentSchema(payload), { onConflict: 'id' })
    .select(selectColumns)
    .single();

  if (error && servicesHasOptionalColumns && missingColumn(error, 'services')) {
    servicesHasOptionalColumns = false;
    return adminUpsertService(payload, adminId);
  }

  if (error) throw error;
  const service = withServiceDefaults(data);
  if (oldService && Number(oldService.price) !== Number(service.price)) {
    await supabase.from('service_price_history').insert({ service_id: service.id, old_price: oldService.price, new_price: service.price, changed_by: adminId });
  }
  await logActivity(adminId, payload.id ? 'update' : 'create', 'service', service.id, oldService, service);
  return service;
}

export async function adminDeleteService(id, adminId) {
  if (!supabase) {
    const service = seedServices.find((item) => item.id === id);
    if (service) service.active = false;
    memoryStore.activityLogs.unshift({ id: makeId(), admin_id: adminId, action: 'deactivate', entity_type: 'service', entity_id: id, created_at: nowIso() });
    return service || null;
  }
  const { data, error } = await supabase.from('services').update({ active: false }).eq('id', id).select().single();
  if (error) throw error;
  await logActivity(adminId, 'deactivate', 'service', id, null, data);
  return data;
}

export async function adminListAppointments(filters = {}) {
  if (!supabase) {
    let items = memoryStore.appointments.map((appointment) => ({
      ...appointment,
      ...resolveAppointmentCustomer(appointment),
      service_name: seedServices.find((service) => service.id === appointment.service_id)?.name || appointment.service_name_snapshot || appointment.service_id
    }));
    if (filters.status) items = items.filter((item) => item.status === filters.status);
    if (filters.date) items = items.filter((item) => item.appointment_date === filters.date);
    if (filters.search) {
      const q = String(filters.search).toLowerCase();
      items = items.filter((item) => [item.customer_name, item.customer_phone, item.service_name, item.id].some((value) => String(value || '').toLowerCase().includes(q)));
    }
    return paginate(items.sort((a, b) => `${b.appointment_date}${b.start_time}`.localeCompare(`${a.appointment_date}${a.start_time}`)), filters.page, filters.pageSize);
  }

  let query = supabase
    .from('appointments')
    .select('id, customer_id, service_id, appointment_date, start_time, end_time, status, source, notes, service_name_snapshot, service_price_snapshot, service_duration_snapshot, created_at, customers(name, phone)', { count: 'exact' })
    .order('appointment_date', { ascending: false })
    .order('start_time', { ascending: false });
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.date) query = query.eq('appointment_date', filters.date);
  if (filters.search) query = query.or(`service_name_snapshot.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
  const page = Math.max(Number(filters.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(filters.pageSize) || 20, 1), 100);
  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw error;
  return {
    items: (data || []).map((appointment) => {
      const customer = resolveAppointmentCustomer(appointment);

      return {
        ...appointment,
        ...customer,
        source: appointment.source || 'site'
      };
    }),
    page,
    pageSize,
    total: count || 0
  };
}

export async function adminFindAppointment(id) {
  if (!supabase) {
    const appointment = memoryStore.appointments.find((item) => item.id === id);
    return appointment ? { ...appointment, ...resolveAppointmentCustomer(appointment) } : null;
  }
  const { data, error } = await supabase.from('appointments').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? { ...data, ...resolveAppointmentCustomer(data) } : null;
}

export async function adminUpdateAppointment(id, updates, adminId) {
  if (!supabase) {
    const appointment = memoryStore.appointments.find((item) => item.id === id);
    if (!appointment) return null;
    const oldData = { ...appointment };
    Object.assign(appointment, updates, { updated_at: nowIso() });
    memoryStore.activityLogs.unshift({ id: makeId(), admin_id: adminId, action: 'update', entity_type: 'appointment', entity_id: id, old_data: oldData, new_data: appointment, created_at: nowIso() });
    return appointment;
  }
  const oldData = await adminFindAppointment(id);
  if (updates.notes !== undefined && oldData) {
    updates.notes = withAppointmentCustomerSnapshot(updates.notes, {
      name: oldData.customer_name,
      phone: oldData.customer_phone
    });
  }
  const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  await supabase.from('appointment_history').insert({ appointment_id: id, action: 'update', old_data: oldData, new_data: data, changed_by: adminId });
  await logActivity(adminId, 'update', 'appointment', id, oldData, data);
  return data;
}

export async function adminDeleteAppointment(id, adminId) {
  if (!supabase) {
    const index = memoryStore.appointments.findIndex((item) => item.id === id);
    const removed = index >= 0 ? memoryStore.appointments.splice(index, 1)[0] : null;
    memoryStore.activityLogs.unshift({ id: makeId(), admin_id: adminId, action: 'delete', entity_type: 'appointment', entity_id: id, old_data: removed, created_at: nowIso() });
    return removed;
  }
  const oldData = await adminFindAppointment(id);
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
  await logActivity(adminId, 'delete', 'appointment', id, oldData, null);
  return oldData;
}

export async function adminListBusinessHours() {
  if (!supabase) return seedBusinessHours;
  const { data, error } = await supabase.from('business_hours').select('*').order('weekday');
  if (error) throw error;
  return data || [];
}

export async function adminSaveBusinessHour(idOrWeekday, payload, adminId) {
  if (!supabase) {
    const targetId = payload.id || idOrWeekday;
    const weekday = Number(payload.weekday ?? idOrWeekday);
    let current = seedBusinessHours.find((item) => item.id === targetId);

    if (!current) {
      current = seedBusinessHours.find((item) => item.weekday === weekday && item.start_time === payload.start_time) || seedBusinessHours.find((item) => item.weekday === weekday);
    }

    if (current) {
      Object.assign(current, payload);
    } else {
      current = { ...payload, id: targetId || makeId() };
      seedBusinessHours.push(current);
    }

    memoryStore.activityLogs.unshift({ id: makeId(), admin_id: adminId, action: 'update', entity_type: 'business_hour', entity_id: String(current.id || current.weekday), new_data: payload, created_at: nowIso() });
    return current;
  }

  const targetId = payload.id || idOrWeekday;
  const cleanPayload = { ...payload };

  if (targetId && !/^\d+$/.test(String(targetId))) {
    const { data, error } = await supabase.from('business_hours').update(cleanPayload).eq('id', targetId).select('*').maybeSingle();
    if (error) throw error;
    if (data) {
      await logActivity(adminId, 'update', 'business_hour', String(data.id), null, data);
      return data;
    }
  }

  const weekday = Number(payload.weekday ?? idOrWeekday);
  const { data, error } = await supabase
    .from('business_hours')
    .upsert({ ...cleanPayload, weekday }, { onConflict: 'weekday,start_time,end_time' })
    .select('*')
    .single();
  if (error) throw error;
  await logActivity(adminId, 'update', 'business_hour', String(data.id || data.weekday), null, data);
  return data;
}

export async function adminListBlockedDates() {
  if (!supabase) return memoryStore.blockedDates;
  const { data, error } = await supabase.from('blocked_periods').select('*').order('start_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function adminSaveBlockedDate(payload, adminId) {
  if (!supabase) {
    const block = { id: payload.id || makeId(), created_at: nowIso(), ...payload };
    const index = memoryStore.blockedDates.findIndex((item) => item.id === block.id);
    if (index >= 0) memoryStore.blockedDates[index] = block;
    else memoryStore.blockedDates.unshift(block);
    memoryStore.activityLogs.unshift({ id: makeId(), admin_id: adminId, action: index >= 0 ? 'update' : 'create', entity_type: 'blocked_date', entity_id: block.id, new_data: block, created_at: nowIso() });
    return block;
  }
  const { data, error } = await supabase.from('blocked_periods').upsert(payload).select('*').single();
  if (error) throw error;
  await logActivity(adminId, payload.id ? 'update' : 'create', 'blocked_date', data.id, null, data);
  return data;
}

export async function adminDeleteBlockedDate(id, adminId) {
  if (!supabase) {
    memoryStore.blockedDates = memoryStore.blockedDates.filter((item) => item.id !== id);
    memoryStore.activityLogs.unshift({ id: makeId(), admin_id: adminId, action: 'delete', entity_type: 'blocked_date', entity_id: id, created_at: nowIso() });
    return true;
  }
  const { error } = await supabase.from('blocked_periods').delete().eq('id', id);
  if (error) throw error;
  await logActivity(adminId, 'delete', 'blocked_date', id, null, null);
  return true;
}

export async function adminListSimple(tableName) {
  if (!supabase) {
    const map = {
      gallery_images: memoryStore.galleryImages,
      site_content: memoryStore.siteContent,
      customers: memoryStore.customers,
      admin_activity_logs: memoryStore.activityLogs
    };
    return map[tableName] || [];
  }
  const { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function adminUpsertSimple(tableName, payload, adminId, entityType = tableName) {
  if (!supabase) {
    const map = {
      gallery_images: memoryStore.galleryImages,
      customers: memoryStore.customers
    };
    const list = map[tableName];
    const item = { id: payload.id || makeId(), updated_at: nowIso(), created_at: payload.created_at || nowIso(), ...payload };
    const index = list.findIndex((entry) => entry.id === item.id);
    if (index >= 0) list[index] = item;
    else list.unshift(item);
    memoryStore.activityLogs.unshift({ id: makeId(), admin_id: adminId, action: index >= 0 ? 'update' : 'create', entity_type: entityType, entity_id: item.id, new_data: item, created_at: nowIso() });
    return item;
  }
  const { data, error } = await supabase.from(tableName).upsert(payload).select('*').single();
  if (error) throw error;
  await logActivity(adminId, payload.id ? 'update' : 'create', entityType, data.id || data.settings_key || data.section_key, null, data);
  return data;
}

export async function adminDeleteSimple(tableName, id, adminId, entityType = tableName) {
  if (!supabase) {
    const map = {
      gallery_images: memoryStore.galleryImages,
      customers: memoryStore.customers
    };
    map[tableName] = (map[tableName] || []).filter((item) => item.id !== id);
    if (tableName === 'gallery_images') memoryStore.galleryImages = map[tableName];
    if (tableName === 'customers') memoryStore.customers = map[tableName];
    memoryStore.activityLogs.unshift({ id: makeId(), admin_id: adminId, action: 'delete', entity_type: entityType, entity_id: id, created_at: nowIso() });
    return true;
  }
  const { error } = await supabase.from(tableName).delete().eq('id', id);
  if (error) throw error;
  await logActivity(adminId, 'delete', entityType, id, null, null);
  return true;
}

export async function logActivity(adminId, action, entityType, entityId, oldData, newData) {
  if (!supabase) {
    memoryStore.activityLogs.unshift({ id: makeId(), admin_id: adminId, action, entity_type: entityType, entity_id: entityId, old_data: oldData, new_data: newData, created_at: nowIso() });
    return;
  }
  await supabase.from('admin_activity_logs').insert({ admin_id: adminId, action, entity_type: entityType, entity_id: entityId, old_data: oldData, new_data: newData });
}
