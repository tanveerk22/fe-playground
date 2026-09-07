#!/usr/bin/env node
/**
 * Fails if any block JS/CSS, top-level script, or top-level stylesheet
 * exceeds a 10KB gzip budget. Scoped to `blocks/*|.{js,css}`, `scripts/*.js`,
 * and `styles/*.css` — excludes vendored/generated code (scripts/vendor,
 * styles/tokens) which isn't ours to shrink.
 *
 * Run with: node tools/scripts/check-file-size-budget.mjs
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

const BUDGET_BYTES = 10 * 1024;

export function gzipSize(filePath) {
  return gzipSync(readFileSync(filePath)).length;
}

function listFilesMatching(dir, { depth, extensions }) {
  const results = [];
  const walk = (current, remainingDepth) => {
    if (!existsOrSkip(current)) return;
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const stats = statSync(full);
      if (stats.isDirectory()) {
        if (remainingDepth > 0) walk(full, remainingDepth - 1);
      } else if (extensions.some((ext) => entry.endsWith(ext))) {
        results.push(full);
      }
    }
  };
  walk(dir, depth);
  return results;
}

function existsOrSkip(dir) {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

export function findBudgetFiles(root) {
  return [
    ...listFilesMatching(join(root, 'blocks'), { depth: 1, extensions: ['.js', '.css'] }),
    ...listFilesMatching(join(root, 'scripts'), { depth: 0, extensions: ['.js'] }),
    ...listFilesMatching(join(root, 'styles'), { depth: 0, extensions: ['.css'] }),
  ];
}

export function checkBudget(root, budgetBytes = BUDGET_BYTES) {
  const files = findBudgetFiles(root);
  const violations = files
    .map((file) => ({ file, size: gzipSize(file) }))
    .filter(({ size }) => size > budgetBytes);
  return { violations, budgetBytes };
}

// Only run the CLI check when executed directly (`node check-file-size-budget.mjs`),
// not when imported for its exported functions (e.g. by unit tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  const { violations, budgetBytes } = checkBudget(repoRoot);

  if (violations.length > 0) {
    console.error(`JS/CSS performance budget exceeded (${(budgetBytes / 1024).toFixed(0)}KB gzip per file):\n`);
    violations
      .sort((a, b) => b.size - a.size)
      .forEach(({ file, size }) => {
        console.error(`  ${(size / 1024).toFixed(2)}KB  ${file.replace(`${repoRoot}/`, '')}`);
      });
    console.error('\nSplit the block/script/stylesheet, or lazy-load part of it, before merging.');
    process.exit(1);
  }

  console.log(`All blocks, scripts, and styles are within the ${(budgetBytes / 1024).toFixed(0)}KB gzip budget.`);
}
