'use client';

import { useMemo, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Edit3,
  ImagePlus,
  MapPin,
  Pause,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  EmptyState,
  ErrorState,
  ListingCard,
  LoadingSkeleton,
  PageHeader,
  Reputation,
  StatusBadge,
  UserChip,
  money,
  shortDate,
} from '@/components/lendup/shared';
import { useDemo } from '@/stores/demo-store';
import { listingService } from '@/services/domain-services';
import {
  economicBreakdown,
  isPeriodAvailable,
  overlaps,
} from '@/lib/business-rules';
import { filesToDataUrls } from '@/lib/file-data';
import type { AvailabilitySlot, ListingMedia } from '@/types/domain';

export function ExplorePage() {
  const { state } = useDemo();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({
    query: params.get('q') ?? '',
    category: '',
    university: '',
    campus: '',
    location: '',
    date: '',
    time: '',
  });
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['listings', state.listings],
    queryFn: () => listingService.getListings(state),
  });
  const filtered = useMemo(
    () =>
      data.filter((item) => {
        const text =
          `${item.title} ${item.category} ${item.description}`.toLowerCase();
        const matchesDate =
          !filters.date ||
          item.availabilitySlots.some(
            (slot) =>
              slot.status === 'AVAILABLE' &&
              new Date(slot.startAt) <=
                new Date(`${filters.date}T${filters.time || '23:59'}`) &&
              new Date(slot.endAt) >=
                new Date(`${filters.date}T${filters.time || '00:00'}`),
          );
        return (
          (!filters.query || text.includes(filters.query.toLowerCase())) &&
          (!filters.category || item.category === filters.category) &&
          (!filters.university || item.university === filters.university) &&
          (!filters.campus || item.campus === filters.campus) &&
          (!filters.location ||
            item.location
              .toLowerCase()
              .includes(filters.location.toLowerCase())) &&
          matchesDate
        );
      }),
    [data, filters],
  );
  const update = (key: keyof typeof filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const clear = () =>
    setFilters({
      query: '',
      category: '',
      university: '',
      campus: '',
      location: '',
      date: '',
      time: '',
    });
  return (
    <>
      <PageHeader
        eyebrow="Comunidad LendUp"
        title="Encuentra lo que necesitas"
        description="Objetos disponibles dentro de comunidades universitarias verificadas."
      />
      <div className="search-bar">
        <Search />
        <input
          aria-label="Buscar objetos"
          value={filters.query}
          onChange={(event) => update('query', event.target.value)}
          placeholder="Buscar calculadoras, cámaras, libros…"
        />
      </div>
      <div className="filter-row">
        <select
          aria-label="Categoría"
          value={filters.category}
          onChange={(event) => update('category', event.target.value)}
        >
          <option value="">Todas las categorías</option>
          {[
            'Calculadoras',
            'Cámaras',
            'Libros',
            'Herramientas',
            'Electrónica',
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Universidad"
          value={filters.university}
          onChange={(event) => update('university', event.target.value)}
        >
          <option value="">Todas las universidades</option>
          {['UPC', 'PUCP', 'UNI', 'UNMSM'].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Campus"
          value={filters.campus}
          onChange={(event) => update('campus', event.target.value)}
        >
          <option value="">Todos los campus</option>
          {Array.from(new Set(data.map((item) => item.campus))).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <input
          aria-label="Ubicación"
          value={filters.location}
          onChange={(event) => update('location', event.target.value)}
          placeholder="Distrito"
        />
        <input
          type="date"
          aria-label="Fecha"
          value={filters.date}
          onChange={(event) => update('date', event.target.value)}
        />
        <input
          type="time"
          aria-label="Hora"
          value={filters.time}
          onChange={(event) => update('time', event.target.value)}
        />
        <Button type="button" variant="outline" onClick={clear}>
          Limpiar filtros
        </Button>
        <output className="result-count">{filtered.length} objetos</output>
      </div>
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length ? (
        <div className="listing-grid">
          {filtered.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              owner={state.users.find((user) => user.id === item.ownerId)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No encontramos coincidencias"
          description="Prueba con otra fecha, campus o palabra clave."
          action="Limpiar filtros"
          onAction={clear}
        />
      )}
    </>
  );
}

export function ObjectDetailPage() {
  const { id } = useParams();
  const { state } = useDemo();
  const [open, setOpen] = useState(false);
  const item = state.listings.find((candidate) => candidate.id === id);
  const owner = state.users.find((user) => user.id === item?.ownerId);
  if (!item)
    return (
      <EmptyState
        title="Objeto no encontrado"
        description="La publicación ya no está disponible."
        action="Volver a explorar"
        href="/explore"
      />
    );
  return (
    <>
      <Link className="back-link" to="/explore">
        <ArrowLeft />
        Volver a explorar
      </Link>
      <div className="object-layout">
        <section className="object-gallery">
          <img src={item.image} alt={item.title} />
          <div>
            {item.media.slice(1, 3).map((media) => (
              <img key={media.id} src={media.url} alt={media.name} />
            ))}
            {item.media.length < 2 && (
              <div className="gallery-placeholder">
                <Camera />
                <span>Vista principal</span>
              </div>
            )}
          </div>
        </section>
        <aside className="object-summary">
          <div className="listing-meta">
            <span>{item.category}</span>
            <StatusBadge status={item.status} />
          </div>
          <h1>{item.title}</h1>
          <div className="object-location">
            <MapPin />
            {item.campus} · {item.location}
          </div>
          <p>{item.description}</p>
          <p>
            <strong>Condición:</strong> {item.condition}
          </p>
          <div className="price-block">
            <strong>{money(item.dailyRate)}</strong>
            <span>por día</span>
            <small>Garantía reembolsable: {money(item.guaranteeAmount)}</small>
          </div>
          <Button
            size="lg"
            onClick={() => setOpen(true)}
            disabled={
              item.ownerId === state.currentUserId || item.status !== 'ACTIVE'
            }
          >
            Solicitar préstamo <ArrowRight />
          </Button>
          {item.ownerId === state.currentUserId && (
            <p className="own-listing-note">
              Este objeto te pertenece. Adminístralo desde Mis objetos.
            </p>
          )}
        </aside>
      </div>
      <div className="detail-grid">
        <section className="panel">
          <span className="eyebrow">Disponibilidad</span>
          <h2>Intervalos disponibles</h2>
          <div className="availability-days">
            {item.availabilitySlots
              .filter((slot) => slot.status === 'AVAILABLE')
              .slice(0, 6)
              .map((slot) => (
                <span key={slot.id}>
                  <Check />
                  {shortDate(slot.startAt)} – {shortDate(slot.endAt)}
                </span>
              ))}
          </div>
          {!item.availabilitySlots.some(
            (slot) => slot.status === 'AVAILABLE',
          ) && <p>No hay intervalos disponibles.</p>}
          <p className="muted">
            Los periodos reservados permanecen bloqueados.
          </p>
        </section>
        <section className="panel">
          <span className="eyebrow">Punto de intercambio</span>
          <h2>{item.exchangePlace}</h2>
          <p className="muted">
            El teléfono de la contraparte se comparte únicamente durante una
            reserva o préstamo vigente.
          </p>
        </section>
        <section className="panel conditions-panel">
          <span className="eyebrow">Condiciones actuales</span>
          <h2>Acuerdos claros antes de solicitar</h2>
          <dl>
            <div>
              <dt>Uso</dt>
              <dd>{item.terms.usage}</dd>
            </div>
            <div>
              <dt>Entrega</dt>
              <dd>{item.terms.delivery}</dd>
            </div>
            <div>
              <dt>Devolución</dt>
              <dd>{item.terms.returnPolicy}</dd>
            </div>
            <div>
              <dt>Cancelación</dt>
              <dd>{item.terms.cancellation}</dd>
            </div>
          </dl>
        </section>
        <section className="panel owner-panel">
          <span className="eyebrow">Prestamista</span>
          <UserChip user={owner} detail />
          <div className="owner-stats">
            <span>
              <Reputation
                value={owner?.rating ?? 0}
                count={owner?.ratingCount}
              />{' '}
              valoración
            </span>
            <span>
              <ShieldCheck />
              Identidad verificada
            </span>
          </div>
          <Button
            variant="outline"
            render={<Link to={`/users/${owner?.id}`} />}
          >
            Ver perfil y comentarios
          </Button>
        </section>
      </div>
      <RequestDialog listingId={item.id} open={open} onOpenChange={setOpen} />
    </>
  );
}

function RequestDialog({
  listingId,
  open,
  onOpenChange,
}: {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, createRequest } = useDemo();
  const navigate = useNavigate();
  const item = state.listings.find((listing) => listing.id === listingId)!;
  const toLocalInput = (date: Date) =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
  const initialStart = new Date(Date.now() + 86_400_000);
  const [startAt, setStartAt] = useState(toLocalInput(initialStart));
  const [endAt, setEndAt] = useState(
    toLocalInput(new Date(initialStart.getTime() + 2 * 86_400_000)),
  );
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const available = Boolean(
    startAt &&
    endAt &&
    new Date(endAt) > new Date(startAt) &&
    isPeriodAvailable(item.availabilitySlots, startAt, endAt),
  );
  const breakdown = economicBreakdown({
    dailyRate: item.dailyRate,
    guaranteeAmount: item.guaranteeAmount,
    startAt,
    endAt,
  });
  const submit = () => {
    if (!state.termsAccepted) {
      onOpenChange(false);
      navigate('/terms');
      return;
    }
    if (!accepted) {
      setError('Debes leer y aceptar las condiciones.');
      return;
    }
    const result = createRequest(
      item.id,
      new Date(startAt).toISOString(),
      new Date(endAt).toISOString(),
    );
    if (!result.ok) {
      setError(result.message ?? 'No se pudo crear la solicitud.');
      return;
    }
    onOpenChange(false);
    navigate('/requests');
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="request-dialog">
        <DialogHeader>
          <DialogTitle>Revisa antes de solicitar</DialogTitle>
          <DialogDescription>Solicitud para {item.title}</DialogDescription>
        </DialogHeader>
        <div className="date-fields">
          <label>
            Desde
            <input
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
            />
          </label>
        </div>
        <div className={available ? 'success-box' : 'warning-box'}>
          <CheckCircle2 />
          <p>
            {available
              ? 'El periodo está disponible.'
              : 'Elige un periodo válido y disponible.'}
          </p>
        </div>
        <div className="terms-review">
          <p>
            <strong>Uso:</strong> {item.terms.usage}
          </p>
          <p>
            <strong>Entrega:</strong> {item.terms.delivery}
          </p>
          <p>
            <strong>Devolución:</strong> {item.terms.returnPolicy}
          </p>
          <p>
            <strong>Cancelación:</strong> {item.terms.cancellation}
          </p>
          <p>
            <strong>Lugar:</strong> {item.exchangePlace}
          </p>
        </div>
        <div className="economic-summary">
          <div>
            <span>Tarifa · {breakdown.days} días</span>
            <strong>{money(breakdown.fee)}</strong>
          </div>
          <div>
            <span>Comisión</span>
            <strong>{money(breakdown.serviceFee)}</strong>
          </div>
          <div>
            <span>Garantía</span>
            <strong>{money(breakdown.guarantee)}</strong>
          </div>
          <div className="total">
            <span>Total</span>
            <strong>{money(breakdown.total)}</strong>
          </div>
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          He leído y acepto las condiciones.
        </label>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={!available} onClick={submit}>
            Enviar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MyItemsPage() {
  const { state, toggleListing, archiveListing } = useDemo();
  const items = state.listings.filter(
    (item) => item.ownerId === state.currentUserId,
  );
  return (
    <>
      <PageHeader
        eyebrow="Como prestamista"
        title="Mis objetos"
        description="Publicaciones, disponibilidad y próximas reservas."
        action={
          <Button render={<Link to="/my-items/new" />}>
            <Plus />
            Publicar objeto
          </Button>
        }
      />
      {items.length ? (
        <div className="my-items-list">
          {items.map((item) => (
            <article className="my-item-card" key={item.id}>
              <img src={item.image} alt={item.title} />
              <div className="my-item-main">
                <div>
                  <StatusBadge status={item.status} />
                  <h2>{item.title}</h2>
                  <p>
                    {item.category} · {item.campus}
                  </p>
                </div>
                <div className="my-item-numbers">
                  <span>
                    <small>Tarifa</small>
                    <strong>{money(item.dailyRate)}/día</strong>
                  </span>
                  <span>
                    <small>Garantía</small>
                    <strong>{money(item.guaranteeAmount)}</strong>
                  </span>
                  <span>
                    <small>Solicitudes</small>
                    <strong>
                      {
                        state.requests.filter(
                          (request) =>
                            request.listingId === item.id &&
                            request.status === 'PENDING',
                        ).length
                      }
                    </strong>
                  </span>
                </div>
              </div>
              <div className="item-actions">
                <Button
                  variant="outline"
                  render={<Link to={`/my-items/${item.id}/edit`} />}
                >
                  <Edit3 />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  render={<Link to={`/my-items/${item.id}/availability`} />}
                >
                  <CalendarDays />
                  Disponibilidad
                </Button>
                {item.status !== 'ARCHIVED' && (
                  <Button
                    variant="ghost"
                    onClick={() => toggleListing(item.id)}
                  >
                    <Pause />
                    {item.status === 'ACTIVE' ? 'Pausar' : 'Reactivar'}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => archiveListing(item.id)}
                  disabled={item.status === 'ARCHIVED'}
                >
                  <Trash2 />
                  Archivar
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No tienes objetos publicados"
          description="Publica tu primer objeto para empezar a recibir solicitudes."
          action="Publicar mi primer objeto"
          href="/my-items/new"
        />
      )}
    </>
  );
}

const listingSchema = z.object({
  title: z.string().min(4, 'Ingresa un título'),
  category: z.string().min(1),
  description: z.string().min(20, 'Describe el objeto con más detalle'),
  condition: z.string().min(1),
  university: z.string().min(2),
  campus: z.string().min(2),
  location: z.string().min(2),
  exchangePlace: z.string().min(5),
  usage: z.string().min(5),
  delivery: z.string().min(5),
  returnPolicy: z.string().min(5),
  cancellation: z.string().min(5),
  dailyRate: z.number().min(0),
  guaranteeAmount: z.number().min(0),
});
type ListingValues = z.infer<typeof listingSchema>;
export function ListingFormPage({ edit = false }: { edit?: boolean }) {
  const { id } = useParams();
  const { state, addListing, updateListing } = useDemo();
  const navigate = useNavigate();
  const existing = state.listings.find((item) => item.id === id);
  const [media, setMedia] = useState<ListingMedia[]>(existing?.media ?? []);
  const [fileError, setFileError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ListingValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: existing
      ? { ...existing, ...existing.terms }
      : {
          category: 'Calculadoras',
          condition: 'Muy buena',
          university:
            state.users.find((u) => u.id === state.currentUserId)?.university ??
            'UPC',
          campus:
            state.users.find((u) => u.id === state.currentUserId)?.campus ?? '',
          usage: 'Uso académico responsable.',
          delivery: 'Entrega presencial con revisión conjunta.',
          returnPolicy: 'Devolver en el mismo estado.',
          cancellation:
            'Cancelación permitida antes de confirmar la recepción.',
          dailyRate: 10,
          guaranteeAmount: 80,
        },
  });
  if (edit && !existing)
    return (
      <EmptyState
        title="Objeto no encontrado"
        description="No puedes editar esta publicación."
        href="/my-items"
        action="Volver"
      />
    );
  const addMedia = async (files: FileList | null) => {
    if (!files) return;
    try {
      const encoded = await filesToDataUrls(files);
      setMedia((current) => [
        ...current,
        ...encoded.map(({ file, dataUrl }) => ({
          id: `media-${Date.now()}-${file.name}`,
          type: file.type.startsWith('video/')
            ? ('VIDEO' as const)
            : ('PHOTO' as const),
          url: dataUrl,
          name: file.name,
        })),
      ]);
      setFileError('');
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : 'No se pudo leer la imagen.',
      );
    }
  };
  const submit = (values: ListingValues) => {
    const image =
      media.find((item) => item.type === 'PHOTO')?.url ??
      existing?.image ??
      '/images/calculator.webp';
    const payload = {
      title: values.title,
      category: values.category,
      description: values.description,
      condition: values.condition,
      university: values.university,
      campus: values.campus,
      location: values.location,
      exchangePlace: values.exchangePlace,
      dailyRate: values.dailyRate,
      guaranteeAmount: values.guaranteeAmount,
      image,
      media: media.length
        ? media
        : [
            {
              id: `media-${Date.now()}`,
              type: 'PHOTO' as const,
              url: image,
              name: values.title,
            },
          ],
      availability: existing?.availability ?? [],
      availabilitySlots: existing?.availabilitySlots ?? [],
      terms: {
        usage: values.usage,
        delivery: values.delivery,
        returnPolicy: values.returnPolicy,
        cancellation: values.cancellation,
      },
    };
    if (existing) {
      updateListing(existing.id, payload);
      navigate('/my-items');
    } else {
      const newId = addListing(payload);
      navigate(`/my-items/${newId}/availability`);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow={edit ? 'Administrar publicación' : 'Nueva publicación'}
        title={edit ? `Editar ${existing?.title}` : 'Publicar un objeto'}
        description="Completa la información, fotos, condiciones y economía."
      />
      {edit && (
        <div className="info-banner">
          <ShieldCheck />
          <p>
            <strong>Las reservas confirmadas no cambiarán.</strong> Las
            condiciones congeladas permanecen inmutables.
          </p>
        </div>
      )}
      <form className="panel listing-form" onSubmit={handleSubmit(submit)}>
        <section>
          <h2>Información y ubicación</h2>
          <div className="field-grid">
            <Field label="Título" error={errors.title?.message}>
              <input {...register('title')} />
            </Field>
            <Field label="Categoría" error={errors.category?.message}>
              <select {...register('category')}>
                <option>Calculadoras</option>
                <option>Cámaras</option>
                <option>Libros</option>
                <option>Herramientas</option>
                <option>Electrónica</option>
              </select>
            </Field>
            <Field label="Descripción" error={errors.description?.message} wide>
              <textarea rows={4} {...register('description')} />
            </Field>
            <Field label="Condición">
              <select {...register('condition')}>
                <option>Excelente</option>
                <option>Muy buena</option>
                <option>Buena</option>
              </select>
            </Field>
            <Field label="Universidad">
              <select {...register('university')}>
                <option>UPC</option>
                <option>PUCP</option>
                <option>UNI</option>
                <option>UNMSM</option>
              </select>
            </Field>
            <Field label="Campus">
              <input {...register('campus')} />
            </Field>
            <Field label="Distrito">
              <input {...register('location')} />
            </Field>
            <Field label="Lugar de intercambio">
              <input {...register('exchangePlace')} />
            </Field>
          </div>
        </section>
        <section>
          <h2>Fotografías</h2>
          <label className="upload-zone" htmlFor="listing-media">
            <ImagePlus />
            <strong>Agrega fotos claras</strong>
            <span>
              Incluye vistas generales, accesorios y cualquier detalle
              relevante.
            </span>
            <span className="button-like">
              <Upload />
              Seleccionar archivos
            </span>
          </label>
          <input
            id="listing-media"
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => addMedia(event.target.files)}
          />
          {fileError && (
            <p className="field-error" role="alert">
              {fileError}
            </p>
          )}
          <div className="media-previews">
            {media.map((item) => (
              <article key={item.id}>
                <img src={item.url} alt={item.name} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Eliminar ${item.name}`}
                  onClick={() =>
                    setMedia((current) =>
                      current.filter((candidate) => candidate.id !== item.id),
                    )
                  }
                >
                  <X />
                </Button>
              </article>
            ))}
          </div>
        </section>
        <section>
          <h2>Condiciones</h2>
          <div className="field-grid single">
            <Field label="Condiciones de uso">
              <textarea {...register('usage')} />
            </Field>
            <Field label="Condiciones de entrega">
              <textarea {...register('delivery')} />
            </Field>
            <Field label="Condiciones de devolución">
              <textarea {...register('returnPolicy')} />
            </Field>
            <Field label="Condiciones de cancelación">
              <textarea {...register('cancellation')} />
            </Field>
          </div>
        </section>
        <section>
          <h2>Economía</h2>
          <div className="field-grid">
            <Field label="Tarifa diaria (S/)" error={errors.dailyRate?.message}>
              <input
                type="number"
                step="0.01"
                {...register('dailyRate', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Garantía monetaria (S/)"
              error={errors.guaranteeAmount?.message}
            >
              <input
                type="number"
                step="0.01"
                {...register('guaranteeAmount', { valueAsNumber: true })}
              />
            </Field>
          </div>
        </section>
        <div className="form-footer">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/my-items')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || !media.length}>
            {edit ? 'Guardar cambios' : 'Guardar y definir disponibilidad'}
          </Button>
        </div>
      </form>
    </>
  );
}

export function AvailabilityPage() {
  const { id } = useParams();
  const { state, saveAvailability } = useDemo();
  const item = state.listings.find((candidate) => candidate.id === id);
  const [slots, setSlots] = useState<AvailabilitySlot[]>(
    item?.availabilitySlots.filter((slot) => slot.status === 'AVAILABLE') ?? [],
  );
  const future = new Date(Date.now() + 86_400_000);
  const localValue = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };
  const [startAt, setStartAt] = useState(localValue(future));
  const [endAt, setEndAt] = useState(
    localValue(new Date(future.getTime() + 3_600_000)),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  if (!item)
    return (
      <EmptyState
        title="Objeto no encontrado"
        description="No existe esta publicación."
      />
    );
  const reserved = item.availabilitySlots.filter(
    (slot) => slot.status === 'RESERVED',
  );
  const add = () => {
    if (new Date(endAt) <= new Date(startAt)) {
      setMessage('La hora final debe ser posterior a la inicial.');
      return;
    }
    if (
      reserved.some((slot) =>
        overlaps(startAt, endAt, slot.startAt, slot.endAt),
      )
    ) {
      setMessage('El intervalo se superpone con un periodo reservado.');
      return;
    }
    const nextSlot = {
      id: editingId ?? `slot-${Date.now()}`,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      status: 'AVAILABLE' as const,
    };
    setSlots((current) =>
      editingId
        ? current.map((slot) => (slot.id === editingId ? nextSlot : slot))
        : [...current, nextSlot],
    );
    setEditingId(null);
    setMessage('');
  };
  return (
    <>
      <PageHeader
        eyebrow="Disponibilidad"
        title={item.title}
        description="Agrega intervalos. Los periodos reservados permanecen bloqueados."
        action={
          <Button
            type="button"
            onClick={() => {
              const result = saveAvailability(item.id, slots);
              setMessage(result.message);
            }}
          >
            Guardar disponibilidad
          </Button>
        }
      />
      <section className="panel">
        <div className="date-fields">
          <label>
            Inicio
            <input
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
          </label>
          <label>
            Fin
            <input
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
            />
          </label>
          <Button type="button" variant="outline" onClick={add}>
            <Plus />
            {editingId ? 'Actualizar intervalo' : 'Agregar intervalo'}
          </Button>
        </div>
        {message && (
          <output
            className={
              message.includes('guardada') ? 'success-text' : 'field-error'
            }
          >
            {message}
          </output>
        )}
        <div className="slot-list">
          <h2>Intervalos editables</h2>
          {slots.length ? (
            slots.map((slot) => (
              <article key={slot.id}>
                <span>
                  <Check />
                  {shortDate(slot.startAt)} – {shortDate(slot.endAt)}
                </span>
                <span className="slot-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Editar intervalo"
                    onClick={() => {
                      setEditingId(slot.id);
                      setStartAt(localValue(new Date(slot.startAt)));
                      setEndAt(localValue(new Date(slot.endAt)));
                    }}
                  >
                    <Edit3 />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar intervalo"
                    onClick={() =>
                      setSlots((current) =>
                        current.filter((candidate) => candidate.id !== slot.id),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </span>
              </article>
            ))
          ) : (
            <p>No agregaste intervalos disponibles.</p>
          )}
          <h2>Periodos reservados</h2>
          {reserved.length ? (
            reserved.map((slot) => (
              <article key={slot.id} className="reserved">
                <span>
                  <ShieldCheck />
                  {shortDate(slot.startAt)} – {shortDate(slot.endAt)}
                </span>
                <StatusBadge status="CONFIRMED" />
              </article>
            ))
          ) : (
            <p>No hay reservas que bloqueen el calendario.</p>
          )}
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  error,
  children,
  wide = false,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`field ${wide ? 'wide' : ''}`}>
      <span>{label}</span>
      {children}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
