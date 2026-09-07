import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';

const authMock = {
  handleRedirectCallback: vi.fn().mockResolvedValue(undefined),
  isAuthenticated: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../../../scripts/auth.js', () => authMock);

// Imported after the mock so decorate() picks up the mocked auth module.
const { default: decorate } = await import('../../../blocks/welcome/welcome.js');

describe('welcome decorate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.className = '';
  });

  it('applies the light theme to the page', async () => {
    authMock.isAuthenticated.mockResolvedValue(false);
    const block = document.createElement('div');

    await decorate(block);

    expect(document.body.classList.contains('theme-light')).toBe(true);
  });

  it('renders the logged-out state with a login button', async () => {
    authMock.isAuthenticated.mockResolvedValue(false);
    const block = document.createElement('div');

    await decorate(block);

    const loginButton = block.querySelector('.welcome-login');
    expect(loginButton).toBeTruthy();
    expect(block.querySelector('.welcome-tabs')).toBeNull();

    loginButton.click();
    expect(authMock.login).toHaveBeenCalled();
  });

  it('renders the welcome state with tabs when authenticated', async () => {
    authMock.isAuthenticated.mockResolvedValue(true);
    const block = document.createElement('div');

    await decorate(block);

    expect(block.querySelector('.welcome-tabs')).toBeTruthy();
    expect(block.querySelector('.welcome-intro h1').textContent).toBe('Welcome!');
    expect(block.querySelector('.welcome-status')).toBeNull();
  });

  it('marks only the first enabled tab as active and disables the rest', async () => {
    authMock.isAuthenticated.mockResolvedValue(true);
    const block = document.createElement('div');

    await decorate(block);

    const tabs = block.querySelectorAll('.welcome-tab');
    expect(tabs[0].classList.contains('is-active')).toBe(true);
    expect(tabs[0].disabled).toBe(false);
    expect(tabs[1].disabled).toBe(true);
    expect(tabs[2].disabled).toBe(true);
  });

  it('calls logout when the logout button is clicked', async () => {
    authMock.isAuthenticated.mockResolvedValue(true);
    const block = document.createElement('div');

    await decorate(block);

    block.querySelector('.welcome-logout').click();
    expect(authMock.logout).toHaveBeenCalled();
  });

  it('processes the Auth0 redirect callback before checking auth state', async () => {
    authMock.isAuthenticated.mockResolvedValue(false);
    const block = document.createElement('div');

    await decorate(block);

    expect(authMock.handleRedirectCallback).toHaveBeenCalled();
  });
});
