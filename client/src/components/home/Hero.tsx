import { motion } from 'framer-motion';
import { ArrowDown, CalendarDays, Scissors } from 'lucide-react';
import { usePublicContent } from '../../hooks/usePublicContent';
import { usePublicGallery } from '../../hooks/usePublicGallery';

function getImageUrl(image: { public_url?: string; storage_path?: string; path?: string } | undefined) {
  if (!image) return '';

  const source = image.public_url || image.storage_path || image.path || '';

  return source.startsWith('http') || source.startsWith('data:') ? source : '';
}

export function Hero() {
  const content = usePublicContent();
  const galleryImages = usePublicGallery();
  const hero = content.find((item) => item.section_key === 'hero' && item.content_key === 'copy')?.content_value as
    | { eyebrow?: string; title?: string; description?: string }
    | undefined;
  const heroImage = galleryImages.find((image) => image.category === 'hero-card');
  const heroImageUrl = getImageUrl(heroImage);

  return (
    <section className="hero-section" id="home">
      <motion.div
        className="hero-copy"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <span className="eyebrow">{hero?.eyebrow || 'Barbearia Elite em Cássia, MG'}</span>
        <h1>{hero?.title || 'Corte, barba e presença.'}</h1>
        <p>{hero?.description || 'Atendimento masculino com pontualidade, acabamento fino e agenda online.'}</p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#booking">
            <CalendarDays size={18} />
            Agendar agora
          </a>
          <a className="btn btn-secondary" href="#services">
            <Scissors size={18} />
            Ver serviços
          </a>
        </div>
      </motion.div>
      <motion.div
        className="hero-visual"
        aria-label="Barbearia Elite"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.15 }}
      >
        <div className="photo-placeholder">
          {heroImageUrl ? <img src={heroImageUrl} alt={heroImage?.alt_text || heroImage?.title} loading="eager" /> : null}
          <span>{heroImage?.title || 'Barbearia Elite'}</span>
          <strong>{heroImage?.description || 'Corte, barba e acabamento'}</strong>
        </div>
      </motion.div>
      <a className="scroll-indicator" href="#sobre" aria-label="Rolar para sobre">
        <ArrowDown size={18} />
      </a>
    </section>
  );
}
