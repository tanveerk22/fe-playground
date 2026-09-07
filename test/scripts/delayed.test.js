import { describe, it, expect } from 'vitest';

describe('delayed', () => {
  it('pushes a GTM start event and injects the GTM script tag', async () => {
    await import('../../scripts/delayed.js');

    expect(window.dataLayer).toBeTruthy();
    expect(window.dataLayer.some((entry) => entry.event === 'gtm.js')).toBe(true);

    const script = document.head.querySelector('script[src*="googletagmanager.com/gtm.js"]');
    expect(script).toBeTruthy();
    expect(script.async).toBe(true);
    expect(script.src).toContain('id=GTM-NGNW85W');
  });
});
