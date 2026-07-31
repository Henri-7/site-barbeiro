import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

export function AdminModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button ref={closeRef} type="button" className="admin-icon-button" aria-label="Fechar" onClick={onClose}>
          <X size={18} />
        </button>
        <h2 id="admin-modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}
