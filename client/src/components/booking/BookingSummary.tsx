import type { BookingState } from '../../types/appointment';
import { formatCurrency } from '../../utils/currency';
import { formatLongDate } from '../../utils/date';

export function BookingSummary({ booking }: { booking: BookingState }) {
  return (
    <aside className="booking-summary" aria-live="polite">
      <h3>Seu horário</h3>
      <dl>
        <div>
          <dt>Serviço</dt>
          <dd>{booking.service?.name || 'Escolha um serviço'}</dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>{booking.service ? formatCurrency(booking.service.price) : '-'}</dd>
        </div>
        <div>
          <dt>Duração</dt>
          <dd>{booking.service ? `${booking.service.durationMinutes} minutos` : '-'}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{booking.date ? formatLongDate(booking.date) : 'Escolha uma data'}</dd>
        </div>
        <div>
          <dt>Horário</dt>
          <dd>{booking.startTime && booking.endTime ? `${booking.startTime} às ${booking.endTime}` : 'Escolha um horário'}</dd>
        </div>
      </dl>
      <p>Confirmação enviada pelo WhatsApp.</p>
    </aside>
  );
}
