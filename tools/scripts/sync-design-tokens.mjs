#!/usr/bin/env node
/**
 * Vendors the CSS built by the published @audemarspiguet/design-tokens
 * package into styles/tokens/. This site ships static files with no
 * bundler to resolve a node_modules import in the browser, so the files
 * are copied in and committed; re-run this after bumping the package
 * version and review the diff before committing.
 *
 * Excludes build/css/fonts — this repo has its own font pipeline
 * (styles/fonts.css + /fonts).
 *
 * Run with: node tools/scripts/sync-design-tokens.mjs
 */
import { cpSync, rmSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, sep } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

export function buildPaths(root) {
  return {
    source: join(root, 'node_modules', '@audemarspiguet', 'design-tokens', 'build', 'css'),
    destination: join(root, 'styles', 'tokens'),
  };
}

// This repo has its own font pipeline (styles/fonts.css + /fonts) — never
// vendor the package's fonts/ directory alongside its CSS.
export function excludesFonts(src) {
  return !src.split(sep).includes('fonts');
}

// Only run the CLI sync when executed directly (`node sync-design-tokens.mjs`),
// not when imported for its exported functions (e.g. by unit tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  const { source, destination } = buildPaths(repoRoot);

  if (!existsSync(source)) {
    console.error('Could not find @audemarspiguet/design-tokens build output. Run `npm install` first.');
    process.exit(1);
  }

  rmSync(destination, { recursive: true, force: true });
  cpSync(source, destination, {
    recursive: true,
    filter: excludesFonts,
  });

  console.log(`Synced design tokens from @audemarspiguet/design-tokens into ${destination}`);
}
