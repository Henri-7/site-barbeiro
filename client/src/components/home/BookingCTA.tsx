import { CalendarDays } from 'lucide-react';

export function BookingCTA() {
  return (
    <section className="booking-cta">
      <div>
        <span className="eyebrow">Agende seu horário</span>
        <h2>Seu próximo corte começa aqui.</h2>
        <p>Escolha o serviço, selecione um horário e fale com a Barbearia Elite pelo WhatsApp.</p>
      </div>
      <a className="btn btn-primary" href="#booking">
        <CalendarDays size={18} />
        Agendar agora
      </a>
    </section>
  );
}
