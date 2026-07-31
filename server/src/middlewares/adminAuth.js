import { allowLocalAdminFallback, hasSupabase, supabase } from '../config/supabase.js';

export async function requireAdmin(request, _response, next) {
  try {
    if (!hasSupabase && allowLocalAdminFallback) {
      request.admin = { id: 'local-admin', role: 'owner', name: 'Administrador local' };
      next();
      return;
    }

    if (!hasSupabase) {
      const error = new Error('Supabase administrativo não configurado.');
      error.status = 500;
      error.code = 'ADMIN_AUTH_NOT_CONFIGURED';
      throw error;
    }

    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
      const error = new Error('Sessao administrativa obrigatoria.');
      error.status = 401;
      error.code = 'ADMIN_AUTH_REQUIRED';
      throw error;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      const error = new Error('Sessao administrativa invalida.');
      error.status = 401;
      error.code = 'ADMIN_AUTH_INVALID';
      throw error;
    }

    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('id, name, role, active, avatar_url')
      .eq('id', userData.user.id)
      .eq('active', true)
      .maybeSingle();

    if (profileError || !profile || !['owner', 'admin'].includes(profile.role)) {
      const error = new Error('Usuario sem permissao administrativa.');
      error.status = 403;
      error.code = 'ADMIN_FORBIDDEN';
      throw error;
    }

    request.admin = profile;
    next();
  } catch (error) {
    next(error);
  }
}
