#!/usr/bin/env node
/**
 * Generates a .lighthouserc.json for `@lhci/cli autorun`, combining the
 * critical-page URL list (`.github/lighthouse/urls.json` — the file authors
 * edit to add/remove pages) with a fixed set of score assertions.
 *
 * `categories:seo` is intentionally NOT asserted as a category score: the
 * `.aem.live`/`.aem.page` domains send `X-Robots-Tag: noindex, nofollow` by
 * design (EDS keeps preview content out of search results), which caps the
 * "is-crawlable" audit — and therefore the whole SEO category score — well
 * below 90 regardless of actual on-page SEO quality. Instead, the individual
 * content-level SEO audits (title, meta description, alt text, canonical,
 * etc.) are asserted directly, since those are what this budget item is
 * actually meant to catch. Re-evaluate once a custom production domain
 * (without the preview noindex header) is in place.
 *
 * Run with: node tools/scripts/generate-lighthouserc.mjs [output-path]
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

const SEO_AUDITS = [
  'document-title',
  'meta-description',
  'http-status-code',
  'link-text',
  'crawlable-anchors',
  'robots-txt',
  'image-alt',
  'hreflang',
  'canonical',
];

export function buildConfig(urls) {
  const assertions = {
    'categories:performance': ['error', { minScore: 0.9 }],
    'categories:accessibility': ['error', { minScore: 0.9 }],
    'categories:best-practices': ['error', { minScore: 0.9 }],
  };
  SEO_AUDITS.forEach((audit) => { assertions[audit] = 'error'; });

  return {
    ci: {
      collect: { url: urls, numberOfRuns: 1 },
      assert: { assertions },
      upload: { target: 'filesystem', outputDir: './.lighthouseci' },
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const urlsPath = join(repoRoot, '.github', 'lighthouse', 'urls.json');
  const outputPath = process.argv[2] || join(repoRoot, 'lighthouserc.generated.json');

  const urls = JSON.parse(readFileSync(urlsPath, 'utf8'));
  writeFileSync(outputPath, JSON.stringify(buildConfig(urls), null, 2));
  console.log(`Wrote Lighthouse CI config for ${urls.length} URL(s) to ${outputPath}`);
}
