import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../../src/services/config', () => ({
  broadcastSessionEnded: vi.fn(),
  clearBearerSession: vi.fn(),
  clearXsrfToken: vi.fn(),
  CSRF_BOOTSTRAP_PATH: '/api/auth/csrf',
  ensureXsrfBootstrapped: vi.fn(() => Promise.resolve()),
  refreshSession: vi.fn(() =>
    Promise.reject(new Error('refreshSession is not used in user API tests'))
  ),
  setBearerSession: vi.fn(),
  default: {
    get: mocks.get,
    put: mocks.put,
    post: mocks.post,
  },
}));

import userAPI from '../../src/services/user';

describe('user API contracts', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.put.mockReset();
    mocks.post.mockReset();
  });

  it('targets the user-profile service gateway routes', async () => {
    mocks.get.mockResolvedValue([]);
    mocks.put.mockResolvedValue({ id: 42 });

    await userAPI.getAllUsers();
    await userAPI.getProfile(42);
    await userAPI.updateProfile(42, { firstName: 'Renamed' });

    expect(mocks.get).toHaveBeenCalledWith('/api/user/list/all');
    expect(mocks.get).toHaveBeenCalledWith('/api/user/42/details');
    expect(mocks.put).toHaveBeenCalledWith('/api/user/42', { firstName: 'Renamed' });
  });

  it('keeps the unread count on the notification service route', async () => {
    mocks.get.mockResolvedValue({ unreadCount: 3 });

    const result = await userAPI.getUnreadCount(42);

    expect(mocks.get).toHaveBeenCalledWith('/api/notification/user/42/unread-count');
    expect(result).toEqual({ unreadCount: 3 });
  });
});
