import { afterAll, beforeAll, describe, test, expect } from 'vitest';
import { getCalendarViewRange, transformSlotsToEvents } from '../../src/utils/calendarUtils';

// Date-only API strings are local calendar dates; check zones on both sides of UTC
describe.each(['Australia/Sydney', 'America/New_York'])('transformSlotsToEvents in %s', (timeZone) => {
  // Restore by name: deleting TZ does not reset the runtime zone on every platform
  const originalTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  beforeAll(() => {
    process.env.TZ = timeZone;
  });
  afterAll(() => {
    process.env.TZ = originalTimeZone;
  });

  const slot = { id: 1, startTime: '09:00:00', endTime: '12:00:00', isBlocked: false, isActive: true };
  // Week view: Sunday 2026-10-18 through Saturday 2026-10-24
  const week = () => [new Date(2026, 9, 18), new Date(2026, 9, 24, 23, 59, 59, 999)] as const;

  test('places a Monday recurring slot on Monday', () => {
    const events = transformSlotsToEvents(
      [{ ...slot, isRecurring: true, dayOfWeek: 1, effectiveFrom: '2026-10-19', effectiveUntil: '2026-10-19' }],
      ...week(),
    );

    expect(events.map((event) => [event.resource.eventDate, event.start])).toEqual([
      ['2026-10-19', new Date(2026, 9, 19, 9)],
    ]);
  });

  test('includes a one-time slot on the first day of the view', () => {
    const events = transformSlotsToEvents(
      [{ ...slot, isRecurring: false, dayOfWeek: 0, effectiveFrom: '2026-10-18', effectiveUntil: '2026-10-18' }],
      ...week(),
    );

    expect(events.map((event) => [event.resource.eventDate, event.start])).toEqual([
      ['2026-10-18', new Date(2026, 9, 18, 9)],
    ]);
  });
});

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
