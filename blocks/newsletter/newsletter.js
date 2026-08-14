/**
 * Newsletter block — "Get the Latest News" signup band for the AP home
 * page. Light surface, 3-part layout: heading + body copy grouped on the
 * left (grows to fill available width), a solid subscribe button pinned
 * to the right (fixed-ish width, never shrinks below its content).
 *
 * Content model (single cell): heading, body copy, then a paragraph
 * holding the subscribe link. Restructured here into
 * `.newsletter-content` (heading + body) and `.newsletter-button` (the
 * CTA) so they can sit side by side.
 */
export default function decorate(block) {
  const heading = block.querySelector('h1, h2, h3');
  const cta = block.querySelector('a');
  const paragraphs = [...block.querySelectorAll('p')].filter((p) => !p.querySelector('a'));

  const content = document.createElement('div');
  content.className = 'newsletter-content';
  if (heading) content.append(heading);
  paragraphs.forEach((p) => content.append(p));

  const button = document.createElement('div');
  button.className = 'newsletter-button';
  if (cta) {
    cta.classList.add('newsletter-cta');
    button.append(cta);
  }

  block.replaceChildren(content, button);
}
