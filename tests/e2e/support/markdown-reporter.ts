import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

const OUTPUT = 'tests/e2e/reportes/reporte.md';

/** Reporte legible para el informe (secciones 5.3.3.3 y 5.3.3.4). */
export default class MarkdownReporter implements Reporter {
  private rows: { test: TestCase; result: TestResult }[] = [];
  private started = new Date();

  onTestEnd(test: TestCase, result: TestResult) {
    this.rows.push({ test, result });
  }

  onEnd(result: FullResult) {
    const passed = this.rows.filter(
      (row) => row.result.status === 'passed',
    ).length;
    const lines = [
      '# Reporte de pruebas End-to-End de LendUp (frontend)',
      '',
      `- Ejecución: ${this.started.toISOString()}`,
      `- Resultado global: **${result.status}**`,
      `- Pruebas: ${passed}/${this.rows.length} aprobadas`,
      `- Entorno: gateway ${process.env.E2E_GATEWAY_URL ?? 'http://localhost:8090/api/v1'}, emulador de Firebase ${process.env.E2E_EMULATOR_URL ?? 'http://localhost:9099'}`,
      '',
      '| # | Flujo | Resultado | Duración |',
      '|---|---|---|---|',
      ...this.rows.map(
        ({ test, result: r }, index) =>
          `| ${index + 1} | ${test.title} | ${r.status === 'passed' ? 'APROBADA' : r.status.toUpperCase()} | ${(r.duration / 1000).toFixed(1)} s |`,
      ),
      '',
    ];
    for (const { test, result: r } of this.rows) {
      if (r.status === 'passed') continue;
      lines.push(
        `## Fallo: ${test.title}`,
        '',
        '```',
        (r.error?.message ?? '').replace(
          new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'),
          '',
        ),
        '```',
        '',
      );
    }
    lines.push(
      'Capturas: `tests/e2e/reportes/capturas/`. Informe HTML: `tests/e2e/reportes/html/index.html`.',
      '',
    );
    mkdirSync(dirname(OUTPUT), { recursive: true });
    writeFileSync(OUTPUT, lines.join('\n'));
  }
}
