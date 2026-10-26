import { describe, expect, it } from 'vitest';
import { returnPathAfterLogin } from '../../src/utils/returnPath';

const from = (pathname: string, search = '') => ({ from: { pathname, search } });

describe('returnPathAfterLogin', () => {
  it('returns to the page the visitor asked for, query included', () => {
    expect(returnPathAfterLogin(from('/appointments', '?book=7'))).toBe('/appointments?book=7');
  });

  it('falls back to the dashboard without a saved page', () => {
    expect(returnPathAfterLogin(undefined)).toBe('/dashboard');
    expect(returnPathAfterLogin(null)).toBe('/dashboard');
    expect(returnPathAfterLogin({})).toBe('/dashboard');
  });

  it.each(['//evil.example', '/\\evil.example', 'https://evil.example/x'])(
    'never leaves the site for %s',
    (pathname) => {
      expect(returnPathAfterLogin(from(pathname))).toBe('/dashboard');
    },
  );
});
