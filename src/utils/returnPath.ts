import type { ReturnLocation } from '../types/routerState';

// Back/Forward after a logout revisits the previous person's pages; those must
// not become the next login's landing page. Resets when the page reloads.
let loggedOut = false;
export const noteLogout = (): void => {
  loggedOut = true;
};
export const hasLoggedOut = (): boolean => loggedOut;

// Protected pages send logged-out visitors to /login with `{ from: location }`,
// so logging in can take them back to what they asked for (a booking link, say).
// Sign-up and email verification pass `from` along unchanged.
export const returnFrom = (state: unknown): ReturnLocation | undefined =>
  (state as { from?: ReturnLocation } | null)?.from;

export const returnPathAfterLogin = (state: unknown): string => {
  const from = returnFrom(state);
  // Router state is unchecked at runtime; the test below rejects anything odd
  const path = `${from?.pathname ?? ''}${from?.search ?? ''}`;
  // In-app paths only. Browsers read "//host" and "/\host" as another site,
  // and drop tabs and newlines first, so "/\t/host" would become "//host".
  return /^\/(?![/\\])[^\t\n\r]*$/.test(path) ? path : '/dashboard';
};
