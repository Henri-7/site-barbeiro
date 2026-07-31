import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3000),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  businessAddress: process.env.BUSINESS_ADDRESS || '',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappGraphVersion: process.env.WHATSAPP_GRAPH_VERSION || 'v22.0',
  whatsappTemplateName: process.env.WHATSAPP_TEMPLATE_NAME || '',
  whatsappTemplateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'pt_BR'
};
