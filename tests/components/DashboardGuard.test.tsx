import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The real router: the guard depends on how the visitor got to the page
vi.mock('react-router', async () => await vi.importActual('react-router'));

vi.mock('../../src/context/auth', () => ({
  useAuth: () => ({ currentUser: null, loading: false }),
}));

vi.mock('../../src/components/Dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Fresh modules per test: the logged-out flag lives until the page reloads
const load = async () => {
  vi.resetModules();
  const router = await import('react-router');
  const { noteLogout } = await import('../../src/utils/returnPath');
  const { default: Dashboard } = await import('../../src/pages/Dashboard');

  const LoginProbe = () => {
    const from = (router.useLocation().state as { from?: { pathname: string; search: string } } | null)?.from;
    return <p>{from ? `return to ${from.pathname}${from.search}` : 'no return path'}</p>;
  };

  const renderAt = (entry: string) =>
    render(
      <router.MemoryRouter initialEntries={[entry]}>
        <router.Routes>
          <router.Route path="/login" element={<LoginProbe />} />
          <router.Route path="/start" element={<router.Link to="/appointments?book=7">Book a visit</router.Link>} />
          <router.Route path="*" element={<Dashboard logout={() => {}} />} />
        </router.Routes>
      </router.MemoryRouter>,
    );

  return { noteLogout, renderAt };
};

describe('Dashboard guard for logged-out visitors', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('keeps the page a shared link pointed to', async () => {
    const { renderAt } = await load();
    renderAt('/appointments?book=7');

    expect(await screen.findByText('return to /appointments?book=7')).toBeInTheDocument();
  });

  it('forgets the page reached with Back or Forward after a logout', async () => {
    const { noteLogout, renderAt } = await load();
    noteLogout();
    // A MemoryRouter's first entry arrives as a POP, like Back or Forward
    renderAt('/appointments?book=7');

    expect(await screen.findByText('no return path')).toBeInTheDocument();
  });

  it('keeps the page a link click asked for after a logout', async () => {
    const { noteLogout, renderAt } = await load();
    noteLogout();
    renderAt('/start');

    await userEvent.click(screen.getByRole('link', { name: 'Book a visit' }));

    expect(await screen.findByText('return to /appointments?book=7')).toBeInTheDocument();
  });
});
