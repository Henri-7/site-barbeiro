export const appointmentStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as const;

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu'
};

export function formatAppointmentStatus(status: string) {
  return statusLabels[status] || status;
}
