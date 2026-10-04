'use client';

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TermsDialog } from '@/components/lendup/terms';
import { useLendUp } from '@/hooks/use-lendup';
import { currentUserOf, termsAcceptedBy } from '@/stores/selectors';

export function useOperationGate() {
  const { state } = useLendUp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const user = currentUserOf(state);

  const guard = (action: () => void) => {
    if (!user?.verified) {
      navigate('/verify-email');
      return;
    }
    if (!termsAcceptedBy(state, user.id)) {
      pending.current = action;
      setOpen(true);
      return;
    }
    action();
  };

  const dialog = (
    <TermsDialog
      open={open}
      onOpenChange={setOpen}
      onAccepted={() => {
        const action = pending.current;
        pending.current = null;
        setTimeout(() => action?.(), 0);
      }}
    />
  );

  return { guard, dialog };
}
