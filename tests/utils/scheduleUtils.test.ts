import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { formatDate, getDateRange } from '../../src/hooks/schedule/scheduleUtils';

// Local calendar dates must not shift through UTC; check zones on both sides of it
describe.each(['Australia/Sydney', 'America/New_York'])('schedule dates in %s', (timeZone) => {
  // Restore by name: deleting TZ does not reset the runtime zone on every platform
  const originalTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  beforeAll(() => {
    process.env.TZ = timeZone;
  });
  afterAll(() => {
    process.env.TZ = originalTimeZone;
  });

  test('formatDate keeps the local calendar date', () => {
    expect(formatDate(new Date(2026, 9, 1))).toBe('2026-10-01');
    expect(formatDate(new Date(2026, 9, 31, 23, 30))).toBe('2026-10-31');
  });

  test('getDateRange spans the whole local month', () => {
    expect(getDateRange(new Date(2026, 9, 22, 13, 45))).toEqual({
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });
  });
});
