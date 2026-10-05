import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fromApiLocalDateTime,
  fromApiUtcDateTime,
} from '../lib/dates.ts';

describe('backend date contracts', () => {
  it('interprets UTC audit timestamps without shifting them into the future', () => {
    assert.equal(
      fromApiUtcDateTime('2026-10-05T15:30:00'),
      '2026-10-05T15:30:00.000Z',
    );
    assert.equal(
      fromApiUtcDateTime('2026-10-05T15:30:00.123456'),
      '2026-10-05T15:30:00.123Z',
    );
  });

  it('keeps scheduled local dates in the configured application timezone', () => {
    assert.equal(
      fromApiLocalDateTime('2026-10-05T10:30:00'),
      '2026-10-05T15:30:00.000Z',
    );
  });
});
