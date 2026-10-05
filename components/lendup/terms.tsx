'use client';

import { useState } from 'react';
import { parseTermsDocument } from '@/lib/terms-document';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Feedback } from '@/components/lendup/shared';
import { useI18n } from '@/lib/i18n';
import { useLendUp, type ActionResult } from '@/hooks/use-lendup';

export function TermsDocument() {
  const { t } = useI18n();
  const { termsDocument, termsAvailable, termsLoading, retryTerms } =
    useLendUp();
  if (termsLoading) return <output>{t('common.loading')}</output>;
  if (!termsAvailable)
    return (
      <div role="alert">
        <p>{t('terms.loadFailed')}</p>
        <Button onClick={() => void retryTerms()}>{t('common.retry')}</Button>
      </div>
    );
  const sections = parseTermsDocument(String(termsDocument?.contenido ?? ''));
  return (
    <article className="terms-document" lang="es">
      <p className="muted small">
        {t('terms.versionLabel', {
          version: String(termsDocument?.version_terminos ?? ''),
        })}
      </p>
      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.blocks.map((block, index) =>
            block.list ? (
              <ul key={index}>
                {block.lines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : (
              <p key={index}>{block.lines[0]}</p>
            ),
          )}
        </section>
      ))}
    </article>
  );
}

export function TermsAcceptance({ onAccepted }: { onAccepted?: () => void }) {
  const { t } = useI18n();
  const {
    acceptTerms,
    termsAvailable,
    termsLoading,
    retryTerms,
    termsDocument,
    emailVerified,
  } = useLendUp();
  const [checkedVersion, setCheckedVersion] = useState<string | null>(null);
  const version = String(termsDocument?.version_terminos ?? '');
  const checked = checkedVersion === version && Boolean(version);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <div className="terms-acceptance">
      <label className="check-row">
        <input
          type="checkbox"
          checked={checked}
          disabled={!termsAvailable || submitting || !emailVerified}
          onChange={(event) =>
            setCheckedVersion(event.target.checked ? version : null)
          }
        />
        {t('terms.acceptLabel')}
      </label>
      <Button
        type="button"
        disabled={!checked || !termsAvailable || submitting || !emailVerified}
        onClick={async () => {
          setSubmitting(true);
          const outcome = await acceptTerms();
          setSubmitting(false);
          setResult(outcome);
          if (outcome.ok) onAccepted?.();
        }}
      >
        {submitting ? t('common.processing') : t('terms.accept')}
      </Button>
      {!termsAvailable && (
        <div>
          <p className="muted small">
            {t(termsLoading ? 'common.loading' : 'terms.loadFailed')}
          </p>
          {!termsLoading && (
            <Button variant="outline" onClick={() => void retryTerms()}>
              {t('common.retry')}
            </Button>
          )}
        </div>
      )}
      {!emailVerified && <p>{t('terms.verifyFirst')}</p>}
      <Feedback result={result && !result.ok ? result : null} />
    </div>
  );
}

export function TermsDialog({
  open,
  onOpenChange,
  onAccepted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccepted: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="app-dialog terms-dialog"
        closeLabel={t('common.close')}
      >
        <DialogHeader>
          <DialogTitle>{t('terms.gate.title')}</DialogTitle>
          <DialogDescription>{t('terms.gate.description')}</DialogDescription>
        </DialogHeader>
        <div className="dialog-body scrollable">
          <TermsDocument />
        </div>
        <DialogFooter className="terms-footer">
          <TermsAcceptance
            onAccepted={() => {
              onOpenChange(false);
              onAccepted();
            }}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
