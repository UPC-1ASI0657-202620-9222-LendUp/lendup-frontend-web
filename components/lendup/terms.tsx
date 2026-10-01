'use client';

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
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
import { appConfig } from '@/config/app-config';
import { useI18n } from '@/lib/i18n';
import { useDemo, type ActionResult } from '@/stores/demo-store';

const sections = [
  'service',
  'accounts',
  'listings',
  'economics',
  'cancellations',
  'evidence',
  'privacy',
  'conduct',
] as const;

export function TermsDocument() {
  const { t, formatDate } = useI18n();
  return (
    <article className="terms-document">
      <p className="muted">
        {t('terms.version', {
          version: appConfig.termsVersion,
          date: formatDate(appConfig.termsPublishedAt),
        })}
      </p>
      {sections.map((section, index) => (
        <section key={section}>
          <h2>
            {index + 1}. {t(`terms.sections.${section}.title`)}
          </h2>
          <p>{t(`terms.sections.${section}.body`)}</p>
        </section>
      ))}
      <aside className="legal-note">
        <ShieldAlert aria-hidden="true" />
        <div>
          <h2>{t('terms.disclaimer.title')}</h2>
          <p>{t('terms.disclaimer.body')}</p>
        </div>
      </aside>
    </article>
  );
}

export function TermsAcceptance({ onAccepted }: { onAccepted?: () => void }) {
  const { t } = useI18n();
  const { acceptTerms } = useDemo();
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <div className="terms-acceptance">
      <label className="check-row">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        {t('terms.acceptLabel')}
      </label>
      <Button
        type="button"
        disabled={!checked}
        onClick={() => {
          const outcome = acceptTerms();
          setResult(outcome);
          if (outcome.ok) onAccepted?.();
        }}
      >
        {t('terms.accept')}
      </Button>
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
