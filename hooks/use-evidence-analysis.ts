'use client';

import {
  geminiAdapter,
  type AnalysisOutcome,
} from '@/services/adapters/gemini';
import { useDemo } from '@/stores/demo-store';
import type { Loan } from '@/types/domain';

export function useEvidenceAnalysis(loan: Loan | undefined) {
  const { state, saveAnalysis } = useDemo();
  const analysis = loan
    ? state.analyses.find((candidate) => candidate.loanId === loan.id)
    : undefined;

  const run = async (outcome: AnalysisOutcome) => {
    if (!loan) return;
    saveAnalysis({
      id: `analysis-${loan.id}`,
      loanId: loan.id,
      status: 'ANALYZING',
      updatedAt: new Date().toISOString(),
    });
    saveAnalysis(await geminiAdapter.compare(loan.id, loan.evidence, outcome));
  };

  return { analysis, run };
}
