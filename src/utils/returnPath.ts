// Back/Forward after a logout revisits the previous person's pages; those must
// not become the next login's landing page. Resets when the page reloads.
let loggedOut = false;
export const noteLogout = (): void => {
  loggedOut = true;
};
export const hasLoggedOut = (): boolean => loggedOut;

// Protected pages send logged-out visitors to /login with `{ from: location }`,
// so logging in can take them back to what they asked for (a booking link, say).
export const returnPathAfterLogin = (state: unknown): string => {
  const from = (state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const path = `${from?.pathname ?? ''}${from?.search ?? ''}`;
  // In-app paths only; browsers read "//host" and "/\host" as another site
  return /^\/(?![/\\])/.test(path) ? path : '/dashboard';
};
