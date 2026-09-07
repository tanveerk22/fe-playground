import {
  describe, it, expect, beforeAll, afterAll,
} from 'vitest';
import {
  mkdtempSync, mkdirSync, writeFileSync, rmSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  collectVarNames,
  listCssFiles,
  findCollisions,
  // eslint-disable-next-line import/extensions -- .mjs CLI script convention
} from '../../tools/scripts/check-token-collisions.mjs';

describe('collectVarNames', () => {
  let dir;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'token-collisions-'));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('extracts custom property declarations from CSS text', () => {
    const file = join(dir, 'sample.css');
    writeFileSync(file, ':root { --color-primary: red; --spacing-sm: 4px; }');
    const names = collectVarNames(file);
    expect(names).toEqual(new Set(['--color-primary', '--spacing-sm']));
  });

  it('returns an empty set when there are no declarations', () => {
    const file = join(dir, 'empty.css');
    writeFileSync(file, '.foo { color: red; }');
    expect(collectVarNames(file)).toEqual(new Set());
  });
});

describe('listCssFiles', () => {
  let dir;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'token-list-'));
    writeFileSync(join(dir, 'a.css'), '');
    writeFileSync(join(dir, 'ignore.txt'), '');
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('finds .css files and ignores other extensions', () => {
    const files = listCssFiles(dir);
    expect(files).toEqual([join(dir, 'a.css')]);
  });

  it('recurses into subdirectories', () => {
    const nestedDir = join(dir, 'nested');
    mkdirSync(nestedDir);
    writeFileSync(join(nestedDir, 'b.css'), '');
    const files = listCssFiles(dir);
    expect(files).toContain(join(nestedDir, 'b.css'));
  });
});

describe('findCollisions', () => {
  let tokenDir;
  let siteFile;

  beforeAll(() => {
    const dir = mkdtempSync(join(tmpdir(), 'token-findcollisions-'));
    tokenDir = join(dir, 'tokens');
    mkdirSync(tokenDir);
    writeFileSync(join(tokenDir, 'branding.css'), ':root { --color-primary: red; }');
    siteFile = join(dir, 'styles.css');
  });

  it('reports no collisions when site file declares unrelated variables', () => {
    writeFileSync(siteFile, ':root { --legacy-brand: blue; }');
    const { collisions } = findCollisions([tokenDir], siteFile);
    expect(collisions).toEqual([]);
  });

  it('reports a collision when the site file redeclares a global token variable', () => {
    writeFileSync(siteFile, ':root { --color-primary: blue; }');
    const { collisions, tokenVarSources } = findCollisions([tokenDir], siteFile);
    expect(collisions).toEqual(['--color-primary']);
    expect(tokenVarSources.get('--color-primary')).toBe(join(tokenDir, 'branding.css'));
  });

  it('ignores token directories that do not exist', () => {
    writeFileSync(siteFile, ':root { --color-primary: blue; }');
    const { collisions } = findCollisions([join(tokenDir, 'does-not-exist')], siteFile);
    expect(collisions).toEqual([]);
  });
});
