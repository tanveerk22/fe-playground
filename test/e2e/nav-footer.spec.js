import { test, expect } from '@playwright/test';

test.describe('Navigation and footer', () => {
  test('nav renders section links pointing at their expected destinations', async ({ page }) => {
    // Below the 1440px desktop breakpoint, nav-sections lives inside the
    // hamburger-controlled flyout (see the separate hamburger test) — use a
    // desktop viewport for the always-present inline mega-menu instead.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const nav = page.locator('header nav');
    // The nav fragment loads asynchronously (loadHeader in the lazy phase) —
    // wait for it to be populated before interacting with it.
    await page.waitForSelector('header nav a', { timeout: 15000 });

    // The "Watches" submenu is collapsed until clicked, at every viewport
    // size (see toggleAllNavSections/header.js) — open it before asserting
    // on the links inside it.
    await nav.getByRole('link', { name: 'Watches', exact: true }).click();

    await expect(nav.getByRole('link', { name: 'All Watches' })).toHaveAttribute(
      'href',
      'https://www.audemarspiguet.com/com/en/watch-collection',
    );
    await expect(nav.getByRole('link', { name: 'Our Collections' })).toHaveAttribute(
      'href',
      'https://www.audemarspiguet.com/com/en/collections',
    );
  });

  test('nav exposes a working hamburger toggle on mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');
    const nav = page.locator('#nav');
    const hamburgerButton = nav.locator('.nav-hamburger button');

    await expect(hamburgerButton).toBeVisible();
    expect(await nav.getAttribute('aria-expanded')).toBe('false');

    await hamburgerButton.click();
    expect(await nav.getAttribute('aria-expanded')).toBe('true');
  });

  test('footer renders nav links pointing at their expected destinations', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    // The footer fragment also loads asynchronously (loadFooter in the lazy
    // phase) — wait for it before asserting on specific links.
    await page.waitForSelector('footer a', { timeout: 15000 });

    await expect(footer.getByRole('link', { name: 'All Watches' })).toHaveAttribute(
      'href',
      'https://www.audemarspiguet.com/com/en/watch-collection.html',
    );
  });

  test('footer legal and social links are present', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');

    await expect(footer.locator('.footer-legal a').first()).toBeVisible();
    await expect(footer.locator('.footer-social a').first()).toBeVisible();
  });
});
