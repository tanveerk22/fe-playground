# AGENTS.md — Audemars Piguet EDS Migration

Context for any agent working on this repo (Audemars Piguet marketing site,
migrating to Adobe Edge Delivery Services). Written from the AP home page
migration (`/ap-home`, branch `migration/ap-home-page`). **Read this before
touching a block.** Extend it — don't fork it — as new pages land.

---

## 0. Hard-won rules (read this section first)

Every rule below caused a real correction during the home page migration —
several more than once. A future agent repeating these wastes a full
review cycle each time.

| # | Always / Never | Why |
|---|---|---|
| 1 | **Never** assume a new section reuses an existing block variant. Inspect the live DOM (class names, `getComputedStyle`) before writing any CSS. | Cost us three full rewrites: "Musée Atelier" looked like `teaser.split` but was actually a 2-column `stacked` layout; "AP Chronicles" looked like `teaser.editorial-dark` (full-bleed hero) but was actually a compact `aside` split; the newsletter band looked like a dark centered CTA but is a light 3-part row. In each case the *component class name on live* (`ap-textimage`, `ap-newsletter`, `ap-lookbook`) told us the true pattern; the visual first-glance did not. |
| 2 | **Always** re-navigate (`page.goto`, full reload) when measuring a component's size at a new viewport — don't just `resize()` and re-measure. | AP's carousel/lookbook libraries compute slide width once on load. Resizing without reloading gave stale, wrong numbers (e.g. gallery tile width read 195px at three different viewports before a fresh reload revealed it was actually 300/197/196px). |
| 3 | **Always** apply a cross-cutting layout fix to every block that needs it, immediately — don't wait to be told per-block. | The `grid-container` gutter inset (20px / 32px / 92.5px, see §2) was fixed for `gallery`, then had to be re-added for `teaser.stacked`, then again for `newsletter` — same omission, three separate corrections. |
| 4 | **Never** infer text casing/emphasis from how a decorative font *looks* in a screenshot. Read `el.textContent` and `getComputedStyle(el).textTransform` directly. | Misread "Revealing Time" as intentionally mixed-case (it's actually `text-transform: uppercase` on already-uppercase source text — Times Now's thin italic just *looks* soft-cased at a glance) and added an incorrect `text-transform: none` override that had to be reverted. |
| 5 | **Never** assume authored row *order* maps to semantic role. Detect content by type (a video URL, an image), not position. | `gallery.js` originally treated "row 1" as the lead/video tile. Real content had the video link as row 3. Fixed by scanning all rows for a video reference first, independent of position, then filling the rest in order. |
| 6 | **Never** commit without being explicitly told to. If asked to undo a commit, use `git reset` (soft/mixed) — never `--hard` — so working-tree edits survive. | Committed once mid-session before being told "we will review, then commit" — had to `git reset HEAD~1` to restore the unstaged state. |
| 7 | **Always** treat a "file modified externally" notice as the new ground truth. Re-read the file; never silently revert someone else's edit. | Applies to both user edits and linter auto-fixes made mid-session (e.g. a stylelint spacing fix, an `object-fit` change) — don't "helpfully" undo them. |
| 8 | **Always** pair `width: 100%` + `padding` with `box-sizing: border-box` on the same rule. | `.teaser-content` overflowed the viewport on mobile by exactly `2 × padding` until `box-sizing: border-box` was added — content-box is the default. |
| 9 | **Always** re-audit inherited rules when changing a container to `display: flex`/`grid`. | The sitewide `main > .section > div { margin: auto }` only centers horizontally in normal flow — but once a section became a flex row (for the `teaser.stacked` 2-column layout), the same rule's vertical `auto` margins activated and silently *centered* the shorter column instead of top-aligning it. |
| 10 | **Always** assign CSS `font` *shorthand* design tokens (e.g. `--font-secondary-display-sm`) to the `font` property, never `font-family`. | `font-family: var(--font-secondary-display-sm)` is a syntactically invalid declaration (the value has weight/style/size/line-height baked in) and is silently dropped — the italic accent falls back to whatever the next-most-specific rule provides, with no error. Grep for this exact mistake before reusing any `--font-*` shorthand token. |
| 11 | **Always** make video-URL detection regex tolerate a `#` fragment, not just `?` or end-of-string. | AP's CDN video links consistently end `...mp4#t=0.001`. `/\.mp4($|\?)/` misses them; use `/\.mp4($|[?#])/`. Bug existed in both `hero.js` and `gallery.js`. |
| 12 | **Always** delete temporary screenshots and `.playwright-mcp/` after a verification pass. | Debug artifacts (`*.png` in repo root) were created dozens of times this session for visual comparison — `rm -f *.png && rm -rf .playwright-mcp` after every check, before reporting back. |
| 13 | **Before** diagnosing a "regression" a user reports from a DA/Sidekick preview, check `git log`/`git status` on localhost first. | The Sidekick "Development" preview only reflects **committed and pushed** code. Twice, a reported bug ("images misaligned," "white background") turned out to already be fixed locally — the preview was just running an older commit. Don't re-fix what isn't broken; confirm the preview is stale before touching code. |

---

## 1. Project overview

- **Client:** Audemars Piguet (AP) — swiss luxury watches.
- **Migration target:** Adobe Edge Delivery Services (EDS), from an existing Vue/Foundation-based marketing site.
- **Live reference (source of truth):** `https://www.audemarspiguet.com/en/home`
- **This repo, page in progress:** `/ap-home`, branch `migration/ap-home-page`.
- **Remotes:**
  - `origin` → `git@github.com:aemdemos/audemarspiguet.git` (primary; push here by default).
  - `adobebarbalata` → `git@github.com:adobebarbalata/audemarspiguet.git` (used once to open a PR — `migration/ap-home-page` → `ap_poc` — against the client-side POC repo; **TBD** whether every future page also gets pushed here or this was a one-off).
- **Local dev:** `aem up` (aem-cli). Verify with `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ap-home` before touching anything.
- **Lint gate:** `npm run lint` (`eslint` + `stylelint`) must be clean before considering any change done.

### Migration workflow (live-site-as-source-of-truth)

For every block, in this order:

1. **Locate the live component.** Use Playwright to find the heading/text, then walk `.closest()`/`parentElement` up the DOM to find the actual component wrapper class (`ap-textimage`, `ap-lookbook`, `ap-newsletter`, `ap-carousel`, `ap-dualtext`, …). This class name is the ground truth for which pattern you're building — see Rule 1.
2. **Measure, don't guess.** Pull real `getBoundingClientRect()` / `getComputedStyle()` numbers at each target viewport (fresh `goto()` per viewport — Rule 2) for: layout (flex/grid columns, gaps), spacing/insets, font sizes, colors, aspect ratios.
3. **Map every measured value to an existing token first** (§2). Only hardcode a literal px/percent value when nothing in `styles/styles.css` or `styles/tokens/**` matches, and comment *why* it's a one-off live measurement.
4. **Implement in the block's own CSS/JS** (§3, §4), scoped to the block class.
5. **Verify on localhost** at 390px / 768px / 1024px / 1440px (and 1920px if the block has an upper breakpoint) with fresh navigations, screenshot, then delete the screenshot (Rule 12).
6. **Lint clean.** `npm run lint`.
7. Do **not** commit unless explicitly told to (Rule 6).

---

## 2. Design tokens

Two layers exist — **always check both** before hardcoding anything:

- **`styles/styles.css`** — the main stylesheet's `:root` block. Contains the AP-specific aliases actually used throughout the blocks in this migration:

  ```css
  --ap-black: var(--color-palette-black, #000);
  --ap-white: var(--color-palette-white, #fff);
  --ap-dark-bg: var(--color-palette-black, rgb(0 0 0));
  --ap-light-bg: rgb(248 248 248);
  --background-color: #000;   /* sitewide default is DARK */
  --text-color: #fff;

  --spacing-s: 16px;
  --spacing-m: 24px;
  --spacing-l: 32px;
  --spacing-xxl: 64px;

  --heading-font-size-xxl: 48px;   /* == --heading-font-size-xl, both 48px */
  --heading-text-transform: uppercase;
  --heading-letter-spacing: -0.56px;
  --heading-font-weight: 100;

  --link-color: #fff;
  --link-hover-color: rgb(255 255 255 / 70%);
  --link-font-size: 14px;
  --link-font-weight: 500;
  --link-letter-spacing: 0.21px;

  --legacy-font-secondary-display-sm: "Times Now", "Times New Roman", serif;
  ```

  **Important:** the sitewide default is a **dark theme** (`--background-color: #000`, `--text-color: #fff`). Don't add `color: var(--ap-white)` defensively everywhere — but *do* add it explicitly on any block that overlays text on its own dark surface, so it's correct if that block is ever reused on a light section.

- **`styles/tokens/`** — the synced client design-token system (Figma → tokens pipeline). Structure:
  - `styles/tokens/core/spacing.css`, `styles/tokens/core/typography.css` — core scales.
  - `styles/tokens/branding/default.css` — brand-level primitives, e.g. `--font-family-secondary: 'Times Now', serif;`.
  - `styles/tokens/component/{category}/{component}/{variant}.css` — per-component tokens (e.g. `component/data-display/lookbook/basic.css`, `component/input/button/primary.css`).
  - `--font-secondary-display-sm`, `-title-md/-lg`, `-headline-md/-lg`, `-display-lg/-xl` in `core/typography.css` are **`font` shorthand tokens** — weight + style + size + line-height + family in one declaration, redefined at internal media-query breakpoints:
    ```css
    --font-secondary-display-sm: 250 italic 2.4rem / 0.83 var(--font-family-secondary);
    /* redefined inside its own @media blocks up to 3.2rem at wider breakpoints */
    ```
    Assign these to `font`, never `font-family` (Rule 10).

**Rule:** always try to express a live-measured value as an existing token (`var(--spacing-l, 32px)` etc.) before writing a literal. When live genuinely uses a one-off value with no token match (e.g. the `92.5px` desktop gutter, the `13.7% / 21.8% / 14.5% / 36.3% / 13.7%` split in `teaser.aside`), hardcode it but comment that it's a directly-measured live value, not a design-system constant.

---

## 3. CSS conventions

- **One stylesheet per block:** `/blocks/{name}/{name}.css`, loaded automatically by the EDS block loader. Never leak block-specific selectors into `styles/styles.css`.
- **Scope every selector to the block's own class**, e.g. `.novelties .novelties-card`, `.gallery .gallery-item--lead`, `.teaser.stacked .teaser-content`. Never write a bare tag or attribute selector that could match another block.
- **Variants are additional classes**, authored in DA as `BlockName (variant[, modifier])` — e.g. `Gallery (center)`, `Teaser (stacked)`, `Teaser (aside, image-right)` — which EDS turns into `class="gallery center"`, `class="teaser stacked"`, `class="teaser aside image-right"`. Write CSS as `.gallery.center`, `.teaser.aside.image-right`, etc. Default variant (no modifier) should match the *most common* live case for that pattern.
- **Full-bleed pattern** — scope to the block's presence, not a section-metadata style name (which requires per-section authoring and is easy to forget):
  ```css
  main > .section:has(> .gallery-wrapper) {
    margin: 0;
    background-color: var(--ap-dark-bg, #131313);
  }
  main > .section:has(> .gallery-wrapper) > div {
    max-width: unset;
    margin: 0;
    padding: 0 20px;             /* < 768px */
  }
  @media (width >= 768px) {
    main > .section:has(> .gallery-wrapper) > div { padding: 0 32px; }
  }
  @media (width >= 1440px) {
    main > .section:has(> .gallery-wrapper) > div { padding: 0 92.5px; }
  }
  ```
  This exact 20px / 32px / 92.5px gutter is AP's live `grid-container` inset, confirmed across `gallery`, `teaser` (stacked pair), and `newsletter`. **Any new full-bleed-background-but-inset-content block should use these same three numbers** unless you've re-measured live and found otherwise.
- **Breakpoints used** (mix of this project's own convention and AP's live Foundation-grid breakpoints):
  - `< 768px` — mobile.
  - `768–1023px` — tablet.
  - `≥ 1024px` — desktop / Foundation's "large" (this is where AP's own components switch from stacked to row layouts — confirmed for the `teaser.stacked` pair and the newsletter row).
  - `≥ 1440px` — wide desktop (wider gutter only; no layout changes observed at this tier).
- **Known lint gotcha:** `stylelint`'s `no-descending-specificity` fires often when a block-scoped heading override (e.g. `.novelties-container h2`) is declared near a more specific one (`.novelties .novelties-card-body h2`). Fix by lowering the offending selector's specificity (drop an unnecessary parent class) rather than reordering rules; use `/* stylelint-disable-next-line no-descending-specificity */` only when the specificity is intentional and reordering isn't possible.
- **`box-sizing: border-box`** is not inherited automatically — set it explicitly on any element combining `width: 100%` with `padding` (Rule 8).

---

## 4. Block authoring conventions

- **File pair:** `/blocks/{name}/{name}.js` (default-exported `decorate(block)`) + `/blocks/{name}/{name}.css`. Optional `/blocks/{name}/README.md` documenting the content model for authors.
- **`decorate()` pattern used throughout this migration:**
  ```js
  export default function decorate(block) {
    const grid = document.createElement('ul');
    grid.className = 'gallery-grid';
    [...block.children].forEach((row) => { /* classify + build */ });
    block.replaceChildren(grid);
  }
  ```
  Re-use authored elements (images, links) where possible instead of cloning; build new wrapper structure around them.
- **Classify rows by content, not position** (Rule 5): check for `row.querySelector('img')`, a video-URL match, etc. — never `rows[0]` assumptions.
- **Images:** authored/EDS-hosted images go through `createOptimizedPicture` from `../../scripts/aem.js`. **Third-party CDN images** (e.g. `dynamicmedia.audemarspiguet.com` product photography returned by the novelties API) must **not** be run through `createOptimizedPicture` — its width/format query params are meaningless to a non-Helix origin. Build a plain `<img>` instead.
- **Video convention** (used in `gallery.js`, `hero.js`):
  ```js
  const VIDEO_HREF_RE = /\.mp4($|[?#])|\/is\/content\//i; // Rule 11
  // match either a real <a href> OR bare pasted text — authoring tools
  // don't always auto-linkify a pasted URL:
  const link = [...row.querySelectorAll('a')].find((a) => VIDEO_HREF_RE.test(a.href));
  const text = row.textContent.trim();
  const videoHref = link?.href ?? (VIDEO_HREF_RE.test(text) ? text : null);
  ```
  Set `muted`/`autoplay`/`loop`/`playsinline` as literal **attributes** (`video.setAttribute('muted', '')`), not just properties — browsers only honor autoplay that way. Retry `video.play()` on `canplay` in case the initial call was deferred.
- **Play/pause toggles:** reflect state via a `.is-paused` class plus `aria-pressed` / `aria-label` updates on the `play`/`pause` video events — don't drive the icon purely off click handlers, since autoplay can start/stop outside of user interaction.
- **Layout-driven state (e.g. carousel nav disabled/enabled) must use `ResizeObserver`, not a single calculation at decoration time** — a one-shot check can run before CSS/images settle, computing a wrong `scrollWidth`/`clientWidth` and never re-running.
- **API-driven content** (the "Our 2026 Novelties" instance only, in `novelties.js`):
  - Gate strictly to that one instance (checked via the section's heading `id`) so the *same* block reused elsewhere with authored content (e.g. "Our Services") is unaffected.
  - Always provide a `MOCK_ITEMS` fallback in the same shape as the real API response, used on any fetch failure (network error, non-2xx, CORS/Access rejection, bad payload).
  - Never hardcode a session cookie / bearer token in source — `fetch()` can't set a `Cookie` header from JS anyway (browser-forbidden). Use `credentials: 'include'` so a real browser session cookie is sent automatically if present, and rely on the mock fallback otherwise.
  - Build the CTA URL from a slug rule when the API doesn't return one directly — confirmed pattern for novelties: `https://www.audemarspiguet.com/en/watch-collection/{collection.toLowerCase().replace(/\s+/g, '-')}/{commercialReference}`.

---

## 5. Adobe plugin skills

Installed via the `adobe-skills` marketplace, plugin `aem-edge-delivery-services@adobe-skills` (project-scoped in `.claude/settings.json`, not global — keep it that way unless the team wants it everywhere):

- **`content-driven-development`** — the top-level orchestrator. Invoke this first for any new block or block-modification work; it sequences the steps below.
- **`building-blocks`** — the actual implementation step (JS decoration + CSS), invoked by CDD. This is what we leaned on most.

**Available but under-used this session — lean on these more for the next page:**
- `analyze-and-plan` — requirements/acceptance-criteria step; we mostly skipped this and went straight to live-DOM inspection, which worked but caused some of the Rule 1 rework (a quick "what does live actually do" pass up front would have caught the `stacked`/`aside`/newsletter mismatches sooner).
- `content-modeling` — for genuinely new content shapes (skipped since most blocks already existed; **do** use it for any block that doesn't exist yet).
- `find-test-content` — for locating existing authored content before creating new drafts.
- `testing-blocks` — browser/lint testing step; we did the equivalent manually via Playwright + `npm run lint` every time, which satisfies the same gate.
- `code-review` — self-review before PR; not run explicitly this session (**TBD** — recommend running it before the next PR).

---

## 6. Quality gates enforced

- **Lint:** `npm run lint` (eslint + stylelint) clean before calling anything done — enforced after literally every edit in this migration.
- **Responsiveness:** every block verified at **390px** (mobile), **768px** and **1024px** (tablet tiers), **1440px** (desktop), and **1920px** for anything with a wide-desktop-specific tier — always via a fresh `page.goto()` per size (Rule 2), never resize-only.
- **Visual parity:** screenshot comparison against the live URL at each breakpoint; artifact deleted after (Rule 12).
- **Accessibility touches applied:** `aria-pressed`/`aria-label` kept in sync with actual video play state; `alt` text preserved from authored images; heading levels preserved as authored (no skipped levels introduced by decoration).
- **Performance touches applied:** `createOptimizedPicture` for EDS-hosted images; muted/attribute-based autoplay (no JS-forced playback loops); `ResizeObserver` instead of polling; no third-party image ever re-processed through the Helix image pipeline.
- **Not exercised this session (TBD for next page):** Lighthouse/PSI scoring, and the CDD skill's `code-review` step. Both are called out in the CDD workflow docs; worth actually running before the next PR.

---

## 7. Home page (`/ap-home`) — blocks built, in page order

| Section (live heading) | Block | Variant | Notes |
|---|---|---|---|
| (multi-slide hero) | `hero` | — | Pre-existing; only touched the video-URL regex (Rule 11). |
| "Our 2026 novelties" | `novelties` | — | **API-driven** (this instance only) from the Brand Experience API; mock fallback. |
| "Yoon & Verbal Revealing Time" | `teaser` | `editorial` | Text-only dark statement. |
| (lookbook mosaic) | `gallery` | default (lead-left) | Video lead tile + 4 images, staggered 5-tile grid. |
| "Crafting time since 1875" | `teaser` | `editorial` | Same pattern as Yoon & Verbal. |
| (lookbook mosaic) | `gallery` | `center` | Same block, lead tile in the middle 2 columns instead of the left 2. |
| "Musée Atelier Audemars Piguet" + "Watchmaking Experiences" | `teaser` ×2 (same section) | `stacked` | 2-column row ≥1024px (image-top/text-below per column), collapses to stacked full-width below that. |
| "AP Chronicles" | `teaser` | `aside`, `image-right` | Narrow text beside a boxed (non-full-bleed) image. |
| "Our Services" | `novelties` | — | Same block/class as the API-driven carousel, but **authored, not API-driven** — confirms the instance-gating in Rule/§4 works. |
| "Find a boutique" | `teaser` | `aside` (default = image-left) | Same pattern as AP Chronicles, mirrored. |
| "Get the Latest News" | `newsletter` | — | Light 3-part row (heading + copy + solid black button) — was previously built as a dark centered band; corrected. |
| (footer) | `footer` | — | Pre-existing, untouched. |

### Open questions (genuinely unresolved)

- **No production novelties API endpoint.** `NOVELTIES_API_URL` still points at `brand-experience-api-test.audemarspiguet.com`, which is behind Cloudflare Access *and* has no `Access-Control-Allow-Origin` for this site's origin — blocked by CORS regardless of auth. Need either a public endpoint or a server-side proxy before this can work for real visitors.
- **`NOVELTIES_API_KEY` is blanked** (`''`) in the committed code with a `// use from placeholders` comment — no secrets-management approach has been decided for where the real key should live.
- **Yoon & Verbal gallery image swap** — one of its four images ("Yoon and Verbal brand campaign") appeared to have been replaced by a duplicate-looking "Lifestyle shoot of a Royal Oak Concept watch" during content editing. Flagged once to the user; never confirmed whether intentional.
- **`gallery-video-toggle` / video `object-fit`** — currently `none` (shows a native-scale crop of the video frame) rather than `cover` (full composed shot scaled to fill). This was changed outside the assistant's edits and never explicitly confirmed as final; revisit if the lead video tile looks oddly zoomed.
- **Dual-remote push** (`origin` + `adobebarbalata`, PR against `ap_poc`) — done once for this page. Whether this is the standing process for every future page, or was specific to handing off the home page, is unconfirmed.
- **Newsletter vertical padding** — live measures `140px` top / `180px` bottom at ≥1440px; implemented as a reasonable approximation rather than pixel-matched at every intermediate breakpoint. Fine for now; revisit if it's flagged.

---

## Extending this document

When a new page starts producing its own repeated corrections or new
token/pattern discoveries, add them here rather than starting a new file —
keep one rulebook per repo. If §0 grows past ~20 rules, consider splitting
recurring *workflow* rules into a dedicated skill and keeping only
repo-specific facts (tokens, breakpoints, block table) in this file.
