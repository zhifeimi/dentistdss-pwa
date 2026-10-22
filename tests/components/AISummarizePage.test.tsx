import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import AISummarizePage from '../../src/pages/DashboardPages/AISummarizePage';

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
}));

vi.mock('../../src/services', () => ({
  default: {
    chatbot: {
      send: mocks.send,
    },
  },
}));

vi.mock('../../src/context/auth', () => ({
  useAuth: () => ({ currentUser: { firstName: 'Jane', lastName: 'Smith', roles: ['DENTIST'] } }),
}));

vi.stubGlobal('ResizeObserver', class {
  observe() {}
  disconnect() {}
  unobserve() {}
});

const snackbarMessages =(): unknown[] =>
  vi.mocked(window.dispatchEvent).mock.calls
    .map(([event]) => event)
    .filter((event): event is CustomEvent => event instanceof CustomEvent && event.type === 'show-snackbar')
    .map((event) => event.detail.message);

describe('AISummarizePage', () => {
  beforeEach(() => {
    mocks.send.mockReset();
    vi.mocked(window.dispatchEvent).mockClear();
  });

  test('saves a summary that was requested with the Enter key', async () => {
    mocks.send.mockImplementationOnce(async (_agent, _prompt, options) => {
      options.onText?.('Summary retained');
      return { kind: 'completed', text: 'Summary retained' };
    });
    render(<AISummarizePage />);

    await userEvent.type(
      screen.getByPlaceholderText(/Paste appointment notes/),
      'Routine cleaning, no caries.{Enter}',
    );
    await screen.findByText('Summary retained');

    const saveButtons = screen.getAllByRole('button', { name: 'Save to Records' });
    await userEvent.click(saveButtons[saveButtons.length - 1]);

    expect(snackbarMessages()).toEqual(['Summary saved to patient records']);
  });

  test('streaming indicator is valid phrasing content inside the summary paragraph', async () => {
    let finish!: () => void;
    mocks.send.mockImplementationOnce((_agent, _prompt, options) => {
      options.onText?.('Summary');
      return new Promise((resolve) => {
        finish = () => resolve({ kind: 'completed', text: 'Summary' });
      });
    });
    const { container } = render(<AISummarizePage />);

    await userEvent.type(screen.getByPlaceholderText(/Paste appointment notes/), 'Notes{Enter}');
    await waitFor(() => expect(container.querySelector('[role="progressbar"]')).not.toBeNull());

    expect(container.querySelector('p div')).toBeNull();
    finish();
  });
});
