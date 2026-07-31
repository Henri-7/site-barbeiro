import { Armchair, Clock, Sparkles } from 'lucide-react';
import { SectionHeading } from '../common/SectionHeading';

export function About() {
  return (
    <section className="section about-section" id="sobre">
      <div className="about-content about-content-wide">
        <SectionHeading
          eyebrow="Sobre"
          title="Corte no tempo certo, acabamento de respeito."
          text="Atendimento masculino em Cássia, MG, com agenda organizada, ambiente confortável e cuidado em cada detalhe."
        />
        <div className="feature-grid">
          <article>
            <Clock size={20} />
            <h3>Pontualidade</h3>
            <p>Horários definidos para você chegar, sentar e ser atendido sem enrolação.</p>
          </article>
          <article>
            <Sparkles size={20} />
            <h3>Acabamento fino</h3>
            <p>Corte, barba e finalização com atenção ao seu estilo.</p>
          </article>
          <article>
            <Armchair size={20} />
            <h3>Ambiente preparado</h3>
            <p>Uma barbearia prática, confortável e pronta para receber você.</p>
          </article>
        </div>
        <div className="section-actions">
          <a className="btn btn-secondary" href="#booking">
            Agendar atendimento
          </a>
        </div>
      </div>
    </section>
  );
}
