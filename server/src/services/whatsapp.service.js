import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { memoryStore } from '../data.seed.js';
import { normalizePhone } from '../utils/phone.js';

const defaultBusinessSettings = {
  name: 'Barbearia Elite',
  address: 'Endereço a definir'
};

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function formatAppointmentDate(dateString) {
  const [year, month, day] = String(dateString).split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function toWhatsAppPhone(value) {
  const digits = normalizePhone(value);

  if (digits.startsWith('55')) {
    return digits;
  }

  return `55${digits}`;
}

async function getBusinessSettings() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('settings_value')
        .eq('settings_key', 'business')
        .maybeSingle();

      if (!error && data?.settings_value) {
        return {
          ...defaultBusinessSettings,
          ...data.settings_value,
          address: env.businessAddress || data.settings_value.address || defaultBusinessSettings.address
        };
      }
    } catch (error) {
      console.warn('Não foi possível carregar business_settings para o WhatsApp.', error.message);
    }
  }

  const localBusiness = memoryStore.settings.find((setting) => setting.settings_key === 'business')?.settings_value || {};
  return {
    ...defaultBusinessSettings,
    ...localBusiness,
    address: env.businessAddress || localBusiness.address || defaultBusinessSettings.address
  };
}

export function buildAppointmentConfirmationMessage(summary, businessSettings) {
  const timeRange = `${summary.startTime} às ${summary.endTime}`;

  return [
    `Olá, ${summary.customerName}! Seu horário na ${businessSettings.name} foi agendado.`,
    '',
    `Serviço: ${summary.service}`,
    `Data: ${formatAppointmentDate(summary.appointmentDate)}`,
    `Horário: ${timeRange}`,
    `Duração: ${summary.durationMinutes} minutos`,
    `Valor: ${formatCurrency(summary.price)}`,
    `Local: ${businessSettings.address}`,
    '',
    'Te esperamos no horário marcado.'
  ].join('\n');
}

export async function buildAppointmentConfirmationUrl(summary) {
  const businessSettings = await getBusinessSettings();
  const to = toWhatsAppPhone(summary.customerPhone);
  const message = buildAppointmentConfirmationMessage(summary, businessSettings);

  return `https://wa.me/${to}?text=${encodeURIComponent(message)}`;
}

function buildTemplateComponents(summary, businessSettings) {
  const timeRange = `${summary.startTime} às ${summary.endTime}`;

  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: summary.customerName },
        { type: 'text', text: businessSettings.name },
        { type: 'text', text: summary.service },
        { type: 'text', text: formatAppointmentDate(summary.appointmentDate) },
        { type: 'text', text: timeRange },
        { type: 'text', text: `${summary.durationMinutes} minutos` },
        { type: 'text', text: formatCurrency(summary.price) },
        { type: 'text', text: businessSettings.address }
      ]
    }
  ];
}

function buildWhatsAppPayload(summary, businessSettings) {
  const to = toWhatsAppPhone(summary.customerPhone);

  if (env.whatsappTemplateName) {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: env.whatsappTemplateName,
        language: { code: env.whatsappTemplateLanguage },
        components: buildTemplateComponents(summary, businessSettings)
      }
    };
  }

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: false,
      body: buildAppointmentConfirmationMessage(summary, businessSettings)
    }
  };
}

export async function sendAppointmentConfirmation(summary) {
  if (!env.whatsappAccessToken || !env.whatsappPhoneNumberId) {
    return {
      status: 'disabled',
      provider: 'whatsapp_cloud_api',
      reason: 'WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID não configurados.'
    };
  }

  const businessSettings = await getBusinessSettings();
  const endpoint = `https://graph.facebook.com/${env.whatsappGraphVersion}/${env.whatsappPhoneNumberId}/messages`;
  const response = await globalThis.fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.whatsappAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(buildWhatsAppPayload(summary, businessSettings))
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Falha ao enviar WhatsApp: ${response.status}`);
    error.status = response.status;
    error.details = payload?.error || payload;
    throw error;
  }

  return {
    status: 'sent',
    provider: 'whatsapp_cloud_api',
    messageId: payload?.messages?.[0]?.id || null
  };
}
