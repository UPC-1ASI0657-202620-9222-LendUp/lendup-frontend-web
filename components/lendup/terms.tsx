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
import { useI18n } from '@/lib/i18n';
import { useLendUp, type ActionResult } from '@/hooks/use-lendup';

export function TermsDocument() {
  const { t } = useI18n();
  return (
    <article className="terms-document">
      <aside className="legal-note">
        <ShieldAlert aria-hidden="true" />
        <div>
          <h2>{t('common.backendGap')}</h2>
          <p>{t('terms.disclaimer.body')}</p>
        </div>
      </aside>
    </article>
  );
}

export function TermsAcceptance({ onAccepted }: { onAccepted?: () => void }) {
  const { t } = useI18n();
  const { acceptTerms, termsAvailable } = useLendUp();
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <div className="terms-acceptance">
      <label className="check-row">
        <input
          type="checkbox"
          checked={checked}
          disabled={!termsAvailable}
          onChange={(event) => setChecked(event.target.checked)}
        />
        {t('terms.acceptLabel')}
      </label>
      <Button
        type="button"
        disabled={!checked || !termsAvailable}
        onClick={async () => {
          const outcome = await acceptTerms();
          setResult(outcome);
          if (outcome.ok) onAccepted?.();
        }}
      >
        {t('terms.accept')}
      </Button>
      {!termsAvailable && (
        <p className="muted small">{t('common.backendGap')}</p>
      )}
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
