'use client';

import { useState } from 'react';
import { evidenceService } from '@/services/evidence.service';
import type { EvidenceAnalysis, Loan } from '@/types/domain';

export function useEvidenceAnalysis(loan: Loan | undefined) {
  const [analysis, setAnalysis] = useState<EvidenceAnalysis>();

  const run = async () => {
    if (!loan) return;
    const initial = loan.evidence.find((item) => item.phase === 'INITIAL');
    const final = loan.evidence.find((item) => item.phase === 'FINAL');
    if (!initial || !final) return;
    setAnalysis({
      id: '',
      loanId: loan.id,
      status: 'ANALYZING',
      updatedAt: new Date().toISOString(),
    });
    try {
      const row = await evidenceService.analyze(loan.id, initial.id, final.id);
      setAnalysis({
        id: String(row.id ?? ''),
        loanId: loan.id,
        status: String(row.estado) === 'PENDIENTE' ? 'ANALYZING' : 'SUCCESS',
        updatedAt: String(row.solicitado_en ?? new Date().toISOString()),
      });
    } catch {
      setAnalysis({
        id: '',
        loanId: loan.id,
        status: 'ERROR',
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return { analysis, run };
}
