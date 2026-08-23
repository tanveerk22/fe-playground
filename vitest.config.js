// eslint-disable-next-line import/no-unresolved -- resolved via vitest's package exports at runtime
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    // test/e2e/**.spec.js are Playwright tests (run via `npx playwright
    // test`), not Vitest tests — exclude them from Vitest's own discovery,
    // alongside Vitest's usual defaults (overridden since we set this key).
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**', 'test/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'blocks/**/*.js',
        'scripts/*.js',
        'tools/scripts/**/*.mjs',
      ],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.js',
        'scripts/vendor/**',
        // Core EDS framework code shipped by the aem-boilerplate template,
        // not app-level business logic — exercised via the E2E homepage
        // journey instead (real page-boot flow) rather than jsdom mocks.
        'scripts/aem.js',
        'scripts/scripts.js',
        // Complex, heavily browser-runtime-dependent nav logic (matchMedia,
        // resize, MutationObserver). Per the project's testing philosophy,
        // decoration/DOM-event wiring like this belongs in browser/E2E tests,
        // not jsdom unit tests. See docs/testing-coverage-notes.md.
        'blocks/header/header.js',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
});
