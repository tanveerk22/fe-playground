import {
  describe, it, expect, beforeAll, afterAll,
} from 'vitest';
import { gzipSync } from 'zlib';
import { randomBytes } from 'crypto';
import {
  mkdtempSync, mkdirSync, writeFileSync, rmSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  gzipSize,
  findBudgetFiles,
  checkBudget,
  // eslint-disable-next-line import/extensions -- .mjs CLI script convention
} from '../../tools/scripts/check-file-size-budget.mjs';

describe('gzipSize', () => {
  let dir;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'size-budget-gzip-'));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns the gzip-compressed byte size of a file', () => {
    const file = join(dir, 'sample.js');
    const content = 'a'.repeat(1000);
    writeFileSync(file, content);
    expect(gzipSize(file)).toBe(gzipSync(content).length);
    expect(gzipSize(file)).toBeLessThan(content.length);
  });
});

describe('findBudgetFiles', () => {
  let root;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'size-budget-find-'));
    mkdirSync(join(root, 'blocks', 'hero'), { recursive: true });
    writeFileSync(join(root, 'blocks', 'hero', 'hero.js'), '');
    writeFileSync(join(root, 'blocks', 'hero', 'hero.css'), '');
    writeFileSync(join(root, 'blocks', 'hero', 'README.md'), '');
    mkdirSync(join(root, 'scripts', 'vendor'), { recursive: true });
    writeFileSync(join(root, 'scripts', 'scripts.js'), '');
    writeFileSync(join(root, 'scripts', 'vendor', 'preact.js'), '');
    mkdirSync(join(root, 'styles'), { recursive: true });
    writeFileSync(join(root, 'styles', 'styles.css'), '');
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('finds block JS/CSS files one level deep', () => {
    const files = findBudgetFiles(root);
    expect(files).toContain(join(root, 'blocks', 'hero', 'hero.js'));
    expect(files).toContain(join(root, 'blocks', 'hero', 'hero.css'));
  });

  it('excludes non-JS/CSS files in block directories', () => {
    const files = findBudgetFiles(root);
    expect(files).not.toContain(join(root, 'blocks', 'hero', 'README.md'));
  });

  it('finds top-level scripts but excludes vendored subdirectory files', () => {
    const files = findBudgetFiles(root);
    expect(files).toContain(join(root, 'scripts', 'scripts.js'));
    expect(files).not.toContain(join(root, 'scripts', 'vendor', 'preact.js'));
  });

  it('finds top-level stylesheets', () => {
    const files = findBudgetFiles(root);
    expect(files).toContain(join(root, 'styles', 'styles.css'));
  });

  it('returns an empty list for directories that do not exist', () => {
    const emptyRoot = mkdtempSync(join(tmpdir(), 'size-budget-empty-'));
    expect(findBudgetFiles(emptyRoot)).toEqual([]);
    rmSync(emptyRoot, { recursive: true, force: true });
  });
});

describe('checkBudget', () => {
  let root;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'size-budget-check-'));
    mkdirSync(join(root, 'blocks', 'big'), { recursive: true });
    // Random (incompressible) bytes so the gzip size stays close to the raw
    // size — a repeated character would compress down to near-nothing.
    writeFileSync(join(root, 'blocks', 'big', 'big.js'), randomBytes(20 * 1024));
    mkdirSync(join(root, 'blocks', 'small'), { recursive: true });
    writeFileSync(join(root, 'blocks', 'small', 'small.js'), 'y'.repeat(10));
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('reports no violations when every file is within budget', () => {
    const { violations } = checkBudget(root, 10 * 1024);
    const smallFile = join(root, 'blocks', 'small', 'small.js');
    expect(violations.find((v) => v.file === smallFile)).toBeUndefined();
  });

  it('reports a violation for a file exceeding the gzip budget', () => {
    const { violations } = checkBudget(root, 10 * 1024);
    const bigFile = join(root, 'blocks', 'big', 'big.js');
    const violation = violations.find((v) => v.file === bigFile);
    expect(violation).toBeTruthy();
    expect(violation.size).toBeGreaterThan(10 * 1024);
  });

  it('respects a custom budget threshold', () => {
    const { violations } = checkBudget(root, 1);
    expect(violations.length).toBeGreaterThanOrEqual(2);
  });
});
