import { beforeEach, describe, expect, it, vi } from 'vitest';

const inject = vi.fn();
const track = vi.fn();
const pageview = vi.fn();
const injectSpeedInsights = vi.fn();
vi.mock('@vercel/analytics', () => ({ inject, track, pageview }));
vi.mock('@vercel/speed-insights', () => ({ injectSpeedInsights }));

// Fresh module per test: startAnalytics() only runs once per page.
const load = async () => {
  vi.resetModules();
  return import('../../src/analytics');
};

describe('analytics', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stays off outside production builds', async () => {
    const { startAnalytics, trackEvent, trackPageView } = await load();
    startAnalytics(false);
    trackPageView('/login');
    trackEvent('Clinic search', { results: 3 });
    expect(pageview).not.toHaveBeenCalled();
    expect(inject).not.toHaveBeenCalled();
    expect(injectSpeedInsights).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it('starts both scripts once in production', async () => {
    const { startAnalytics } = await load();
    startAnalytics(true);
    startAnalytics(true);
    expect(inject).toHaveBeenCalledTimes(1);
    expect(inject).toHaveBeenCalledWith(expect.objectContaining({ mode: 'production', disableAutoTrack: true }));
    expect(injectSpeedInsights).toHaveBeenCalledTimes(1);
  });

  it('never sends query strings or fragments, which can carry tokens or search text', async () => {
    const { startAnalytics, stripQuery } = await load();
    startAnalytics(true);
    const pageView = inject.mock.calls[0][0].beforeSend;
    const vital = injectSpeedInsights.mock.calls[0][0].beforeSend;

    expect(pageView({ type: 'pageview', url: 'https://dentist.zhifei.org/signup/verify?token=secret#x' }))
      .toEqual({ type: 'pageview', url: 'https://dentist.zhifei.org/signup/verify' });
    expect(vital({ type: 'vital', url: 'https://dentist.zhifei.org/find-a-clinic?q=sydney', route: '/find-a-clinic' }))
      .toEqual({ type: 'vital', url: 'https://dentist.zhifei.org/find-a-clinic', route: '/find-a-clinic' });
    expect(stripQuery('/relative?x=1')).toBe('/relative');
  });

  it('records sanitized pathname changes once, including return visits, without throwing', async () => {
    const { startAnalytics, trackPageView } = await load();
    startAnalytics(true);
    trackPageView('/login?token=secret#x');
    trackPageView('/login?token=other');
    trackPageView('/overview');
    trackPageView('/login');
    expect(pageview.mock.calls).toEqual([
      [{ path: '/login' }], [{ path: '/overview' }], [{ path: '/login' }],
    ]);

    pageview.mockImplementationOnce(() => { throw new Error('blocked'); });
    expect(() => trackPageView('/learn')).not.toThrow();
  });

  it('records conversions with counts and flags only, and never throws', async () => {
    const { startAnalytics, trackEvent } = await load();
    startAnalytics(true);
    trackEvent('Clinic search', { results: 4 });
    expect(track).toHaveBeenCalledWith('Clinic search', { results: 4 });

    track.mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    expect(() => trackEvent('Booking requested')).not.toThrow();
  });
});
