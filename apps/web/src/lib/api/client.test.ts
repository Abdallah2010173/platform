import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { logoutRequest } from './client';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    post: vi.fn(),
  };
});

describe('logoutRequest', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the logout request with the stored tokens', async () => {
    localStorage.setItem('accessToken', 'access-token');
    localStorage.setItem('refreshToken', 'refresh-token');

    vi.mocked(axios.post).mockResolvedValueOnce({} as never);

    await expect(logoutRequest()).resolves.toBeUndefined();

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      { refreshToken: 'refresh-token' },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
        withCredentials: true,
      }),
    );
  });
});
