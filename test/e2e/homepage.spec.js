import { test, expect } from '@playwright/test';

const NOVELTIES_API_HOST = 'brand-experience-api-test.audemarspiguet.com';

// Checks the request/console-message host by parsing a real URL rather than
// substring-matching text (substring matching would also match an attacker
// or unrelated host that merely contains this string elsewhere in the URL).
function matchesNoveltiesHost(text) {
  const urlMatch = text.match(/https?:\/\/\S+/);
  if (!urlMatch) return false;
  try {
    return new URL(urlMatch[0]).hostname === NOVELTIES_API_HOST;
  } catch {
    return false;
  }
}

test.describe('Homepage', () => {
  test('renders the hero, novelties, teaser, gallery, and newsletter sections with no unexpected console errors', async ({ page }) => {
    // The novelties block's live API sits behind Cloudflare Access (see
    // blocks/novelties/novelties.js) and is expected to fail with a CORS
    // error in any environment without a valid Access session cookie — it
    // falls back to mock data, which the next test verifies. The browser
    // logs that as two console errors (a CORS policy message plus a
    // generic "Failed to load resource"). Rather than hardcode the exact
    // wording, tie the exclusion to an actual observed failed request to
    // that host, so any other ERR_FAILED is still treated as a regression.
    let novelitiesRequestFailed = false;
    page.on('requestfailed', (request) => {
      if (matchesNoveltiesHost(request.url())) novelitiesRequestFailed = true;
    });

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/');

    await expect(page.locator('.hero.block').first()).toBeVisible();
    await expect(page.locator('.novelties.block').first()).toBeVisible();
    await expect(page.locator('.teaser.block').first()).toBeVisible();
    await expect(page.locator('.gallery.block').first()).toBeVisible();
    await expect(page.locator('.newsletter.block')).toBeVisible();

    const unexpectedErrors = novelitiesRequestFailed
      ? consoleErrors.filter((text) => !matchesNoveltiesHost(text) && text !== 'Failed to load resource: net::ERR_FAILED')
      : consoleErrors;
    expect(unexpectedErrors).toEqual([]);
  });

  test('hero displays a heading and a call-to-action link', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.hero.block').first();

    await expect(hero.locator('h1')).toBeVisible();
    await expect(hero.locator('a.hero-cta').first()).toBeVisible();
  });

  test('novelties carousel renders cards with next/prev controls', async ({ page }) => {
    await page.goto('/');
    const novelties = page.locator('.novelties.block').first();

    await expect(novelties.locator('.novelties-card').first()).toBeVisible();
    await expect(novelties.locator('.novelties-next')).toBeVisible();
  });
});
