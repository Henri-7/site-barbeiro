import { Check } from 'lucide-react';

const steps = ['Serviço', 'Data', 'Horário', 'Dados', 'Revisão'];

export function BookingStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="booking-stepper" aria-label="Etapas do agendamento">
      {steps.map((step, index) => (
        <li key={step} className={index === currentStep ? 'is-current' : index < currentStep ? 'is-done' : ''}>
          <span>{index < currentStep ? <Check size={14} /> : index + 1}</span>
          <strong>{step}</strong>
        </li>
      ))}
    </ol>
  );
}
