import * as adminService from '../services/admin.service.js';

function ok(response, data, message = 'Operação concluída.') {
  response.json({ success: true, data, message });
}

export async function dashboard(request, response, next) {
  try {
    ok(response, await adminService.getDashboard(), 'Dashboard carregado.');
  } catch (error) {
    next(error);
  }
}

export async function login(request, response, next) {
  try {
    ok(response, await adminService.loginAdmin(request.body), 'Login realizado.');
  } catch (error) {
    next(error);
  }
}

export async function refresh(request, response, next) {
  try {
    ok(response, await adminService.refreshAdminSession(request.body), 'Sessão renovada.');
  } catch (error) {
    next(error);
  }
}

export async function recoverPassword(request, response, next) {
  try {
    ok(response, await adminService.recoverAdminPassword(request.body), 'Recuperação enviada.');
  } catch (error) {
    next(error);
  }
}

export async function me(request, response, next) {
  try {
    ok(response, adminService.getAdminSession(request.admin), 'Sessão carregada.');
  } catch (error) {
    next(error);
  }
}

export async function listAppointments(request, response, next) {
  try {
    ok(response, await adminService.listAdminAppointments(request.query), 'Agendamentos carregados.');
  } catch (error) {
    next(error);
  }
}

export async function getAppointment(request, response, next) {
  try {
    const appointment = await adminService.getAdminAppointment(request.params.id);
    if (!appointment) {
      response.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agendamento não encontrado.' } });
      return;
    }
    ok(response, appointment, 'Agendamento carregado.');
  } catch (error) {
    next(error);
  }
}

export async function createAppointment(request, response, next) {
  try {
    response.status(201).json({ success: true, data: await adminService.createAdminAppointment(request.body, request.admin.id), message: 'Agendamento criado.' });
  } catch (error) {
    next(error);
  }
}

export async function patchAppointment(request, response, next) {
  try {
    ok(response, await adminService.updateAdminAppointment(request.params.id, request.body, request.admin.id), 'Agendamento atualizado.');
  } catch (error) {
    next(error);
  }
}

export async function deleteAppointment(request, response, next) {
  try {
    ok(response, await adminService.deleteAdminAppointment(request.params.id, request.admin.id), 'Agendamento excluído.');
  } catch (error) {
    next(error);
  }
}

export async function listServices(_request, response, next) {
  try {
    ok(response, await adminService.listAdminServices(), 'Serviços carregados.');
  } catch (error) {
    next(error);
  }
}

export async function saveService(request, response, next) {
  try {
    ok(response, await adminService.saveAdminService(request.body, request.admin.id), 'Serviço salvo.');
  } catch (error) {
    next(error);
  }
}

export async function deleteService(request, response, next) {
  try {
    ok(response, await adminService.deleteAdminService(request.params.id, request.admin.id), 'Serviço desativado.');
  } catch (error) {
    next(error);
  }
}

export async function listBusinessHours(_request, response, next) {
  try {
    ok(response, await adminService.listAdminBusinessHours(), 'Horários carregados.');
  } catch (error) {
    next(error);
  }
}

export async function saveBusinessHour(request, response, next) {
  try {
    ok(response, await adminService.saveAdminBusinessHour(request.params.id, request.body, request.admin.id), 'Horário salvo.');
  } catch (error) {
    next(error);
  }
}

export async function listBlockedDates(_request, response, next) {
  try {
    ok(response, await adminService.listAdminBlockedDates(), 'Bloqueios carregados.');
  } catch (error) {
    next(error);
  }
}

export async function saveBlockedDate(request, response, next) {
  try {
    ok(response, await adminService.saveAdminBlockedDate(request.body, request.admin.id), 'Bloqueio salvo.');
  } catch (error) {
    next(error);
  }
}

export async function deleteBlockedDate(request, response, next) {
  try {
    ok(response, await adminService.deleteAdminBlockedDate(request.params.id, request.admin.id), 'Bloqueio excluído.');
  } catch (error) {
    next(error);
  }
}

export async function listGallery(_request, response, next) {
  try {
    ok(response, await adminService.listAdminGallery(), 'Galeria carregada.');
  } catch (error) {
    next(error);
  }
}

export async function saveGallery(request, response, next) {
  try {
    ok(response, await adminService.saveAdminGallery(request.body, request.admin.id), 'Imagem salva.');
  } catch (error) {
    next(error);
  }
}

export async function uploadGallery(request, response, next) {
  try {
    ok(response, await adminService.uploadAdminGalleryImage(request.body, request.admin.id), 'Imagem enviada.');
  } catch (error) {
    next(error);
  }
}

export async function deleteGallery(request, response, next) {
  try {
    ok(response, await adminService.deleteAdminGallery(request.params.id, request.admin.id), 'Imagem excluída.');
  } catch (error) {
    next(error);
  }
}

export async function listCustomers(_request, response, next) {
  try {
    ok(response, await adminService.listAdminCustomers(), 'Clientes carregados.');
  } catch (error) {
    next(error);
  }
}

export async function saveCustomer(request, response, next) {
  try {
    ok(response, await adminService.saveAdminCustomer(request.body, request.admin.id), 'Cliente salvo.');
  } catch (error) {
    next(error);
  }
}

export async function listActivityLogs(_request, response, next) {
  try {
    ok(response, await adminService.listAdminActivityLogs(), 'Atividades carregadas.');
  } catch (error) {
    next(error);
  }
}
