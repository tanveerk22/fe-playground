import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';

const client = {
  loginWithRedirect: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: vi.fn().mockResolvedValue(false),
  getUser: vi.fn().mockResolvedValue({ name: 'Test User' }),
  handleRedirectCallback: vi.fn().mockResolvedValue(undefined),
};
const createAuth0Client = vi.fn().mockResolvedValue(client);

vi.mock('https://cdn.auth0.com/js/auth0-spa-js/2.18/auth0-spa-js.production.esm.js', () => ({
  createAuth0Client,
}));

const {
  login, logout, isAuthenticated, getUser, handleRedirectCallback, AUTH0_CALLBACK_PATH,
} = await import('../../scripts/auth.js');

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('login() triggers a redirect login', async () => {
    await login();
    expect(client.loginWithRedirect).toHaveBeenCalled();
  });

  it('logout() logs out with a returnTo pointing at the origin', async () => {
    await logout();
    expect(client.logout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin },
    });
  });

  it('isAuthenticated() reflects the client state', async () => {
    client.isAuthenticated.mockResolvedValue(true);
    expect(await isAuthenticated()).toBe(true);
  });

  it('getUser() returns the client user', async () => {
    expect(await getUser()).toEqual({ name: 'Test User' });
  });

  it('handleRedirectCallback() is a no-op without code/state query params', async () => {
    window.history.replaceState({}, '', '/en/secure/account/my-ap');
    await handleRedirectCallback();
    expect(client.handleRedirectCallback).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe('/en/secure/account/my-ap');
  });

  it('handleRedirectCallback() processes and strips code/state query params', async () => {
    window.history.replaceState({}, '', `${AUTH0_CALLBACK_PATH}?code=abc&state=xyz`);
    await handleRedirectCallback();
    expect(client.handleRedirectCallback).toHaveBeenCalled();
    expect(window.location.pathname).toBe(AUTH0_CALLBACK_PATH);
    expect(window.location.search).toBe('');
  });
});
