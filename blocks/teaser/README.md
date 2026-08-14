# Teaser

A reusable editorial teaser: an image paired with a heading, body copy and a
call-to-action link. Used across the Audemars Piguet home page for the
"Crafting time since 1875", "AP Houses", "Musée Atelier", "Watchmaking
Experiences", "AP Chronicles" and "Find a Boutique" sections, and for the
anniversary-banner and newsletter-signup fragments.

## Content model

| teaser (variant)        |
| ----------------------- |
| ![image](image-url)     |
| Heading, body, CTA link |

- **Row 1** — the image (rendered as a full-bleed background for the editorial
  variants, or as a side panel for `split`).
- **Row 2** — the text content: a heading (use `_italic_` for the Times Now
  serif emphasis), one or more body paragraphs, and a link that becomes the CTA.

## Variants

- `teaser` (default / **editorial**) — full-bleed image with text overlaid.
- `teaser (editorial-dark)` — editorial on a dark surface with light text.
- `teaser (split)` — image and text side by side; image is on the left by
  default. Add `image-right` to place the image on the right.
- `teaser (eager)` — hints the block is above the fold so its image loads eager
  with `fetchpriority="high"` (use on the first/hero-adjacent teaser only).

## Styling

All colours, spacing, typography and transitions reference the runtime design
tokens declared in `styles/styles.css`. No values are hardcoded. Includes a
375px mobile breakpoint.
