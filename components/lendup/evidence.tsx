'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BrainCircuit,
  FileText,
  Info,
  Trash2,
  UploadCloud,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/lendup/shared';
import { useI18n, type MessageKey } from '@/lib/i18n';
import type { Evidence, EvidenceAnalysis, User } from '@/types/domain';

export function EvidenceUploader({
  phase,
  author,
  value,
  onChange,
  label,
}: {
  phase: Evidence['phase'];
  author: User;
  value: Evidence[];
  onChange: (evidence: Evidence[]) => void;
  label: string;
}) {
  const { t } = useI18n();
  const [note, setNote] = useState('');
  const [fileError, setFileError] = useState('');
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(
    () => () => {
      valueRef.current.forEach((item) => {
        if (item.file && item.url?.startsWith('blob:'))
          URL.revokeObjectURL(item.url);
      });
    },
    [],
  );

  const base = () => ({
    phase,
    author: author.name,
    authorId: author.id,
    createdAt: new Date().toISOString(),
  });

  const addNote = () => {
    const text = note.trim();
    if (!text) return;
    onChange([
      ...value,
      {
        ...base(),
        id: `evidence-note-${Date.now()}`,
        type: 'NOTE',
        label: text,
        description: text,
      },
    ]);
    setNote('');
  };

  const addFiles = (files: File[]) => {
    const currentMedia = value.filter((item) => item.type !== 'NOTE').length;
    if (currentMedia + files.length > 6) {
      setFileError(t('uploads.errors.LIMIT'));
      return;
    }
    if (
      files.some(
        (file) =>
          ![
            'image/jpeg',
            'image/png',
            'image/webp',
            'video/mp4',
            'video/webm',
            'video/quicktime',
          ].includes(file.type),
      )
    ) {
      setFileError(t('uploads.errors.FORMAT'));
      return;
    }
    if (files.some((file) => file.size === 0 || file.size > 5 * 1024 * 1024)) {
      setFileError(t('uploads.errors.SIZE'));
      return;
    }
    setFileError('');
    onChange([
      ...value,
      ...files.map((file) => ({
        ...base(),
        id: crypto.randomUUID(),
        type: file.type.startsWith('video/')
          ? ('VIDEO' as const)
          : ('PHOTO' as const),
        label: file.name,
        description: '',
        url: URL.createObjectURL(file),
        file,
      })),
    ]);
  };

  const remove = (item: Evidence) => {
    if (item.file && item.url?.startsWith('blob:')) URL.revokeObjectURL(item.url);
    onChange(value.filter((candidate) => candidate.id !== item.id));
  };

  return (
    <div className="evidence-uploader">
      {phase !== 'INCIDENT' && (
        <label className="upload-zone">
          <UploadCloud aria-hidden="true" />
          <strong>{label}</strong>
          <span>{t('uploads.hint')}</span>
          <span className="button-like">{t('uploads.select')}</span>
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
          />
        </label>
      )}
      {fileError && (
        <p className="field-error" role="alert">
          {fileError}
        </p>
      )}
      <div className="evidence-note-input">
        <label className="field">
          <span className="field-label">{t('evidence.noteLabel')}</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('evidence.notePlaceholder')}
            rows={2}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={addNote}
          disabled={!note.trim()}
        >
          <FileText aria-hidden="true" />
          {t('evidence.addNote')}
        </Button>
      </div>
      {value.length > 0 && (
        <ul className="evidence-previews" aria-label={t('evidence.attached')}>
          {value.map((item) => (
            <li key={item.id}>
              <EvidenceThumb item={item} />
              <span>{item.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('evidence.remove', { name: item.label })}
                onClick={() => remove(item)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EvidenceThumb({ item }: { item: Evidence }) {
  const { t } = useI18n();
  if (item.type === 'PHOTO' && item.url)
    return <img src={item.url} alt={item.label} />;
  if (item.type === 'VIDEO' && item.url)
    return (
      <video src={item.url} controls aria-label={item.label}>
        <track
          kind="captions"
          srcLang="es"
          label={t('evidence.noCaptions')}
          src="data:text/vtt,WEBVTT"
          default
        />
      </video>
    );
  return (
    <span className="thumb-icon" aria-hidden="true">
      {item.type === 'VIDEO' ? <Video /> : <FileText />}
    </span>
  );
}

export function EvidenceGallery({
  title,
  items,
}: {
  title: string;
  items: Evidence[];
}) {
  const { t, formatDateTime } = useI18n();
  return (
    <section className="evidence-column">
      <h3 className="eyebrow">{title}</h3>
      {items.length ? (
        <ul className="evidence-list">
          {items.map((item) => (
            <li className="evidence-tile" key={item.id}>
              <EvidenceThumb item={item} />
              <div>
                <strong>{item.label}</strong>
                <small>
                  {t(`evidence.types.${item.type}`)} · {item.author} ·{' '}
                  {formatDateTime(item.createdAt)}
                </small>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{t('evidence.none')}</p>
      )}
    </section>
  );
}

export function AnalysisPanel({
  analysis,
  evidence,
  onAnalyze,
}: {
  analysis?: EvidenceAnalysis;
  evidence: Evidence[];
  onAnalyze: () => void;
}) {
  const { t, formatDateTime } = useI18n();
  const ready =
    evidence.some((item) => item.phase === 'INITIAL' && Boolean(item.url)) &&
    evidence.some((item) => item.phase === 'FINAL' && Boolean(item.url));
  const status = analysis?.status ?? 'IDLE';
  return (
    <div className="ai-panel">
      <span className="ai-icon" aria-hidden="true">
        <BrainCircuit />
      </span>
      <div className="ai-body">
        <div className="ai-heading">
          <strong>{t('analysis.title')}</strong>
          <StatusBadge kind="analysis" status={status} />
        </div>
        {status === 'SUCCESS' && analysis?.findings ? (
          <ul className="ai-findings">
            {analysis.findings.map((finding) => (
              <li key={finding}>{t(`analysis.findings.${finding}`)}</li>
            ))}
            {analysis.confidence && (
              <li className="muted">
                {t('analysis.confidence', {
                  level: t(`analysis.confidenceLevels.${analysis.confidence}`),
                })}
              </li>
            )}
          </ul>
        ) : (
          <p>{t(`analysis.messages.${status}` as MessageKey)}</p>
        )}
        {analysis?.updatedAt && status !== 'ANALYZING' && status !== 'IDLE' && (
          <small className="muted">{formatDateTime(analysis.updatedAt)}</small>
        )}
        <p className="ai-disclaimer">
          <Info aria-hidden="true" />
          {t('analysis.disclaimer')}
        </p>
        {!ready && <p className="muted small">{t('analysis.needsPhotos')}</p>}
      </div>
      <div className="ai-actions">
        <Button
          type="button"
          variant="outline"
          disabled={!ready || status === 'ANALYZING'}
          onClick={onAnalyze}
        >
          {status === 'ANALYZING'
            ? t('analysis.running')
            : status === 'IDLE'
              ? t('analysis.run')
              : t('analysis.rerun')}
        </Button>
      </div>
    </div>
  );
}
