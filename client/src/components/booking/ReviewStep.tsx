import type { BookingState } from '../../types/appointment';
import { formatCurrency } from '../../utils/currency';
import { formatLongDate } from '../../utils/date';

type ReviewStepProps = {
  booking: BookingState;
  isSubmitting: boolean;
  error: string | null;
  suggestions: string[];
  onEdit: (step: number) => void;
  onSubmit: () => void;
};

export function ReviewStep({ booking, isSubmitting, error, suggestions, onEdit, onSubmit }: ReviewStepProps) {
  if (!booking.service || !booking.date || !booking.startTime || !booking.endTime) {
    return <div className="empty-state">Complete as etapas anteriores para revisar.</div>;
  }

  return (
    <div className="step-panel review-panel">
      <h3>Confira seu horário</h3>
      <p>A mensagem será aberta no WhatsApp da barbearia.</p>
      <dl>
        <div>
          <dt>Serviço</dt>
          <dd>
            {booking.service.name} <button type="button" onClick={() => onEdit(0)}>Editar serviço</button>
          </dd>
        </div>
        <div>
          <dt>Valor e duração</dt>
          <dd>{formatCurrency(booking.service.price)} · {booking.service.durationMinutes} min</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>
            {formatLongDate(booking.date)} <button type="button" onClick={() => onEdit(1)}>Editar data</button>
          </dd>
        </div>
        <div>
          <dt>Horário</dt>
          <dd>
            {booking.startTime} às {booking.endTime} <button type="button" onClick={() => onEdit(2)}>Editar horário</button>
          </dd>
        </div>
        <div>
          <dt>Cliente</dt>
          <dd>
            {booking.customerName} · {booking.customerPhone} <button type="button" onClick={() => onEdit(3)}>Editar dados</button>
          </dd>
        </div>
        {booking.notes ? (
          <div>
            <dt>Observações</dt>
            <dd>{booking.notes}</dd>
          </div>
        ) : null}
      </dl>
      {error ? <p className="form-alert" role="alert">{error}</p> : null}
      {suggestions.length > 0 ? <p className="suggestions">Sugestões próximas: {suggestions.join(', ')}</p> : null}
      <button className="btn btn-primary" type="button" disabled={isSubmitting} onClick={onSubmit}>
        {isSubmitting ? 'Agendando...' : 'Agendar horário'}
      </button>
    </div>
  );
}
