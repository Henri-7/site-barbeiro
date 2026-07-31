import { Calendar, CheckCircle, Clock, ClipboardList, UserRound } from 'lucide-react';
import { SectionHeading } from '../common/SectionHeading';

const steps = [
  { icon: CheckCircle, title: 'Escolha o serviço' },
  { icon: Calendar, title: 'Escolha a data' },
  { icon: Clock, title: 'Escolha o horário' },
  { icon: UserRound, title: 'Informe seus dados' },
  { icon: ClipboardList, title: 'Revise a solicitação' }
];

export function HowItWorks() {
  return (
    <section className="section how-section">
      <SectionHeading eyebrow="Como funciona" title="Agendamento em cinco passos claros." />
      <div className="timeline">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <article key={step.title}>
              <span>{index + 1}</span>
              <Icon size={22} />
              <h3>{step.title}</h3>
            </article>
          );
        })}
      </div>
    </section>
  );
}
