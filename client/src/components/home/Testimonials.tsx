import { Star } from 'lucide-react';
import { testimonials } from '../../data/testimonials';
import { SectionHeading } from '../common/SectionHeading';

export function Testimonials() {
  return (
    <section className="section testimonials-section" id="avaliacoes">
      <SectionHeading eyebrow="Avaliações" title="Quem passa pela Elite, volta." text="Pontualidade, bom atendimento e acabamento caprichado." />
      <div className="testimonial-grid">
        {testimonials.map((testimonial) => (
          <article key={testimonial.name} className="testimonial-card">
            <div aria-label="5 estrelas">
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} size={15} fill="currentColor" />
              ))}
            </div>
            <p>"{testimonial.text}"</p>
            <strong>{testimonial.name}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
