import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { galleryItems } from '../../data/gallery';
import { usePublicGallery } from '../../hooks/usePublicGallery';
import { SectionHeading } from '../common/SectionHeading';

function resolveGallerySlot(image: { category?: string; display_order?: number }) {
  const categoryIndex = galleryItems.findIndex((item) => item.id === image.category);
  if (categoryIndex >= 0) return categoryIndex;

  const orderIndex = Number(image.display_order || 0) - 1;
  if (orderIndex >= 0 && orderIndex < galleryItems.length) return orderIndex;

  return -1;
}

function getImageUrl(image: { public_url?: string; storage_path?: string; path?: string }) {
  const source = image.public_url || image.storage_path || image.path || '';

  return source.startsWith('http') || source.startsWith('data:') ? source : '';
}

export function Gallery() {
  const publicImages = usePublicGallery();
  const galleryImages = publicImages.filter((image) => image.category !== 'hero-card');
  const items = galleryItems.map((slot, index) => {
    const image = galleryImages.find((item) => resolveGallerySlot(item) === index);

    return image
      ? {
          id: image.id,
          title: image.title || slot.title,
          description: image.description || slot.description,
          url: getImageUrl(image),
          alt: image.alt_text || image.title || slot.title,
        }
      : { ...slot, url: '', alt: slot.title };
  });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : items[activeIndex];
  const safeActiveIndex = activeIndex ?? 0;

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveIndex(null);
      if (event.key === 'ArrowRight') setActiveIndex((current) => (current === null ? current : (current + 1) % items.length));
      if (event.key === 'ArrowLeft') setActiveIndex((current) => (current === null ? current : (current - 1 + items.length) % items.length));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, items.length]);

  return (
    <section className="section gallery-section" id="galeria">
      <SectionHeading eyebrow="Galeria" title="Estilo que aparece no acabamento." text="Veja detalhes do espaço, dos cortes e da experiência na Barbearia Elite." />
      <div className="gallery-grid">
        {items.map((item, index) => (
          <button key={item.id} className={`gallery-item gallery-${index + 1}`} type="button" onClick={() => setActiveIndex(index)}>
            {item.url ? <img src={item.url} alt={item.alt} loading="lazy" /> : null}
            <span>{item.title}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </div>
      {active ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={active.title}>
          <button className="icon-button lightbox-close" type="button" aria-label="Fechar galeria" onClick={() => setActiveIndex(null)}>
            <X size={20} />
          </button>
          <button className="icon-button" type="button" aria-label="Imagem anterior" onClick={() => setActiveIndex((safeActiveIndex - 1 + items.length) % items.length)}>
            <ChevronLeft size={22} />
          </button>
          <div className="lightbox-image">
            {active.url ? <img src={active.url} alt={active.alt} /> : null}
            <span>{active.title}</span>
            <p>{active.description}</p>
          </div>
          <button className="icon-button" type="button" aria-label="Próxima imagem" onClick={() => setActiveIndex((safeActiveIndex + 1) % items.length)}>
            <ChevronRight size={22} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
