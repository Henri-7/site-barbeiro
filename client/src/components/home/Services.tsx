import { motion } from 'framer-motion';
import { Check, Scissors, Shield, Star } from 'lucide-react';
import type { Service } from '../../types/service';
import { formatCurrency } from '../../utils/currency';
import { SectionHeading } from '../common/SectionHeading';
import { Skeleton } from '../common/Skeleton';

const icons = [Scissors, Shield, Star];

type ServicesProps = {
  services: Service[];
  selectedServiceId?: string;
  isLoading: boolean;
  error: string | null;
  onSelectService: (service: Service) => void;
  onRetry: () => void;
};

export function Services({ services, selectedServiceId, isLoading, error, onSelectService, onRetry }: ServicesProps) {
  return (
    <section className="section services-section" id="services">
      <SectionHeading
        eyebrow="Serviços"
        title="Escolha seu atendimento."
        text="Cortes, barba e combos com preço claro e tempo reservado."
      />
      {isLoading ? <Skeleton lines={3} /> : null}
      {error ? (
        <div className="empty-state service-error">
          <p>Os serviços não carregaram agora.</p>
          <button className="btn btn-secondary" type="button" onClick={onRetry}>
            Recarregar serviços
          </button>
        </div>
      ) : null}
      <div className="service-grid">
        {services.map((service, index) => {
          const Icon = icons[index % icons.length];
          const selected = selectedServiceId === service.id;
          return (
            <motion.article
              key={service.id}
              className={`service-card ${selected ? 'is-selected' : ''}`}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <div className="service-icon">
                <Icon size={24} />
              </div>
              {selected ? (
                <span className="selected-pill">
                  <Check size={14} />
                  Selecionado
                </span>
              ) : null}
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-meta">
                <strong>{formatCurrency(service.price)}</strong>
                <span>{service.durationMinutes} min</span>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => onSelectService(service)}>
                Escolher serviço
              </button>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
