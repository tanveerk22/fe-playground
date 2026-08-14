/**
 * Shared Auth0 SPA client — redirect-based Universal Login.
 * See: https://auth0.com/docs/quickstart/spa/vanillajs
 *
 * cacheLocation is 'memory' (never touches localStorage) to match the
 * no-token-in-browser-storage posture used elsewhere on the site. The
 * tradeoff: EDS is a multi-page site (full navigations, not client-routed),
 * so the in-memory cache is wiped on every navigation and Auth0 falls back
 * to a silent hidden-iframe re-auth, which depends on third-party cookies
 * to the Auth0 domain and is unreliable in Safari ITP / Chrome's 3P-cookie
 * phase-out. If that proves flaky against the real tenant, the documented
 * fixes are enabling a Custom Domain (removes the 3P-cookie dependency) or
 * switching to cacheLocation: 'localstorage' with useRefreshTokens: true.
 */

const AUTH0_DOMAIN = 'audemarspiguet-dev.eu.auth0.com'; // 'ap-com-test.eu.auth0.com'; // 'audemarspiguet-dev.eu.auth0.com'; // use from placeholders
const AUTH0_CLIENT_ID = 'PvJaPz6cUvdFkymF4okQ0G5Hn0OuV84l'; // 'alMS0zzjsAiHCgq3XOHR2rrm1Cefluo2'; // 'PvJaPz6cUvdFkymF4okQ0G5Hn0OuV84l';
export const AUTH0_CALLBACK_PATH = '/en/secure/account/my-ap';

const AUTH0_SPA_JS_URL = 'https://cdn.auth0.com/js/auth0-spa-js/2.18/auth0-spa-js.production.esm.js';

let clientPromise;

async function getClient() {
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    // eslint-disable-next-line no-console
    console.warn('[auth] Auth0 is not configured yet — AUTH0_DOMAIN/AUTH0_CLIENT_ID are blank.');
    return null;
  }
  if (!clientPromise) {
    clientPromise = import(AUTH0_SPA_JS_URL).then(({ createAuth0Client }) => createAuth0Client({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      cacheLocation: 'memory',
      authorizationParams: {
        redirect_uri: `${window.location.origin}${AUTH0_CALLBACK_PATH}`,
      },
    }));
  }
  return clientPromise;
}

export async function login() {
  const client = await getClient();
  if (!client) return;
  await client.loginWithRedirect();
}

export async function logout() {
  const client = await getClient();
  if (!client) return;
  await client.logout({ logoutParams: { returnTo: window.location.origin } });
}

export async function isAuthenticated() {
  const client = await getClient();
  if (!client) return false;
  return client.isAuthenticated();
}

export async function getUser() {
  const client = await getClient();
  if (!client) return undefined;
  return client.getUser();
}

/**
 * Processes the ?code=&state= redirect from Auth0, if present, and strips
 * it from the URL (the SDK does not do this itself). No-op otherwise.
 */
export async function handleRedirectCallback() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('code') || !params.has('state')) return;
  const client = await getClient();
  if (!client) return;
  await client.handleRedirectCallback();
  window.history.replaceState({}, '', window.location.pathname);
}
