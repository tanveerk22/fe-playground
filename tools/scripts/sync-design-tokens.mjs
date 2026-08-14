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
const source = join(repoRoot, 'node_modules', '@audemarspiguet', 'design-tokens', 'build', 'css');
const destination = join(repoRoot, 'styles', 'tokens');

if (!existsSync(source)) {
  console.error('Could not find @audemarspiguet/design-tokens build output. Run `npm install` first.');
  process.exit(1);
}

rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, {
  recursive: true,
  filter: (src) => !src.split(sep).includes('fonts'),
});

console.log(`Synced design tokens from @audemarspiguet/design-tokens into ${destination}`);
