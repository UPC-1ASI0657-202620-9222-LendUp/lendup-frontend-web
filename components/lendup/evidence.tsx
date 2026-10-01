'use client';

import { useId, useState } from 'react';
import {
  BrainCircuit,
  FileText,
  ImagePlus,
  Info,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/lendup/shared';
import { appConfig } from '@/config/app-config';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { cloudinaryAdapter, UploadError } from '@/services/adapters/cloudinary';
import {
  canCompareEvidence,
  type AnalysisOutcome,
} from '@/services/adapters/gemini';
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
  const { t, formatNumber } = useI18n();
  const inputId = useId();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const base = () => ({
    phase,
    author: author.name,
    authorId: author.id,
    createdAt: new Date().toISOString(),
  });

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await cloudinaryAdapter.uploadMany(files);
      onChange([
        ...value,
        ...uploaded.map((media) => ({
          ...base(),
          id: `evidence-${media.publicId}`,
          type: media.kind,
          label: media.name,
          description: media.name,
          url: media.url,
        })),
      ]);
      setError('');
    } catch (reason) {
      setError(
        reason instanceof UploadError
          ? t(`uploads.errors.${reason.code}`, {
              name: reason.fileName,
              size: formatNumber(cloudinaryAdapter.maxBytes / 1_000_000),
            })
          : t('uploads.errors.READ_ERROR', { name: '' }),
      );
    } finally {
      setUploading(false);
    }
  };

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

  return (
    <div className="evidence-uploader">
      <label className="upload-zone" htmlFor={inputId}>
        <ImagePlus aria-hidden="true" />
        <strong>{label}</strong>
        <span>
          {t('uploads.hint', {
            size: formatNumber(cloudinaryAdapter.maxBytes / 1_000_000),
          })}
        </span>
        <span className="button-like">
          <Upload aria-hidden="true" />
          {uploading ? t('uploads.uploading') : t('uploads.select')}
        </span>
      </label>
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = '';
        }}
      />
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
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
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
                onClick={() =>
                  onChange(
                    value.filter((candidate) => candidate.id !== item.id),
                  )
                }
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
  onAnalyze: (outcome: AnalysisOutcome) => void;
}) {
  const { t, formatDateTime } = useI18n();
  const [outcome, setOutcome] = useState<AnalysisOutcome>('SUCCESS');
  const ready = canCompareEvidence(evidence);
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
        {appConfig.demoMode && (
          <label className="field compact">
            <span className="field-label">{t('demo.providerResponse')}</span>
            <select
              value={outcome}
              onChange={(event) =>
                setOutcome(event.target.value as AnalysisOutcome)
              }
            >
              {(['SUCCESS', 'TIMEOUT', 'ERROR'] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`analysis.outcomes.${value}`)}
                </option>
              ))}
            </select>
          </label>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={!ready || status === 'ANALYZING'}
          onClick={() => onAnalyze(outcome)}
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
