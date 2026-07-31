import { z } from 'zod';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { allowLocalAdminFallback, hasSupabase, hasSupabaseAuth, supabase, supabaseAuth } from '../config/supabase.js';
import { createAppointment } from '../repositories/appointments.repository.js';
import { findServiceById } from '../repositories/services.repository.js';
import { isValidBrazilianPhone } from '../utils/phone.js';
import { calculateEndTime } from '../utils/timeSlots.js';
import { cleanText, nowIso } from '../utils/admin.js';
import {
  adminDeleteAppointment,
  adminDeleteBlockedDate,
  adminDeleteService,
  adminDeleteSimple,
  adminFindAppointment,
  adminListAppointments,
  adminListBlockedDates,
  adminListBusinessHours,
  adminListServices,
  adminListSimple,
  adminSaveBlockedDate,
  adminSaveBusinessHour,
  adminUpdateAppointment,
  adminUpsertService,
  adminUpsertSimple
} from '../repositories/admin.repository.js';

const statusValues = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
const galleryBucket = 'gallery-images';
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml']);
const maxImageBytes = 8 * 1024 * 1024;

const serviceSchema = z.object({
  id: z.string().min(2).optional(),
  name: z.string().trim().min(2),
  description: z.string().trim().min(2),
  price: z.coerce.number().nonnegative(),
  duration_minutes: z.coerce.number().int().positive(),
  active: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
  image_url: z.string().url().nullable().optional().or(z.literal('')),
  display_order: z.coerce.number().int().default(0),
  category: z.string().nullable().optional()
});

const appointmentSchema = z.object({
  customer_name: z.string().trim().min(3).max(100),
  customer_phone: z.string().refine(isValidBrazilianPhone, 'Telefone inválido.'),
  service_id: z.string().min(2),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(statusValues).default('pending'),
  notes: z.string().max(280).nullable().optional(),
  source: z.enum(['site', 'whatsapp', 'telefone', 'presencial']).default('site')
});

const timeFieldSchema = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/)
  .transform((value) => value.slice(0, 5));

const businessHourSchema = z.object({
  id: z.string().optional(),
  weekday: z.coerce.number().int().min(0).max(6),
  start_time: timeFieldSchema,
  end_time: timeFieldSchema,
  active: z.coerce.boolean().default(true)
});

const blockSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2).default('Bloqueio'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().min(2).nullable().optional(),
  all_day: z.coerce.boolean().default(true),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional()
});

const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6)
});

const adminRecoverSchema = z.object({
  email: z.string().trim().email(),
  redirectTo: z.string().url().optional()
});

const adminRefreshSchema = z.object({
  refreshToken: z.string().min(10)
});

function parse(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const error = new Error(result.error.issues[0]?.message || 'Dados inválidos.');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  return result.data;
}

function fileExtension(fileName = '', contentType = '') {
  const fromName = String(fileName).split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName;

  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg'
  };

  return map[contentType] || 'jpg';
}

function parseImageUpload(payload) {
  const contentType = cleanText(payload.contentType || '');
  const fileName = cleanText(payload.fileName || 'imagem');
  const dataUrl = String(payload.dataUrl || '');
  const base64 = dataUrl.includes(',') ? dataUrl.split(',').pop() : dataUrl;

  if (!allowedImageTypes.has(contentType)) {
    const error = new Error('Formato de imagem não permitido. Use JPG, PNG, WEBP, GIF, AVIF ou SVG.');
    error.status = 400;
    error.code = 'INVALID_IMAGE_TYPE';
    throw error;
  }

  const buffer = Buffer.from(base64 || '', 'base64');
  if (!buffer.length || buffer.length > maxImageBytes) {
    const error = new Error('Imagem inválida ou maior que 8 MB.');
    error.status = 400;
    error.code = 'INVALID_IMAGE_SIZE';
    throw error;
  }

  return { contentType, fileName, buffer };
}

async function ensureGalleryBucket() {
  const { error } = await supabase.storage.getBucket(galleryBucket);
  if (!error) return;

  const { error: createError } = await supabase.storage.createBucket(galleryBucket, {
    public: true,
    fileSizeLimit: maxImageBytes,
    allowedMimeTypes: Array.from(allowedImageTypes)
  });

  if (createError && !String(createError.message || '').toLowerCase().includes('already exists')) {
    throw createError;
  }
}

async function findActiveAdminProfile(userId) {
  const { data: profile, error } = await supabase
    .from('admin_profiles')
    .select('id, name, role, active, avatar_url')
    .eq('id', userId)
    .eq('active', true)
    .maybeSingle();

  if (error || !profile || !['owner', 'admin'].includes(profile.role)) {
    const forbidden = new Error('Usuário sem permissão administrativa.');
    forbidden.status = 403;
    forbidden.code = 'ADMIN_FORBIDDEN';
    throw forbidden;
  }

  return profile;
}

function buildAdminSession(user, profile, authSession = {}) {
  return {
    user: {
      id: profile?.id || user?.id || 'local-admin',
      email: user?.email || '',
      name: profile?.name || user?.email || 'Administrador',
      role: profile?.role || 'owner',
      avatar_url: profile?.avatar_url || null
    },
    accessToken: authSession.access_token || '',
    refreshToken: authSession.refresh_token || '',
    expiresAt: authSession.expires_at || null,
    configured: hasSupabase
  };
}

export async function loginAdmin(payload) {
  const credentials = parse(adminLoginSchema, payload);

  if (!hasSupabase && allowLocalAdminFallback) {
    return buildAdminSession({ email: credentials.email }, null, { access_token: 'local-dev-token' });
  }

  if (!hasSupabase || !hasSupabaseAuth) {
    const error = new Error('Supabase administrativo não configurado.');
    error.status = 500;
    error.code = 'ADMIN_AUTH_NOT_CONFIGURED';
    throw error;
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword(credentials);
  if (error || !data.session || !data.user) {
    const authError = new Error('E-mail ou senha inválidos.');
    authError.status = 401;
    authError.code = 'ADMIN_AUTH_INVALID';
    throw authError;
  }

  const profile = await findActiveAdminProfile(data.user.id);
  return buildAdminSession(data.user, profile, data.session);
}

export async function refreshAdminSession(payload) {
  const body = parse(adminRefreshSchema, payload);

  if (!hasSupabase && allowLocalAdminFallback) {
    return buildAdminSession({ email: 'admin@local.dev' }, null, { access_token: 'local-dev-token' });
  }

  if (!hasSupabase || !hasSupabaseAuth) {
    const error = new Error('Supabase administrativo não configurado.');
    error.status = 500;
    error.code = 'ADMIN_AUTH_NOT_CONFIGURED';
    throw error;
  }

  const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: body.refreshToken });
  if (error || !data.session || !data.user) {
    const authError = new Error('Sessão expirada. Entre novamente.');
    authError.status = 401;
    authError.code = 'ADMIN_SESSION_EXPIRED';
    throw authError;
  }

  const profile = await findActiveAdminProfile(data.user.id);
  return buildAdminSession(data.user, profile, data.session);
}

export async function recoverAdminPassword(payload) {
  const body = parse(adminRecoverSchema, payload);

  if (!hasSupabaseAuth) {
    const error = new Error('Recuperação de senha exige Supabase configurado.');
    error.status = 500;
    error.code = 'ADMIN_AUTH_NOT_CONFIGURED';
    throw error;
  }

  const { error } = await supabaseAuth.auth.resetPasswordForEmail(body.email, {
    redirectTo: body.redirectTo
  });

  if (error) {
    const recoverError = new Error('Não foi possível enviar a recuperação.');
    recoverError.status = 400;
    recoverError.code = 'ADMIN_RECOVER_FAILED';
    throw recoverError;
  }

  return true;
}

export function getAdminSession(admin) {
  return {
    user: {
      id: admin.id,
      email: admin.email || '',
      name: admin.name,
      role: admin.role,
      avatar_url: admin.avatar_url || null
    },
    configured: hasSupabase
  };
}

export async function getDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);
  const [appointmentsPage, services, logs] = await Promise.all([
    adminListAppointments({ pageSize: 200 }),
    adminListServices(),
    adminListSimple('admin_activity_logs')
  ]);
  const appointments = appointmentsPage.items;
  const todayAppointments = appointments.filter((item) => item.appointment_date === today);
  const monthAppointments = appointments.filter((item) => item.appointment_date?.startsWith(monthPrefix));
  const servicePrice = (appointment) => {
    const service = services.find((item) => item.id === appointment.service_id);
    return Number(appointment.service_price_snapshot || service?.price || 0);
  };
  const countByStatus = (status) => appointments.filter((item) => item.status === status).length;
  const estimate = (items) => items.filter((item) => !['cancelled', 'no_show'].includes(item.status)).reduce((total, item) => total + servicePrice(item), 0);
  const nextAppointment = appointments
    .filter((item) => `${item.appointment_date}T${item.start_time}` >= `${today}T00:00`)
    .sort((a, b) => `${a.appointment_date}${a.start_time}`.localeCompare(`${b.appointment_date}${b.start_time}`))[0] || null;

  return {
    cards: {
      today: todayAppointments.length,
      pending: countByStatus('pending'),
      confirmed: countByStatus('confirmed'),
      cancelled: countByStatus('cancelled'),
      completed: countByStatus('completed'),
      dayRevenue: estimate(todayAppointments),
      monthRevenue: estimate(monthAppointments)
    },
    todayAgenda: todayAppointments,
    nextAppointment,
    charts: {
      lastSevenDays: buildLastSevenDays(appointments),
      services: services.map((service) => ({
        name: service.name,
        total: appointments.filter((appointment) => appointment.service_id === service.id).length
      })),
      statuses: statusValues.map((status) => ({ status, total: countByStatus(status) }))
    },
    recentActivity: logs.slice(0, 8)
  };
}

function buildLastSevenDays(appointments) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, total: appointments.filter((item) => item.appointment_date === key).length };
  });
}

export const listAdminAppointments = adminListAppointments;
export const getAdminAppointment = adminFindAppointment;
export const updateAdminAppointment = adminUpdateAppointment;
export const deleteAdminAppointment = adminDeleteAppointment;
export const listAdminServices = adminListServices;
export const deleteAdminService = adminDeleteService;
export const listAdminBusinessHours = adminListBusinessHours;
export const listAdminBlockedDates = adminListBlockedDates;
export const deleteAdminBlockedDate = adminDeleteBlockedDate;

export async function createAdminAppointment(payload, adminId) {
  const appointment = parse(appointmentSchema, payload);
  const service = await findServiceById(appointment.service_id);
  if (!service) {
    const error = new Error('Serviço não encontrado.');
    error.status = 404;
    error.code = 'SERVICE_NOT_FOUND';
    throw error;
  }
  const endTime = calculateEndTime(appointment.start_time, service.duration_minutes);
  return createAppointment({
    customer_name: cleanText(appointment.customer_name),
    customer_phone: appointment.customer_phone,
    service_id: service.id,
    appointment_date: appointment.appointment_date,
    start_time: appointment.start_time,
    end_time: endTime,
    status: appointment.status,
    notes: appointment.notes || null,
    source: appointment.source,
    service_name_snapshot: service.name,
    service_price_snapshot: service.price,
    service_duration_snapshot: service.duration_minutes,
    updated_by: adminId
  });
}

export async function saveAdminService(payload, adminId) {
  const service = parse(serviceSchema, payload);
  return adminUpsertService(service, adminId);
}

export async function saveAdminBusinessHour(idOrWeekday, payload, adminId) {
  const hour = parse(businessHourSchema, payload);
  if (hour.start_time > hour.end_time) {
    const error = new Error('Horário de início deve ser menor que fim.');
    error.status = 400;
    error.code = 'INVALID_BUSINESS_HOUR';
    throw error;
  }
  return adminSaveBusinessHour(idOrWeekday, hour, adminId);
}

export async function saveAdminBlockedDate(payload, adminId) {
  const block = parse(blockSchema, payload);
  if (!block.all_day && (!block.start_time || !block.end_time || block.start_time >= block.end_time)) {
    const error = new Error('Informe um intervalo valido para o bloqueio.');
    error.status = 400;
    error.code = 'INVALID_BLOCK';
    throw error;
  }
  return adminSaveBlockedDate(block, adminId);
}

export async function listAdminGallery() {
  return adminListSimple('gallery_images');
}

export async function deleteAdminGallery(id, adminId) {
  return adminDeleteSimple('gallery_images', id, adminId, 'gallery_image');
}

export async function saveAdminGallery(payload, adminId) {
  const gallery = {
    id: payload.id,
    storage_path: payload.storage_path || payload.path || payload.public_url || `manual-${Date.now()}`,
    public_url: payload.public_url || null,
    title: cleanText(payload.title),
    description: cleanText(payload.description || ''),
    alt_text: cleanText(payload.alt_text || payload.title),
    category: cleanText(payload.category || ''),
    display_order: Number(payload.display_order || 0),
    active: payload.active !== false,
    featured: payload.featured === true,
    updated_at: nowIso()
  };
  return adminUpsertSimple('gallery_images', gallery, adminId, 'gallery_image');
}

export async function uploadAdminGalleryImage(payload, adminId) {
  const { contentType, fileName, buffer } = parseImageUpload(payload);
  const location = cleanText(payload.category || 'galeria') || 'galeria';
  const extension = fileExtension(fileName, contentType);
  const storagePath = `${location}/${Date.now()}-${randomUUID()}.${extension}`;

  if (!supabase) {
    return saveAdminGallery({
      ...payload,
      public_url: payload.dataUrl,
      storage_path: storagePath
    }, adminId);
  }

  await ensureGalleryBucket();

  const { error: uploadError } = await supabase.storage
    .from(galleryBucket)
    .upload(storagePath, buffer, {
      contentType,
      cacheControl: '31536000',
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(galleryBucket).getPublicUrl(storagePath);

  return saveAdminGallery({
    ...payload,
    storage_path: storagePath,
    public_url: data.publicUrl
  }, adminId);
}

export async function listAdminCustomers() {
  return adminListSimple('customers');
}

export async function saveAdminCustomer(payload, adminId) {
  return adminUpsertSimple('customers', {
    id: payload.id,
    name: cleanText(payload.name),
    phone: cleanText(payload.phone),
    notes: cleanText(payload.notes || ''),
    active: payload.active !== false
  }, adminId, 'customer');
}

export async function listAdminActivityLogs() {
  return adminListSimple('admin_activity_logs');
}
