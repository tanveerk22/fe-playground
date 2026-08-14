import {
  handleRedirectCallback, isAuthenticated, login, logout,
} from '../../scripts/auth.js';

/**
 * Account-page tabs — authored here (not their own block) since only
 * "My AP" has content today. Once Portfolio/Wishlist ship, pull the tab
 * bar out into its own block shared across the account pages.
 */
const TABS = [
  { label: 'My AP', enabled: true },
  { label: 'Portfolio', enabled: false },
  { label: 'Wishlist', enabled: false },
];

function buildTabs() {
  const tabs = document.createElement('div');
  tabs.className = 'welcome-tabs';
  tabs.setAttribute('role', 'tablist');

  TABS.forEach(({ label, enabled }, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'welcome-tab';
    tab.setAttribute('role', 'tab');
    tab.textContent = label;

    const isActive = enabled && index === 0;
    tab.setAttribute('aria-selected', String(isActive));
    if (isActive) tab.classList.add('is-active');
    // Portfolio/Wishlist have no content yet — disable rather than hide,
    // so the future navigation shape is visible.
    if (!enabled) tab.disabled = true;

    tabs.append(tab);
  });

  const logoutButton = document.createElement('button');
  logoutButton.type = 'button';
  logoutButton.className = 'welcome-logout';
  logoutButton.textContent = 'Logout';
  logoutButton.addEventListener('click', () => logout());
  tabs.append(logoutButton);

  return tabs;
}

function renderSigningIn(panel) {
  panel.replaceChildren();
  const p = document.createElement('p');
  p.className = 'welcome-status';
  p.textContent = 'Signing you in…';
  panel.append(p);
}

function renderWelcome(panel) {
  panel.replaceChildren();

  const intro = document.createElement('div');
  intro.className = 'welcome-intro';
  const heading = document.createElement('h1');
  heading.textContent = 'Welcome!';
  intro.append(heading);

  const copy = document.createElement('div');
  copy.className = 'welcome-copy';
  const p1 = document.createElement('p');
  p1.textContent = 'Register your watches in your Portfolio to be able to access all our services from a single point.';
  const p2 = document.createElement('p');
  p2.textContent = 'In a few clicks, you can extend your International Sales Warranty or activate your Coverage '
    + 'Service for eligible watches, explore user manuals and technical details, or request a service with '
    + 'complimentary pick-up in some countries.';
  copy.append(p1, p2);

  const cta = document.createElement('div');
  cta.className = 'welcome-cta';
  const addWatchButton = document.createElement('button');
  addWatchButton.type = 'button';
  addWatchButton.className = 'welcome-add-watch';
  addWatchButton.textContent = 'Add a watch';
  cta.append(addWatchButton);

  panel.append(intro, copy, cta);
}

function renderLoggedOut(panel) {
  panel.replaceChildren();

  const p = document.createElement('p');
  p.className = 'welcome-status';
  p.textContent = 'You\'re not logged in.';
  panel.append(p);

  const loginButton = document.createElement('button');
  loginButton.type = 'button';
  loginButton.className = 'welcome-login';
  loginButton.textContent = 'Log in';
  loginButton.addEventListener('click', () => login());
  panel.append(loginButton);
}

export default async function decorate(block) {
  block.textContent = '';

  // Account pages are never a hero-over-dark-header page, so they always
  // want the site's light header (white background, dark logo/icons/links —
  // see `.theme-light` in styles/styles.css). The proper way to do this is
  // page metadata (`Theme: light`, read by decorateTemplateAndTheme in
  // scripts/aem.js), but the account pages aren't authored with it yet.
  // Force it here as a stand-in; drop this once that metadata exists.
  document.body.classList.add('theme-light');

  const panel = document.createElement('div');
  panel.className = 'welcome-panel';
  renderSigningIn(panel);
  block.append(panel);

  await handleRedirectCallback();

  if (await isAuthenticated()) {
    block.prepend(buildTabs());
    renderWelcome(panel);
  } else {
    renderLoggedOut(panel);
  }
}
