import { Check } from 'lucide-react';
import type { Service } from '../../types/service';
import { formatCurrency } from '../../utils/currency';

type ServiceStepProps = {
  services: Service[];
  selectedServiceId?: string;
  onSelect: (service: Service) => void;
};

export function ServiceStep({ services, selectedServiceId, onSelect }: ServiceStepProps) {
  return (
    <div className="step-panel">
      <h3>Escolha o atendimento</h3>
      <div className="compact-service-list">
        {services.map((service) => {
          const selected = selectedServiceId === service.id;
          return (
            <button key={service.id} className={selected ? 'is-selected' : ''} type="button" onClick={() => onSelect(service)}>
              <span>
                <strong>{service.name}</strong>
                <small>
                  {formatCurrency(service.price)} · {service.durationMinutes} min
                </small>
              </span>
              {selected ? <Check size={18} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
