import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AdminModal } from '../components/common/AdminModal';
import { AdminEmpty, AdminError, AdminLoading } from '../components/common/AdminState';
import { queryKeys } from '../lib/queryKeys';
import { adminRequest } from '../services/adminApi';
import { galleryItems } from '../../data/gallery';

type ImageItem = {
  id?: string;
  title: string;
  description?: string;
  alt_text: string;
  public_url?: string;
  category?: string;
  active: boolean;
  featured: boolean;
  display_order: number;
};

type ImageUpload = ImageItem & {
  fileName: string;
  contentType: string;
  dataUrl: string;
};

type EditorMode = 'create' | 'edit' | 'replace';
type FrameFocus = 'center' | 'top' | 'bottom' | 'left' | 'right';

const frameOptions: Array<{ value: FrameFocus; label: string }> = [
  { value: 'center', label: 'Centralizado' },
  { value: 'top', label: 'Mostrar mais o topo' },
  { value: 'bottom', label: 'Mostrar mais a parte de baixo' },
  { value: 'left', label: 'Mostrar mais a esquerda' },
  { value: 'right', label: 'Mostrar mais a direita' },
];

const blank: ImageItem = {
  title: '',
  description: '',
  alt_text: '',
  public_url: '',
  category: '',
  active: true,
  featured: false,
  display_order: 0,
};

const galleryLocations = [
  {
    id: 'hero-card',
    label: 'Card principal do topo',
    title: 'Barbearia Elite',
    description: 'Corte, barba e acabamento',
    displayOrder: 0,
  },
  ...galleryItems.map((item, index) => ({
    id: item.id,
    label: `Galeria - Local ${index + 1}`,
    title: item.title,
    description: item.description,
    displayOrder: index + 1,
  })),
];

function getGalleryLocation(image: Pick<ImageItem, 'category' | 'display_order'>) {
  const byCategory = galleryLocations.find((location) => location.id === image.category);
  if (byCategory) return byCategory;

  const order = Number(image.display_order || 0);
  if (order > 0) {
    return galleryLocations.find((location) => location.displayOrder === order) || null;
  }

  return null;
}

function getLocationLabel(image: Pick<ImageItem, 'category' | 'display_order'>) {
  const location = getGalleryLocation(image);

  if (!location) return 'Local não definido';

  return `${location.label} - ${location.title}`;
}

function buildImageForLocation(image: ImageItem, locationId: string) {
  const location = galleryLocations.find((item) => item.id === locationId);

  return {
    ...image,
    display_order: location?.displayOrder ?? image.display_order,
    title: image.title || location?.title || '',
    description: image.description || location?.description || '',
    alt_text: image.alt_text || location?.title || '',
    category: location?.id || image.category || '',
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
    reader.readAsDataURL(file);
  });
}

function targetSizeForImage(image: ImageItem) {
  const location = getGalleryLocation(image);

  if (location?.id === 'hero-card') return { width: 1200, height: 1500 };
  if (location?.displayOrder === 1) return { width: 900, height: 1100 };
  if (location?.displayOrder === 4) return { width: 1600, height: 760 };

  return { width: 1100, height: 760 };
}

function imageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível preparar a imagem.'));
    image.src = url;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement, contentType = 'image/webp') {
  return new Promise<{ dataUrl: string; contentType: string }>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.9), contentType: 'image/jpeg' });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: String(reader.result || ''), contentType });
      reader.readAsDataURL(blob);
    }, contentType, 0.9);
  });
}

function sharpenCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return;

  const source = context.getImageData(0, 0, canvas.width, canvas.height);
  const output = context.createImageData(source.width, source.height);
  const input = source.data;
  const result = output.data;
  const width = source.width;
  const height = source.height;
  const kernel = [0, -0.35, 0, -0.35, 2.4, -0.35, 0, -0.35, 0];
  result.set(input);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const target = (y * width + x) * 4;
      let red = 0;
      let green = 0;
      let blue = 0;

      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const sourceIndex = ((y + ky) * width + (x + kx)) * 4;
          const weight = kernel[(ky + 1) * 3 + (kx + 1)];
          red += input[sourceIndex] * weight;
          green += input[sourceIndex + 1] * weight;
          blue += input[sourceIndex + 2] * weight;
        }
      }

      result[target] = Math.max(0, Math.min(255, red));
      result[target + 1] = Math.max(0, Math.min(255, green));
      result[target + 2] = Math.max(0, Math.min(255, blue));
      result[target + 3] = input[target + 3];
    }
  }

  context.putImageData(output, 0, 0);
}

async function prepareImageForUpload(file: File, image: ImageItem, focus: FrameFocus, enhanceQuality: boolean) {
  if (['image/svg+xml', 'image/gif'].includes(file.type)) {
    return {
      fileName: file.name,
      contentType: file.type,
      dataUrl: await readFileAsDataUrl(file),
    };
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const source = await imageFromUrl(objectUrl);
    const target = targetSizeForImage(image);
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível processar a imagem.');

    const targetRatio = target.width / target.height;
    const sourceRatio = source.naturalWidth / source.naturalHeight;
    let sx = 0;
    let sy = 0;
    let sw = source.naturalWidth;
    let sh = source.naturalHeight;

    if (sourceRatio > targetRatio) {
      sw = source.naturalHeight * targetRatio;
      sx = focus === 'left' ? 0 : focus === 'right' ? source.naturalWidth - sw : (source.naturalWidth - sw) / 2;
    } else {
      sh = source.naturalWidth / targetRatio;
      sy = focus === 'top' ? 0 : focus === 'bottom' ? source.naturalHeight - sh : (source.naturalHeight - sh) / 2;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.filter = enhanceQuality ? 'contrast(1.06) saturate(1.06) brightness(1.02)' : 'none';
    context.drawImage(source, sx, sy, sw, sh, 0, 0, target.width, target.height);
    context.filter = 'none';

    if (enhanceQuality) sharpenCanvas(canvas);

    return {
      fileName: file.name.replace(/\.[^.]+$/, '.webp'),
      ...(await canvasToDataUrl(canvas, 'image/webp')),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function AdminGalleryPage() {
  const [editing, setEditing] = useState<ImageItem | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [formError, setFormError] = useState<string | null>(null);
  const client = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.gallery,
    queryFn: () => adminRequest<ImageItem[]>('/gallery'),
  });
  const save = useMutation({
    mutationFn: (image: ImageItem) =>
      adminRequest<ImageItem>(image.id ? `/gallery/${image.id}` : '/gallery', {
        method: image.id ? 'PATCH' : 'POST',
        body: JSON.stringify(image),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.gallery }),
  });
  const upload = useMutation({
    mutationFn: (image: ImageUpload) =>
      adminRequest<ImageItem>('/gallery/upload', {
        method: 'POST',
        body: JSON.stringify(image),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.gallery }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminRequest(`/gallery/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.gallery }),
  });

  function openEditor(image: ImageItem, mode: EditorMode) {
    setEditing(image);
    setEditorMode(mode);
    setFormError(null);
  }

  function openCreateAtLocation(locationId: string) {
    openEditor(buildImageForLocation(blank, locationId), 'create');
  }

  function deleteImage(image: ImageItem) {
    if (!image.id) return;

    const confirmed = window.confirm(`Excluir "${image.title}" da galeria?`);
    if (confirmed) remove.mutate(image.id);
  }

  if (query.isLoading) return <AdminLoading />;
  if (query.isError) return <AdminError text="Não foi possível carregar a galeria." onRetry={() => void query.refetch()} />;

  const images = [...(query.data || [])].sort((first, second) =>
    (first.display_order || 0) - (second.display_order || 0) || first.title.localeCompare(second.title)
  );

  return (
    <section className="admin-card admin-gallery-page">
      <div className="admin-section-title admin-gallery-header">
        <div>
          <h2>Galeria</h2>
          <p>Cada local abaixo corresponde a um card da galeria exibida no site.</p>
        </div>
        <button className="admin-button primary" type="button" onClick={() => openEditor(blank, 'create')}>
          <ImagePlus size={17} />
          Adicionar Nova Imagem
        </button>
      </div>

      <div className="admin-gallery-slots" aria-label="Locais das fotos no site">
        {galleryLocations.map((location) => {
          const image = images.find((item) => {
            const imageLocation = getGalleryLocation(item);
            return imageLocation?.id === location.id;
          });

          return (
            <button className="admin-gallery-slot" type="button" key={location.id} onClick={() => image ? openEditor(image, 'replace') : openCreateAtLocation(location.id)}>
              <span>{location.label}</span>
              <strong>{location.title}</strong>
              <small>{image ? `Foto inserida: ${image.title}` : 'Sem foto inserida'}</small>
            </button>
          );
        })}
      </div>

      {images.length === 0 ? (
        <AdminEmpty text="Nenhuma imagem cadastrada." />
      ) : (
        <div className="admin-gallery-grid">
          {images.map((image, index) => (
            <article key={image.id || image.title} className={`admin-gallery-card ${image.active ? '' : 'is-inactive'}`}>
              <button className="admin-gallery-preview" type="button" onClick={() => openEditor(image, 'edit')} aria-label={`Editar ${image.title}`}>
                {image.public_url ? <img src={image.public_url} alt={image.alt_text || image.title} loading="lazy" /> : <span>Sem imagem</span>}
                <span className="admin-gallery-position">{index + 1}</span>
                {image.featured ? <span className="admin-gallery-badge">Destaque</span> : null}
              </button>

              <div className="admin-gallery-body">
                <div>
                  <h3>{image.title || 'Imagem sem título'}</h3>
                  <p>{image.description || 'Sem descrição cadastrada.'}</p>
                </div>
                <dl>
                  <div>
                    <dt>Status</dt>
                    <dd>{image.active ? 'Visível no site' : 'Oculta'}</dd>
                  </div>
                  <div>
                    <dt>Local no site</dt>
                    <dd>{getLocationLabel({ category: image.category, display_order: image.display_order || index + 1 })}</dd>
                  </div>
                  <div>
                    <dt>Ordem</dt>
                    <dd>{image.display_order || 0}</dd>
                  </div>
                </dl>
              </div>

              <div className="admin-gallery-actions">
                <button className="admin-link-button" type="button" onClick={() => openEditor(image, 'edit')}>
                  <Edit3 size={15} />
                  Editar
                </button>
                <button className="admin-link-button" type="button" onClick={() => openEditor(image, 'replace')}>
                  <RefreshCw size={15} />
                  Substituir
                </button>
                <button className="admin-link-button danger" type="button" onClick={() => deleteImage(image)}>
                  <Trash2 size={15} />
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing ? (
        <ImageModal
          mode={editorMode}
          image={editing}
          isSaving={save.isPending || upload.isPending}
          error={formError}
          onClose={() => setEditing(null)}
          onSave={async (image, file, frameFocus, enhanceQuality) => {
            try {
              setFormError(null);
              if (file) {
                const preparedImage = await prepareImageForUpload(file, image, frameFocus, enhanceQuality);
                await upload.mutateAsync({
                  ...image,
                  ...preparedImage,
                });
              } else {
                await save.mutateAsync(image);
              }
              setEditing(null);
            } catch (error) {
              setFormError((error as Error).message);
            }
          }}
        />
      ) : null}
    </section>
  );
}

function ImageModal({
  mode,
  image,
  isSaving,
  error,
  onClose,
  onSave,
}: {
  mode: EditorMode;
  image: ImageItem;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (image: ImageItem, file: File | null, frameFocus: FrameFocus, enhanceQuality: boolean) => Promise<void>;
}) {
  const [draft, setDraft] = useState(image);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(image.public_url || '');
  const [frameFocus, setFrameFocus] = useState<FrameFocus>('center');
  const [enhanceQuality, setEnhanceQuality] = useState(true);
  const title = mode === 'create' ? 'Adicionar imagem' : mode === 'replace' ? 'Substituir imagem' : 'Editar imagem';

  function selectFile(file: File | null) {
    setSelectedFile(file);

    if (!file) {
      setPreviewUrl(draft.public_url || '');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const nameWithoutExtension = file.name.replace(/\.[^.]+$/, '');
    setPreviewUrl(objectUrl);
    setDraft((current) => ({
      ...current,
      title: current.title || nameWithoutExtension,
      alt_text: current.alt_text || nameWithoutExtension,
    }));
  }

  return (
    <AdminModal title={title} onClose={onClose}>
      <div className="admin-form two-columns">
        <div className="admin-upload-preview wide">
          {previewUrl ? <img src={previewUrl} alt={draft.alt_text || draft.title || 'Prévia da imagem'} /> : <span>Prévia da imagem</span>}
        </div>
        <label className="wide">
          Fazer upload da imagem
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml" onChange={(event) => selectFile(event.target.files?.[0] || null)} />
        </label>
        <label>
          Enquadramento
          <select value={frameFocus} onChange={(event) => setFrameFocus(event.target.value as FrameFocus)}>
            {frameOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Melhoria automática
          <select value={enhanceQuality ? 'enabled' : 'disabled'} onChange={(event) => setEnhanceQuality(event.target.value === 'enabled')}>
            <option value="enabled">Ativada</option>
            <option value="disabled">Desativada</option>
          </select>
        </label>
        <label>
          Título
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </label>
        <label>
          Local no site
          <select value={getGalleryLocation(draft)?.id || ''} onChange={(event) => setDraft(buildImageForLocation(draft, event.target.value))}>
            <option value="">Escolher local da foto</option>
            {galleryLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.label} - {location.title}
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          {mode === 'replace' ? 'URL da nova imagem' : 'URL pública da imagem'}
          <input value={draft.public_url || ''} onChange={(event) => setDraft({ ...draft, public_url: event.target.value })} />
        </label>
        <label className="wide">
          Texto alternativo
          <input value={draft.alt_text} onChange={(event) => setDraft({ ...draft, alt_text: event.target.value })} />
        </label>
        <label>
          Ordem de exibição
          <input type="number" min="0" value={draft.display_order || 0} onChange={(event) => setDraft({ ...draft, display_order: Number(event.target.value) })} />
        </label>
        <label>
          Visibilidade
          <select value={draft.active ? 'active' : 'inactive'} onChange={(event) => setDraft({ ...draft, active: event.target.value === 'active' })}>
            <option value="active">Visível no site</option>
            <option value="inactive">Oculta</option>
          </select>
        </label>
        <label className="wide">
          Descrição
          <textarea value={draft.description || ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </label>
        <label>
          Destaque
          <select value={draft.featured ? 'featured' : 'normal'} onChange={(event) => setDraft({ ...draft, featured: event.target.value === 'featured' })}>
            <option value="normal">Normal</option>
            <option value="featured">Destaque</option>
          </select>
        </label>
        {error ? <p className="admin-alert wide" role="alert">{error}</p> : null}
        <button className="admin-button primary wide" type="button" disabled={isSaving} onClick={() => onSave(draft, selectedFile, frameFocus, enhanceQuality)}>
          {isSaving ? 'Salvando...' : selectedFile ? 'Enviar e salvar imagem' : mode === 'replace' ? 'Substituir imagem' : 'Salvar imagem'}
        </button>
      </div>
    </AdminModal>
  );
}
