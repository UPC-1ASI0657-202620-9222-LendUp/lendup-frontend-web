'use client';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { photoSelectionError } from '@/lib/listing-photos';
import { DomainError, gatewayRequest } from '@/services/api/http-client';
import { endpoints } from '@/services/api/endpoints';
import type { Listing, ListingMedia } from '@/types/domain';
type ImageDto = { id: string; url: string; orden: number };
export function useListingPhotos(existing?: Listing) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [remote, setRemote] = useState<ListingMedia[]>(existing?.media ?? []);
  const [removed, setRemoved] = useState<string[]>([]);
  const [pending, setPending] = useState<File[]>([]);
  const [error, setError] = useState('');
  const loadedId = useRef(existing?.id);
  const uploadIds = useRef(new WeakMap<File, string>());
  useEffect(() => {
    if (loadedId.current === existing?.id) return;
    loadedId.current = existing?.id;
    setRemote(existing?.media ?? []);
    setRemoved([]);
    setPending([]);
  }, [existing?.id, existing?.media]);
  const select = (files: File[]) => {
    const problem = photoSelectionError(
      files,
      remote.length - removed.length + pending.length,
    );
    if (problem) {
      setError(t(`photos.${problem}`));
      return;
    }
    setError('');
    setPending((current) => [...current, ...files]);
  };
  const save = async (id: string) => {
    setError('');
    try {
      for (const imageId of removed) {
        await gatewayRequest(endpoints.catalog.deleteImage, {
          params: { id, imageId },
        });
        setRemote((current) => current.filter((image) => image.id !== imageId));
        setRemoved((current) => current.filter((value) => value !== imageId));
      }
      for (const file of pending) {
        const body = new FormData();
        body.append('file', file);
        let uploadId = uploadIds.current.get(file);
        if (!uploadId) {
          uploadId = crypto.randomUUID();
          uploadIds.current.set(file, uploadId);
        }
        body.append('uploadId', uploadId);
        const image = await gatewayRequest<ImageDto>(
          endpoints.catalog.uploadImage,
          { params: { id }, body },
        );
        setRemote((current) => [
          ...current,
          { id: image.id, url: image.url, type: 'PHOTO', name: file.name },
        ]);
        setPending((current) => current.filter((value) => value !== file));
      }
      return true;
    } catch (cause) {
      const detail =
        cause instanceof DomainError && cause.message !== cause.code
          ? cause.message
          : '';
      const status =
        cause instanceof DomainError && cause.status
          ? ' (HTTP ' + cause.status + ')'
          : '';
      setError(t('photos.saveFailed') + (detail ? ' ' + detail : '') + status);
      return false;
    } finally {
      await queryClient.invalidateQueries({ queryKey: ['listings'] });
    }
  };
  return {
    remote,
    removed,
    pending,
    error,
    select,
    save,
    removeRemote: (id: string) => setRemoved((current) => [...current, id]),
    removePending: (file: File) =>
      setPending((current) => current.filter((value) => value !== file)),
  };
}
function LocalPreview({ file }: { file: File }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  return url ? <img src={url} alt={file.name} /> : null;
}
export function ListingPhotos({
  photos,
  disabled,
}: {
  photos: ReturnType<typeof useListingPhotos>;
  disabled: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="listing-photos">
      <label className="field">
        <span className="field-label">{t('photos.select')}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled}
          onChange={(event) => {
            photos.select(Array.from(event.target.files ?? []));
            event.target.value = '';
          }}
        />
      </label>
      <p className="muted small">{t('photos.hint')}</p>
      <div className="photo-grid">
        {photos.remote
          .filter((image) => !photos.removed.includes(image.id))
          .map((image, index) => (
            <div key={image.id} className="photo-preview">
              <img
                src={image.url}
                alt={t('photos.preview', { index: index + 1 })}
              />
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => photos.removeRemote(image.id)}
                aria-label={t('photos.remove', { index: index + 1 })}
              >
                {t('photos.removeButton')}
              </Button>
            </div>
          ))}
        {photos.pending.map((file, index) => (
          <div key={index} className="photo-preview">
            <LocalPreview file={file} />
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => photos.removePending(file)}
              aria-label={t('photos.remove', { index: index + 1 })}
            >
              {t('photos.removeButton')}
            </Button>
          </div>
        ))}
      </div>
      {photos.error && (
        <p role="alert" className="field-error">
          {photos.error}
        </p>
      )}
    </div>
  );
}
