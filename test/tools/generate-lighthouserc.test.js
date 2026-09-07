import { describe, it, expect } from 'vitest';
import {
  buildConfig,
  // eslint-disable-next-line import/extensions -- .mjs CLI script convention
} from '../../tools/scripts/generate-lighthouserc.mjs';

describe('buildConfig', () => {
  it('collects the given URLs with a single run', () => {
    const urls = ['https://example.com/', 'https://example.com/about'];
    const config = buildConfig(urls);
    expect(config.ci.collect.url).toEqual(urls);
    expect(config.ci.collect.numberOfRuns).toBe(1);
  });

  it('asserts a 90+ minimum score for performance, accessibility, and best-practices', () => {
    const { assertions } = buildConfig([]).ci.assert;
    expect(assertions['categories:performance']).toEqual(['error', { minScore: 0.9 }]);
    expect(assertions['categories:accessibility']).toEqual(['error', { minScore: 0.9 }]);
    expect(assertions['categories:best-practices']).toEqual(['error', { minScore: 0.9 }]);
  });

  it('does not assert the aggregate SEO category score', () => {
    const { assertions } = buildConfig([]).ci.assert;
    expect(assertions['categories:seo']).toBeUndefined();
  });

  it('asserts individual content-level SEO audits instead', () => {
    const { assertions } = buildConfig([]).ci.assert;
    ['document-title', 'meta-description', 'image-alt', 'canonical', 'hreflang'].forEach((audit) => {
      expect(assertions[audit]).toBe('error');
    });
  });

  it('does not assert is-crawlable (structurally fails on noindex preview domains)', () => {
    const { assertions } = buildConfig([]).ci.assert;
    expect(assertions['is-crawlable']).toBeUndefined();
  });

  it('writes reports to the local filesystem, not public storage', () => {
    const { upload } = buildConfig([]).ci;
    expect(upload.target).toBe('filesystem');
  });
});
