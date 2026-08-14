import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Teaser block.
 *
 * Content model (two rows):
 *   Row 1: image (picture)
 *   Row 2: text content — heading, body copy, and a CTA link
 *
 * Variants (added as classes on the block):
 *   editorial       full-bleed image with text overlaid (default look)
 *   editorial-dark  editorial on a dark surface with light text
 *   split           image and text side by side (image left by default;
 *                   add `image-right` to flip)
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Identify the image row and the content row.
  let imageRow;
  let contentRow;
  rows.forEach((row) => {
    if (!imageRow && row.querySelector('picture')) {
      imageRow = row;
    } else if (!contentRow) {
      contentRow = row;
    }
  });

  if (imageRow) {
    imageRow.classList.add('teaser-image');
    // Optimize the picture; eager only if the block is flagged above the fold.
    const img = imageRow.querySelector('picture > img');
    if (img) {
      const eager = block.classList.contains('eager');
      const optimized = createOptimizedPicture(
        img.src,
        img.alt,
        eager,
        [{ width: '2000' }],
      );
      img.closest('picture').replaceWith(optimized);
    }
  }

  if (contentRow) {
    contentRow.classList.add('teaser-content');
    // Mark the CTA link as a teaser CTA for styling hooks.
    contentRow.querySelectorAll('a').forEach((a) => a.classList.add('teaser-cta'));
  }
}
