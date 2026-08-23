#!/usr/bin/env node
/**
 * Fails if styles/styles.css declares a CSS custom property with the same
 * name as one already declared in the global design-token layers
 * (styles/tokens/branding, /core, /theme — the ones @import'ed globally by
 * styles/tokens-global.css). Those two are the only globally-scoped
 * property sets that can silently collide, since :root/html custom
 * properties aren't scopable. See docs/design-tokens-poc.md for the
 * incident this guards against.
 *
 * Run with: node tools/scripts/check-token-collisions.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const globalTokenDirs = ['branding', 'core', 'theme'].map((d) => join(repoRoot, 'styles', 'tokens', d));
const siteFile = join(repoRoot, 'styles', 'styles.css');

const VAR_DECLARATION = /(--[a-zA-Z0-9-]+)\s*:/g;

export function collectVarNames(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const names = new Set();
  let match = VAR_DECLARATION.exec(text);
  while (match) {
    names.add(match[1]);
    match = VAR_DECLARATION.exec(text);
  }
  return names;
}

export function listCssFiles(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files = files.concat(listCssFiles(full));
    } else if (entry.endsWith('.css')) {
      files.push(full);
    }
  }
  return files;
}

export function findCollisions(tokenDirs, targetFile) {
  const tokenVarSources = new Map();
  for (const dir of tokenDirs) {
    if (!existsSync(dir)) continue;
    for (const file of listCssFiles(dir)) {
      for (const name of collectVarNames(file)) {
        if (!tokenVarSources.has(name)) tokenVarSources.set(name, file);
      }
    }
  }

  const siteVarNames = collectVarNames(targetFile);
  const collisions = [...siteVarNames].filter((name) => tokenVarSources.has(name));
  return { collisions, tokenVarSources };
}

// Only run the CLI check when executed directly (`node check-token-collisions.mjs`),
// not when imported for its exported functions (e.g. by unit tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  const { collisions, tokenVarSources } = findCollisions(globalTokenDirs, siteFile);

  if (collisions.length > 0) {
    console.error('Design-token naming collision detected between styles/styles.css and the global token layers (branding/core/theme):\n');
    for (const name of collisions) {
      console.error(`  ${name}  (also declared in ${tokenVarSources.get(name).replace(`${repoRoot}/`, '')})`);
    }
    console.error('\nRename the colliding variable in styles/styles.css (e.g. prefix it with --legacy-) before merging — see docs/design-tokens-poc.md for why this matters.');
    process.exit(1);
  }

  console.log('No design-token naming collisions found between styles/styles.css and the global token layers.');
}
