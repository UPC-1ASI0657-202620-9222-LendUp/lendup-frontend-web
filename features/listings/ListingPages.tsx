'use client';
import { useUniversities } from '@/hooks/use-universities';
import {
  ListingPhotos,
  useListingPhotos,
} from '@/components/lendup/ListingPhotos';

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
  Check,
  CheckCircle2,
  Edit3,
  LocateFixed,
  Pause,
  Play,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
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
  DefinitionList,
  EconomicSummary,
  EmptyState,
  ErrorState,
  Feedback,
  ListingCard,
  LoadingSkeleton,
  MapPreview,
  NotFound,
  PageHeader,
  Reputation,
  StatusBadge,
  UserChip,
} from '@/components/lendup/shared';
import { ConfirmDialog, Field } from '@/components/lendup/forms';
import { fromZonedInput, toZonedInput } from '@/lib/dates';
import { useOperationGate } from '@/hooks/use-operation-gate';
import { useI18n } from '@/lib/i18n';
import { googleMapsAdapter } from '@/services/adapters/google-maps';
import {
  campusCoordinates,
  catalogService,
  emptyListingFilters,
  findUniversity,
  matchesFilters,
  sortByDistance,
  toCatalogQuery,
  type ListingFilters,
} from '@/services/catalog.service';
import { quoteListing } from '@/services/payments.service';
import { isPeriodAvailable } from '@/lib/business-rules';
import { useLendUp, type ActionResult } from '@/hooks/use-lendup';
import {
  currentUserOf,
  pendingRequestsFor,
  reputationOf,
  userById,
} from '@/stores/selectors';
import type {
  CategoryCode,
  ConditionCode,
  Coordinates,
  ListingStatus,
} from '@/types/domain';

export function ExplorePage() {
  const { data: universities = [] } = useUniversities();
  const { t } = useI18n();
  const { state } = useLendUp();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState<ListingFilters>({
    ...emptyListingFilters,
    query: params.get('q') ?? '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState('');
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['listings', 'explore', toCatalogQuery(filters)],
    queryFn: ({ signal }) => catalogService.searchListings(filters, signal),
    staleTime: 15_000,
  });
  const university = universities.find(
    (item) => item.id === filters.universityId,
  );
  const campuses = Array.from(
    new Set([
      ...(university?.campuses.map((campus) => campus.name) ?? []),
      ...state.listings
        .filter(
          (item) =>
            !filters.universityId || item.universityId === filters.universityId,
        )
        .map((item) => item.campus),
    ]),
  ).filter(Boolean);
  const invalidPeriod = Boolean(
    filters.from &&
    filters.to &&
    new Date(filters.to) <= new Date(filters.from),
  );
  const incompletePeriod = Boolean(filters.from) !== Boolean(filters.to);
  const results = useMemo(() => {
    const filtered = data.filter((listing) =>
      matchesFilters(listing, filters, (code) => t(`categories.${code}`)),
    );
    return origin
      ? sortByDistance(filtered, origin)
      : filtered.map((listing) => ({ listing, distance: undefined }));
  }, [data, filters, origin, t]);
  const activeFilters = Object.entries(filters).filter(
    ([key, value]) => key !== 'query' && value,
  ).length;
  const update = <K extends keyof ListingFilters>(
    key: K,
    value: ListingFilters[K],
  ) =>
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'universityId' ? { campus: '' } : {}),
    }));
  const clear = () => {
    setFilters(emptyListingFilters);
    setOrigin(null);
  };
  const locate = async () => {
    try {
      setOrigin(await googleMapsAdapter.currentPosition());
      setLocationError('');
    } catch {
      setLocationError(t('explore.locationDenied'));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={t('explore.eyebrow')}
        title={t('explore.title')}
        description={t('explore.description')}
      />
      <search>
        <form
          className="search-bar"
          onSubmit={(event) => event.preventDefault()}
        >
          <Search aria-hidden="true" />
          <input
            type="search"
            aria-label={t('explore.searchLabel')}
            value={filters.query}
            onChange={(event) => update('query', event.target.value)}
            placeholder={t('explore.searchPlaceholder')}
          />
          <Button
            type="button"
            variant="outline"
            className="filters-toggle"
            aria-expanded={showFilters}
            aria-controls="explore-filters"
            onClick={() => setShowFilters((value) => !value)}
          >
            <SlidersHorizontal aria-hidden="true" />
            {t('explore.filters')}
            {activeFilters > 0 && (
              <span className="pill-count">{activeFilters}</span>
            )}
          </Button>
        </form>
      </search>
      <fieldset
        id="explore-filters"
        className={`filter-panel ${showFilters ? 'open' : ''}`}
      >
        <legend className="sr-only">{t('explore.filters')}</legend>
        <Field label={t('fields.category')}>
          <select
            value={filters.category}
            onChange={(event) =>
              update('category', event.target.value as CategoryCode | '')
            }
          >
            <option value="">{t('explore.allCategories')}</option>
            {catalogService.categories.map((code) => (
              <option key={code} value={code}>
                {t(`categories.${code}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('fields.university')}>
          <select
            value={filters.universityId}
            onChange={(event) => update('universityId', event.target.value)}
          >
            <option value="">{t('explore.allUniversities')}</option>
            {universities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.shortName}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('fields.campus')}>
          <select
            value={filters.campus}
            onChange={(event) => update('campus', event.target.value)}
          >
            <option value="">{t('explore.allCampuses')}</option>
            {campuses.map((campus) => (
              <option key={campus} value={campus}>
                {campus}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('fields.district')}>
          <input
            value={filters.location}
            onChange={(event) => update('location', event.target.value)}
            placeholder={t('explore.districtPlaceholder')}
          />
        </Field>
        <Field label={t('fields.from')}>
          <input
            type="datetime-local"
            value={filters.from}
            onChange={(event) => update('from', event.target.value)}
          />
        </Field>
        <Field
          label={t('fields.to')}
          error={
            incompletePeriod
              ? t('validation.periodBothRequired')
              : invalidPeriod
                ? t('validation.endAfterStart')
                : undefined
          }
        >
          <input
            type="datetime-local"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => update('to', event.target.value)}
          />
        </Field>
        <div className="filter-actions">
          <Button
            type="button"
            variant="outline"
            onClick={locate}
            aria-pressed={Boolean(origin)}
          >
            <LocateFixed aria-hidden="true" />
            {origin ? t('explore.sortedByDistance') : t('explore.nearMe')}
          </Button>
          <Button type="button" variant="ghost" onClick={clear}>
            {t('explore.clear')}
          </Button>
        </div>
        {locationError && <p className="field-error">{locationError}</p>}
        {origin && (
          <p className="muted small">{t('explore.locationPrivacy')}</p>
        )}
      </fieldset>
      <output className="result-count">
        {t('explore.results', { count: results.length })}
      </output>
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : results.length ? (
        <div className="listing-grid">
          {results.map(({ listing, distance }) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              owner={userById(state, listing.ownerId)}
              ownerReputation={reputationOf(state, listing.ownerId)}
              own={listing.ownerId === state.currentUserId}
              distanceKm={distance}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title={t('explore.emptyTitle')}
          description={t('explore.emptyDescription')}
          action={t('explore.clear')}
          onAction={clear}
        />
      )}
    </>
  );
}

export function ObjectDetailPage() {
  const { data: universities = [] } = useUniversities();
  const { t, formatMoney, formatDateTime } = useI18n();
  const { id } = useParams();
  const { state } = useLendUp();
  const [open, setOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const { guard, dialog } = useOperationGate();
  const item = state.listings.find((candidate) => candidate.id === id);
  if (!item)
    return (
      <NotFound
        title={t('listing.notFound.title')}
        description={t('listing.notFound.description')}
      />
    );
  const owner = userById(state, item.ownerId);
  const reputation = reputationOf(state, item.ownerId);
  const own = item.ownerId === state.currentUserId;
  const photos = item.media.filter((media) => media.type === 'PHOTO');
  const gallery = photos.length
    ? photos
    : [
        {
          id: 'cover',
          type: 'PHOTO' as const,
          url: item.image,
          name: item.title,
        },
      ];
  const upcoming = item.availabilitySlots
    .filter(
      (slot) =>
        slot.status === 'AVAILABLE' && new Date(slot.endAt) > new Date(),
    )
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const reserved = item.availabilitySlots.filter(
    (slot) => slot.status === 'RESERVED' && new Date(slot.endAt) > new Date(),
  );
  const university = universities.find(
    (candidate) => candidate.id === item.universityId,
  );

  return (
    <>
      <Link className="back-link" to="/explore">
        <ArrowLeft aria-hidden="true" />
        {t('listing.backToExplore')}
      </Link>
      <div className="object-layout">
        <section className="object-gallery" aria-label={t('listing.gallery')}>
          <img
            src={gallery[activeImage]?.url}
            alt={gallery[activeImage]?.name ?? item.title}
          />
          {gallery.length > 1 && (
            <div className="gallery-thumbs">
              {gallery.map((media, index) => (
                <button
                  type="button"
                  key={media.id}
                  aria-label={t('listing.showImage', { index: index + 1 })}
                  aria-pressed={index === activeImage}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={media.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </section>
        <aside className="object-summary panel">
          <div className="listing-meta">
            <span>{t(`categories.${item.category}`)}</span>
            <StatusBadge kind="listing" status={item.status} />
          </div>
          <h1>{item.title}</h1>
          <p className="muted">
            {university?.shortName} · {item.campus} · {item.location}
          </p>
          <p>{item.description}</p>
          <DefinitionList
            items={[[t('fields.condition'), t(`conditions.${item.condition}`)]]}
          />
          <div className="price-block">
            <strong>{formatMoney(item.dailyRate)}</strong>
            <span>{t('listing.perDay')}</span>
            <small>
              {item.guaranteeAmount > 0
                ? t('listing.guaranteeRequired', {
                    amount: formatMoney(item.guaranteeAmount),
                  })
                : t('listing.noGuarantee')}
            </small>
          </div>
          {own ? (
            <div className="own-listing-note">
              <p>{t('listing.ownNotice')}</p>
              <Button
                variant="outline"
                render={<Link to={`/my-items/${item.id}/edit`} />}
              >
                <Edit3 aria-hidden="true" />
                {t('myItems.edit')}
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={() => guard(() => setOpen(true))}
              disabled={item.status !== 'ACTIVE'}
            >
              {t('listing.request')}
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
          {item.status !== 'ACTIVE' && !own && (
            <p className="muted small">{t('listing.notRequestable')}</p>
          )}
        </aside>
      </div>
      <div className="detail-grid">
        <section className="panel">
          <p className="eyebrow">{t('listing.availability')}</p>
          <h2>{t('listing.availableWindows')}</h2>
          {upcoming.length ? (
            <ul className="slot-chips">
              {upcoming.slice(0, 6).map((slot) => (
                <li key={slot.id}>
                  <Check aria-hidden="true" />
                  {formatDateTime(slot.startAt)} – {formatDateTime(slot.endAt)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('listing.noAvailability')}</p>
          )}
          {reserved.length > 0 && (
            <>
              <h3 className="subheading">{t('listing.blockedWindows')}</h3>
              <ul className="slot-chips blocked">
                {reserved.map((slot) => (
                  <li key={slot.id}>
                    <X aria-hidden="true" />
                    {formatDateTime(slot.startAt)} –{' '}
                    {formatDateTime(slot.endAt)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="panel">
          <p className="eyebrow">{t('listing.exchangePoint')}</p>
          <MapPreview
            place={item.exchangePlace}
            coordinates={campusCoordinates(item.universityId, item.campus)}
          />
          <p className="muted small">{t('listing.phonePrivacy')}</p>
        </section>
        <section className="panel conditions-panel">
          <p className="eyebrow">{t('listing.conditions')}</p>
          <h2>{t('listing.conditionsTitle')}</h2>
          <DefinitionList
            items={[
              [t('fields.usage'), item.terms.usage],
              [t('fields.delivery'), item.terms.delivery],
              [t('fields.returnPolicy'), item.terms.returnPolicy],
              [t('fields.cancellation'), item.terms.cancellation],
            ]}
          />
        </section>
        <section className="panel owner-panel">
          <p className="eyebrow">{t('roles.LENDER')}</p>
          <UserChip
            user={owner}
            detail={
              owner
                ? `${universities.find((candidate) => candidate.id === owner.universityId)?.shortName ?? owner.universityId} · ${owner.campus}`
                : undefined
            }
          />
          <div className="owner-stats">
            <Reputation value={reputation.average} count={reputation.count} />
          </div>
          <Button
            variant="outline"
            render={<Link to={`/users/${item.ownerId}`} />}
          >
            {t('listing.viewProfile')}
          </Button>
        </section>
      </div>
      {!own && (
        <RequestDialog listingId={item.id} open={open} onOpenChange={setOpen} />
      )}
      {dialog}
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
  const { t } = useI18n();
  const { state, createRequest } = useLendUp();
  const navigate = useNavigate();
  const item = state.listings.find((listing) => listing.id === listingId);
  const firstWindow = item?.availabilitySlots.find(
    (slot) =>
      slot.status === 'AVAILABLE' &&
      new Date(slot.endAt) > new Date(Date.now() + 86_400_000),
  );
  const defaultStart = new Date(
    Math.max(
      Date.now() + 86_400_000,
      firstWindow ? new Date(firstWindow.startAt).getTime() : 0,
    ),
  );
  defaultStart.setMinutes(0, 0, 0);
  const [startAt, setStartAt] = useState(toZonedInput(defaultStart));
  const [endAt, setEndAt] = useState(
    toZonedInput(new Date(defaultStart.getTime() + 2 * 86_400_000)),
  );
  const [message, setMessage] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  if (!item) return null;
  const startIso = fromZonedInput(startAt);
  const endIso = fromZonedInput(endAt);
  const validRange = Boolean(
    startIso && endIso && new Date(endIso) > new Date(startIso),
  );
  const future = Boolean(startIso && new Date(startIso) > new Date());
  const periodAvailable = Boolean(
    validRange &&
    future &&
    isPeriodAvailable(item.availabilitySlots, startIso, endIso),
  );
  const canSubmit = periodAvailable;
  const breakdown = validRange ? quoteListing(item, startIso, endIso) : null;
  const availabilityMessage = !validRange
    ? t('validation.endAfterStart')
    : !future
      ? t('results.request.pastStart')
      : periodAvailable
        ? t('request.periodAvailable')
        : t('request.periodUnavailable');

  const submit = async () => {
    const outcome = await createRequest(item.id, startIso, endIso, message);
    setResult(outcome);
    if (outcome.ok) {
      onOpenChange(false);
      navigate('/requests', { state: { created: true } });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-dialog wide" closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{t('request.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('request.dialogDescription', { title: item.title })}
          </DialogDescription>
        </DialogHeader>
        <div className="dialog-body">
          <div className="date-fields">
            <Field label={t('fields.from')}>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
              />
            </Field>
            <Field label={t('fields.to')}>
              <input
                type="datetime-local"
                value={endAt}
                min={startAt}
                onChange={(event) => setEndAt(event.target.value)}
              />
            </Field>
          </div>
          <output
            className={`inline-status ${periodAvailable ? 'success' : 'warning'}`}
          >
            {periodAvailable ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <TriangleAlert aria-hidden="true" />
            )}
            {availabilityMessage}
          </output>
          <div className="terms-review">
            <h3>{t('request.reviewTitle')}</h3>
            <DefinitionList
              items={[
                [t('fields.usage'), item.terms.usage],
                [t('fields.delivery'), item.terms.delivery],
                [t('fields.returnPolicy'), item.terms.returnPolicy],
                [t('fields.cancellation'), item.terms.cancellation],
                [t('fields.exchangePlace'), item.exchangePlace],
              ]}
            />
          </div>
          {breakdown && <EconomicSummary breakdown={breakdown} />}
          <p className="muted small">{t('request.paymentLater')}</p>
          <Field
            label={t('request.messageLabel')}
            hint={t('request.messageHint')}
          >
            <textarea
              rows={2}
              maxLength={280}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </Field>
          <label className="check-row">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            {t('request.acceptConditions')}
          </label>
          <Feedback result={result && !result.ok ? result : null} />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || !accepted}
            onClick={submit}
          >
            {t('request.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MyItemsPage() {
  const { t, formatMoney } = useI18n();
  const { state, setListingStatus } = useLendUp();
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const items = state.listings.filter(
    (item) => item.ownerId === state.currentUserId,
  );
  const archiveTarget = items.find((item) => item.id === archiveId);
  const change = async (id: string, status: ListingStatus) =>
    setResult(await setListingStatus(id, status));

  return (
    <>
      <PageHeader
        eyebrow={t('myItems.eyebrow')}
        title={t('myItems.title')}
        description={t('myItems.description')}
        action={
          <Button render={<Link to="/my-items/new" />}>
            <Plus aria-hidden="true" />
            {t('myItems.publish')}
          </Button>
        }
      />
      <p className="muted small">{t('myItems.activeOnly')}</p>
      <Feedback result={result} />
      {items.length ? (
        <ul className="my-items-list">
          {items.map((item) => {
            const pending = pendingRequestsFor(state, item);
            const upcoming = state.reservations.filter(
              (reservation) =>
                reservation.listingId === item.id &&
                reservation.status === 'CONFIRMED',
            ).length;
            return (
              <li className="my-item-card panel" key={item.id}>
                <img src={item.image} alt="" />
                <div className="my-item-main">
                  <StatusBadge kind="listing" status={item.status} />
                  <h2>
                    <Link to={`/objects/${item.id}`}>{item.title}</Link>
                  </h2>
                  <p className="muted">
                    {t(`categories.${item.category}`)} · {item.campus}
                  </p>
                  <dl className="my-item-numbers">
                    <div>
                      <dt>{t('fields.dailyRate')}</dt>
                      <dd>{formatMoney(item.dailyRate)}</dd>
                    </div>
                    <div>
                      <dt>{t('fields.guarantee')}</dt>
                      <dd>
                        {item.guaranteeAmount > 0
                          ? formatMoney(item.guaranteeAmount)
                          : t('listing.noGuaranteeShort')}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('myItems.pendingRequests')}</dt>
                      <dd>{pending}</dd>
                    </div>
                    <div>
                      <dt>{t('myItems.upcomingReservations')}</dt>
                      <dd>{upcoming}</dd>
                    </div>
                  </dl>
                </div>
                <div className="item-actions">
                  {item.status !== 'ARCHIVED' && (
                    <>
                      <Button
                        variant="outline"
                        render={<Link to={`/my-items/${item.id}/edit`} />}
                      >
                        <Edit3 aria-hidden="true" />
                        {t('myItems.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        render={
                          <Link to={`/my-items/${item.id}/availability`} />
                        }
                      >
                        <CalendarDays aria-hidden="true" />
                        {t('myItems.availability')}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          change(
                            item.id,
                            item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
                          )
                        }
                      >
                        {item.status === 'ACTIVE' ? (
                          <Pause aria-hidden="true" />
                        ) : (
                          <Play aria-hidden="true" />
                        )}
                        {item.status === 'ACTIVE'
                          ? t('myItems.pause')
                          : t('myItems.reactivate')}
                      </Button>
                      <Button
                        variant="ghost"
                        className="danger-text"
                        onClick={() => setArchiveId(item.id)}
                      >
                        <Trash2 aria-hidden="true" />
                        {t('myItems.archive')}
                      </Button>
                    </>
                  )}
                  {pending > 0 && (
                    <Button render={<Link to="/requests?tab=received" />}>
                      {t('myItems.reviewRequests')}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title={t('myItems.noActiveTitle')}
          description={t('myItems.activeOnly')}
          action={t('myItems.publishFirst')}
          href="/my-items/new"
        />
      )}
      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title={t('myItems.archiveTitle')}
        description={t('myItems.archiveDescription', {
          title: archiveTarget?.title ?? '',
        })}
        confirmLabel={t('myItems.archiveConfirm')}
        destructive
        onConfirm={() => {
          if (archiveTarget) change(archiveTarget.id, 'ARCHIVED');
          setArchiveId(null);
        }}
      />
    </>
  );
}

export function ListingFormPage({ edit = false }: { edit?: boolean }) {
  const { data: universities = [] } = useUniversities();
  const { t } = useI18n();
  const { id } = useParams();
  const { state, createListing, updateListing } = useLendUp();
  const navigate = useNavigate();
  const { guard, dialog } = useOperationGate();
  const user = currentUserOf(state);
  const existing = state.listings.find((item) => item.id === id);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [savedId, setSavedId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const photos = useListingPhotos(existing);
  const schema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .trim()
          .min(5, t('validation.min', { count: 5 }))
          .max(80, t('validation.max', { count: 80 })),
        category: z.string().min(1, t('validation.select')),
        description: z
          .string()
          .trim()
          .min(20, t('validation.min', { count: 20 })),
        condition: z.string().min(1, t('validation.select')),
        universityId: z.string().min(1, t('validation.select')),
        campus: z.string().min(1, t('validation.select')),
        location: z.string().trim().min(2, t('validation.required')),
        exchangePlace: z
          .string()
          .trim()
          .min(5, t('validation.min', { count: 5 })),
        usage: z
          .string()
          .trim()
          .min(10, t('validation.min', { count: 10 })),
        delivery: z
          .string()
          .trim()
          .min(10, t('validation.min', { count: 10 })),
        returnPolicy: z
          .string()
          .trim()
          .min(10, t('validation.min', { count: 10 })),
        cancellation: z
          .string()
          .trim()
          .min(10, t('validation.min', { count: 10 })),
        dailyRate: z
          .number({ error: t('validation.number') })
          .gt(0, t('validation.dailyRate')),
        guaranteeAmount: z
          .number({ error: t('validation.number') })
          .min(0, t('validation.nonNegative')),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? { ...existing, ...existing.terms }
      : {
          category: '',
          condition: '',
          universityId: user?.universityId ?? '',
          campus: user?.campus ?? '',
          location:
            findUniversity(user?.universityId ?? '')?.campuses.find(
              (c) => c.name === user?.campus,
            )?.district ?? '',
          usage: '',
          delivery: '',
          returnPolicy: '',
          cancellation: '',
          guaranteeAmount: 0,
        },
  });
  if (edit && !existing)
    return (
      <NotFound
        title={t('listing.notFound.title')}
        description={t('listing.notFound.description')}
      />
    );

  const submit = async (values: Values) => {
    const payload = {
      title: values.title,
      category: values.category as CategoryCode,
      description: values.description,
      condition: values.condition as ConditionCode,
      universityId: values.universityId,
      campus: values.campus,
      location: values.location,
      exchangePlace: values.exchangePlace,
      dailyRate: values.dailyRate,
      guaranteeAmount: values.guaranteeAmount,
      image: '',
      media: [],
      availabilitySlots: existing?.availabilitySlots ?? [],
      terms: {
        usage: values.usage,
        delivery: values.delivery,
        returnPolicy: values.returnPolicy,
        cancellation: values.cancellation,
      },
    };
    const save = async () => {
      setSaving(true);
      try {
        const publicationId = existing?.id ?? savedId;
        const outcome = publicationId
          ? await updateListing(publicationId, payload)
          : await createListing(payload);
        setResult(outcome);
        if (!outcome.ok) return;
        const id = publicationId ?? outcome.id;
        if (!id) return;
        setSavedId(id);
        if (await photos.save(id)) navigate('/my-items');
      } finally {
        setSaving(false);
      }
    };
    if (existing || savedId) await save();
    else guard(save);
  };

  const text = (
    name: keyof Values,
    label: string,
    options: { wide?: boolean; hint?: string; rows?: number } = {},
  ) => (
    <Field
      label={label}
      error={errors[name]?.message}
      hint={options.hint}
      wide={options.wide}
      required
    >
      {options.rows ? (
        <textarea rows={options.rows} {...register(name)} />
      ) : (
        <input {...register(name)} />
      )}
    </Field>
  );

  return (
    <>
      <PageHeader
        eyebrow={
          edit ? t('listingForm.editEyebrow') : t('listingForm.newEyebrow')
        }
        title={
          edit
            ? t('listingForm.editTitle', { title: existing?.title ?? '' })
            : t('listingForm.newTitle')
        }
        description={t('listingForm.description')}
      />
      {edit && (
        <div className="app-banner info">
          <ShieldCheck aria-hidden="true" />
          <p>{t('listingForm.snapshotNotice')}</p>
        </div>
      )}
      <form
        className="panel listing-form"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        <section>
          <h2>{t('listingForm.sections.info')}</h2>
          <div className="field-grid">
            {text('title', t('fields.title'), { wide: true })}
            <Field
              label={t('fields.category')}
              error={errors.category?.message}
              required
            >
              <select {...register('category')}>
                <option value="">{t('common.selectOption')}</option>
                {catalogService.categories.map((code) => (
                  <option key={code} value={code}>
                    {t(`categories.${code}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={t('fields.condition')}
              error={errors.condition?.message}
              required
            >
              <select {...register('condition')}>
                <option value="">{t('common.selectOption')}</option>
                {catalogService.conditions.map((code) => (
                  <option key={code} value={code}>
                    {t(`conditions.${code}`)}
                  </option>
                ))}
              </select>
            </Field>
            {text('description', t('fields.description'), {
              wide: true,
              rows: 4,
              hint: t('listingForm.descriptionHint'),
            })}
          </div>
        </section>
        <section>
          <h2>{t('listingForm.sections.location')}</h2>
          <div className="field-grid">
            <Field
              label={t('fields.university')}
              error={errors.universityId?.message}
              required
            >
              <select
                {...register('universityId', {
                  onChange: () => setValue('campus', ''),
                })}
              >
                <option value="">{t('common.selectOption')}</option>
                {universities.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.shortName}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={t('fields.campus')}
              error={errors.campus?.message}
              required
            >
              <input maxLength={150} {...register('campus')} />
            </Field>
            {text('location', t('fields.district'))}
            {text('exchangePlace', t('fields.exchangePlace'), {
              hint: t('listingForm.exchangeHint'),
            })}
          </div>
        </section>
        <section>
          <h2>{t('listingForm.sections.photos')}</h2>
          <ListingPhotos photos={photos} disabled={saving || isSubmitting} />
        </section>
        <section>
          <h2>{t('listingForm.sections.conditions')}</h2>
          <p className="muted small">{t('listingForm.conditionsHint')}</p>
          <div className="field-grid">
            {text('usage', t('fields.usage'), { rows: 3 })}
            {text('delivery', t('fields.delivery'), { rows: 3 })}
            {text('returnPolicy', t('fields.returnPolicy'), { rows: 3 })}
            {text('cancellation', t('fields.cancellation'), { rows: 3 })}
          </div>
        </section>
        <section>
          <h2>{t('listingForm.sections.economy')}</h2>
          <div className="field-grid">
            <Field
              label={t('fields.dailyRateCurrency')}
              error={errors.dailyRate?.message}
              hint={t('listingForm.rateHint')}
              required
            >
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0.5"
                {...register('dailyRate', { valueAsNumber: true })}
              />
            </Field>
            <Field
              label={t('fields.guaranteeCurrency')}
              error={errors.guaranteeAmount?.message}
              hint={t('listingForm.guaranteeHint')}
            >
              <input
                type="number"
                inputMode="decimal"
                step="1"
                min="0"
                {...register('guaranteeAmount', { valueAsNumber: true })}
              />
            </Field>
          </div>
        </section>
        {submitCount > 0 && Object.keys(errors).length > 0 && (
          <p className="field-error" role="alert">
            {t('validation.reviewFields')}
          </p>
        )}
        <Feedback result={result && !result.ok ? result : null} />
        <div className="form-footer">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/my-items')}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting || saving}>
            {saving
              ? t('common.processing')
              : edit || savedId
                ? t('listingForm.save')
                : t('listingForm.publish')}
          </Button>
        </div>
      </form>
      {dialog}
    </>
  );
}

export function AvailabilityPage() {
  const { t, formatDateTime } = useI18n();
  const { id } = useParams();
  const { state, createAvailability, updateAvailability, deleteAvailability } =
    useLendUp();
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const item = state.listings.find((candidate) => candidate.id === id);

  if (!item)
    return (
      <NotFound
        title={t('listing.notFound.title')}
        description={t('listing.notFound.description')}
      />
    );

  const available = item.availabilitySlots
    .filter((slot) => slot.status === 'AVAILABLE')
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const reserved = item.availabilitySlots
    .filter((slot) => slot.status === 'RESERVED')
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const deleteTarget = available.find((slot) => slot.id === deleteId);
  const startIso = fromZonedInput(startAt);
  const endIso = fromZonedInput(endAt);
  const validRange = Boolean(
    startIso && endIso && new Date(endIso) > new Date(startIso),
  );
  const future = Boolean(startIso && new Date(startIso) > new Date());
  const conflictingSlot = validRange
    ? available.find(
        (slot) =>
          slot.id !== editingId &&
          new Date(startIso) < new Date(slot.endAt) &&
          new Date(endIso) > new Date(slot.startAt),
      )
    : undefined;
  const overlaps = Boolean(conflictingSlot);
  const canSubmit = Boolean(
    startAt && endAt && validRange && future && !overlaps,
  );
  const validationMessage =
    !startAt || !endAt
      ? null
      : !validRange
        ? t('availability.invalidRange')
        : !future
          ? t('availability.pastStart')
          : overlaps
            ? t('availability.overlap') +
              ' ' +
              (conflictingSlot
                ? formatDateTime(conflictingSlot.startAt) +
                  ' – ' +
                  formatDateTime(conflictingSlot.endAt)
                : '')
            : null;

  const resetForm = () => {
    setEditingId(null);
    setStartAt('');
    setEndAt('');
  };
  const beginEdit = (slot: (typeof available)[number]) => {
    setEditingId(slot.id);
    setStartAt(toZonedInput(slot.startAt));
    setEndAt(toZonedInput(slot.endAt));
    setResult(null);
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    const outcome = editingId
      ? await updateAvailability(item.id, editingId, startIso, endIso)
      : await createAvailability(item.id, startIso, endIso);
    setBusy(false);
    setResult(outcome);
    if (outcome.ok) resetForm();
  };
  const remove = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    const outcome = await deleteAvailability(item.id, deleteTarget.id);
    setBusy(false);
    setResult(outcome);
    if (outcome.ok) {
      if (editingId === deleteTarget.id) resetForm();
      setDeleteId(null);
    }
  };

  return (
    <>
      <Link className="back-link" to="/my-items">
        <ArrowLeft aria-hidden="true" />
        {t('availability.back')}
      </Link>
      <PageHeader
        eyebrow={t('availability.eyebrow')}
        title={item.title}
        description={t('availability.description')}
      />
      <div className="availability-layout">
        <form className="panel availability-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">{t('availability.manage')}</p>
            <h2>
              {editingId
                ? t('availability.editTitle')
                : t('availability.addTitle')}
            </h2>
            <p className="muted small">{t('availability.formDescription')}</p>
          </div>
          <div className="date-fields">
            <Field label={t('fields.from')} required>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
                required
              />
            </Field>
            <Field label={t('fields.to')} required>
              <input
                type="datetime-local"
                value={endAt}
                min={startAt}
                onChange={(event) => setEndAt(event.target.value)}
                required
              />
            </Field>
          </div>
          {validationMessage && (
            <p className="field-error" role="alert">
              {validationMessage}
            </p>
          )}
          <Feedback result={result} />
          <div className="form-footer">
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                {t('availability.cancelEdit')}
              </Button>
            )}
            <Button type="submit" disabled={!canSubmit || busy}>
              {busy
                ? t('common.processing')
                : editingId
                  ? t('availability.save')
                  : t('availability.add')}
            </Button>
          </div>
        </form>

        <section className="panel slot-list">
          <p className="eyebrow">{t('availability.registered')}</p>
          <h2>{t('availability.availableTitle')}</h2>
          {available.length ? (
            <ul>
              {available.map((slot) => (
                <li key={slot.id}>
                  <span>
                    <Check aria-hidden="true" />
                    {formatDateTime(slot.startAt)} –{' '}
                    {formatDateTime(slot.endAt)}
                  </span>
                  <span className="slot-actions">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t('availability.edit')}
                      onClick={() => beginEdit(slot)}
                    >
                      <Edit3 aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="destructive"
                      aria-label={t('availability.delete')}
                      onClick={() => setDeleteId(slot.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('availability.noAvailable')}</p>
          )}

          <h2>{t('availability.reservedTitle')}</h2>
          <p className="muted small">{t('availability.reservedNote')}</p>
          {reserved.length ? (
            <ul>
              {reserved.map((slot, index) => (
                <li
                  className="reserved"
                  key={`${slot.startAt}-${slot.endAt}-${index}`}
                >
                  <span>
                    <CalendarDays aria-hidden="true" />
                    {formatDateTime(slot.startAt)} –{' '}
                    {formatDateTime(slot.endAt)}
                  </span>
                  <span className="status-label">
                    {t('availability.reserved')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('availability.noReserved')}</p>
          )}
        </section>
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('availability.deleteTitle')}
        description={
          deleteTarget
            ? t('availability.deleteDescription', {
                period: `${formatDateTime(deleteTarget.startAt)} – ${formatDateTime(deleteTarget.endAt)}`,
              })
            : undefined
        }
        confirmLabel={t('availability.deleteConfirm')}
        destructive
        busy={busy}
        onConfirm={remove}
      />
    </>
  );
}
