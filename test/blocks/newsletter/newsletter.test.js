import { describe, it, expect } from 'vitest';
import decorate from '../../../blocks/newsletter/newsletter.js';

describe('newsletter decorate', () => {
  it('groups heading and body copy into newsletter-content', () => {
    const block = document.createElement('div');
    block.innerHTML = '<h2>Get the Latest News</h2><p>Be the first to know.</p><p><a href="/subscribe">Subscribe</a></p>';

    decorate(block);

    const content = block.querySelector('.newsletter-content');
    expect(content.querySelector('h2')).toBeTruthy();
    expect(content.querySelectorAll('p')).toHaveLength(1);
  });

  it('moves the CTA link into newsletter-button and tags it as newsletter-cta', () => {
    const block = document.createElement('div');
    block.innerHTML = '<h2>Heading</h2><p><a href="/subscribe">Subscribe</a></p>';

    decorate(block);

    const button = block.querySelector('.newsletter-button');
    const cta = button.querySelector('a.newsletter-cta');
    expect(cta).toBeTruthy();
    expect(cta.getAttribute('href')).toBe('/subscribe');
  });

  it('handles missing heading or CTA gracefully', () => {
    const block = document.createElement('div');
    block.innerHTML = '<p>Just some text</p>';

    expect(() => decorate(block)).not.toThrow();
    expect(block.querySelector('.newsletter-content').textContent).toContain('Just some text');
    expect(block.querySelector('.newsletter-button').children).toHaveLength(0);
  });
});
