import { describe, it, expect } from 'vitest';
import { join, sep } from 'path';
import {
  buildPaths,
  excludesFonts,
  // eslint-disable-next-line import/extensions -- .mjs CLI script convention
} from '../../tools/scripts/sync-design-tokens.mjs';

describe('buildPaths', () => {
  it('builds source and destination paths relative to the repo root', () => {
    const root = '/repo';
    const { source, destination } = buildPaths(root);
    expect(source).toBe(join(root, 'node_modules', '@audemarspiguet', 'design-tokens', 'build', 'css'));
    expect(destination).toBe(join(root, 'styles', 'tokens'));
  });
});

describe('excludesFonts', () => {
  it('excludes paths that contain a fonts segment', () => {
    const fontPath = ['build', 'css', 'fonts', 'Inter.woff2'].join(sep);
    expect(excludesFonts(fontPath)).toBe(false);
  });

  it('allows paths that do not contain a fonts segment', () => {
    const cssPath = ['build', 'css', 'branding', 'default.css'].join(sep);
    expect(excludesFonts(cssPath)).toBe(true);
  });
});
