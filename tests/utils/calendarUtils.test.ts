import { describe, test, expect } from 'vitest';
import { getCalendarViewRange } from '../../src/utils/calendarUtils';

describe('getCalendarViewRange', () => {
  // Thursday 2026-10-22, mid-afternoon local time
  const currentDate = new Date(2026, 9, 22, 13, 45);

  test.each([
    // Month view pads one week on each side of the month
    { view: 'month', startDate: '2026-09-24', endDate: '2026-11-07', startDateTime: new Date(2026, 8, 24), endDateTime: new Date(2026, 10, 7, 23, 59, 59, 999) },
    { view: 'week', startDate: '2026-10-18', endDate: '2026-10-24', startDateTime: new Date(2026, 9, 18), endDateTime: new Date(2026, 9, 24, 23, 59, 59, 999) },
    { view: 'day', startDate: '2026-10-22', endDate: '2026-10-22', startDateTime: new Date(2026, 9, 22), endDateTime: new Date(2026, 9, 22, 23, 59, 59, 999) },
    { view: 'agenda', startDate: '2026-10-01', endDate: '2026-10-31', startDateTime: new Date(2026, 9, 1), endDateTime: new Date(2026, 9, 31, 23, 59, 59, 999) },
  ])('$view view spans its whole range', ({ view, ...expected }) => {
    expect(getCalendarViewRange(currentDate, view)).toEqual(expected);
  });
});
