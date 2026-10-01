import { appConfig } from '@/config/app-config';
import type {
  AnalysisFindingCode,
  EvidenceAnalysis,
  Evidence,
} from '@/types/domain';

export type AnalysisOutcome = 'SUCCESS' | 'TIMEOUT' | 'ERROR';

class AnalysisTimeout extends Error {}

function withTimeout<T>(task: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new AnalysisTimeout()), timeoutMs);
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function simulatedModel(
  evidence: Evidence[],
  outcome: AnalysisOutcome,
): Promise<AnalysisFindingCode[]> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (outcome === 'TIMEOUT')
    await new Promise((resolve) =>
      setTimeout(resolve, appConfig.evidenceAnalysisTimeoutMs + 50),
    );
  if (outcome === 'ERROR') throw new Error('PROVIDER_ERROR');
  const finalNotes = evidence.filter((item) => item.phase === 'FINAL').length;
  return finalNotes > 1 ? ['MINOR_SURFACE_MARKS'] : ['NO_VISIBLE_CHANGES'];
}

export const geminiAdapter = {
  async compare(
    loanId: string,
    evidence: Evidence[],
    outcome: AnalysisOutcome = 'SUCCESS',
    timeoutMs: number = outcome === 'TIMEOUT'
      ? 1500
      : appConfig.evidenceAnalysisTimeoutMs,
  ): Promise<EvidenceAnalysis> {
    const base = { id: `analysis-${loanId}`, loanId };
    try {
      const findings = await withTimeout(
        simulatedModel(evidence, outcome),
        timeoutMs,
      );
      return {
        ...base,
        status: 'SUCCESS',
        findings,
        confidence: findings.includes('NO_VISIBLE_CHANGES')
          ? 'HIGH'
          : 'MODERATE',
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        ...base,
        status: error instanceof AnalysisTimeout ? 'TIMEOUT' : 'ERROR',
        updatedAt: new Date().toISOString(),
      };
    }
  },
};

export function canCompareEvidence(evidence: Evidence[]) {
  const photos = evidence.filter((item) => item.type === 'PHOTO' && item.url);
  return (
    photos.some((item) => item.phase === 'INITIAL') &&
    photos.some((item) => item.phase === 'FINAL')
  );
}
