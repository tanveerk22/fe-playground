import { describe, it, expect } from 'vitest';
import decorate from '../../../blocks/teaser/teaser.js';

function buildBlock({ withImage = true, withContent = true, eager = false } = {}) {
  const block = document.createElement('div');
  if (eager) block.classList.add('eager');

  if (withImage) {
    const imageRow = document.createElement('div');
    imageRow.innerHTML = '<picture><img src="/a.jpg" alt="Alt text"></picture>';
    block.append(imageRow);
  }
  if (withContent) {
    const contentRow = document.createElement('div');
    contentRow.innerHTML = '<h2>Heading</h2><p><a href="/discover">Discover</a></p>';
    block.append(contentRow);
  }
  return block;
}

describe('teaser decorate', () => {
  it('tags the image row as teaser-image and optimizes the picture', () => {
    const block = buildBlock();
    decorate(block);

    const imageRow = block.children[0];
    expect(imageRow.classList.contains('teaser-image')).toBe(true);
    expect(imageRow.querySelector('picture source')).toBeTruthy();
    expect(imageRow.querySelector('picture img').getAttribute('alt')).toBe('Alt text');
  });

  it('tags the content row as teaser-content and CTAs as teaser-cta', () => {
    const block = buildBlock();
    decorate(block);

    const contentRow = block.children[1];
    expect(contentRow.classList.contains('teaser-content')).toBe(true);
    expect(contentRow.querySelector('a').classList.contains('teaser-cta')).toBe(true);
  });

  it('uses eager loading when the block has the eager class', () => {
    const block = buildBlock({ eager: true });
    decorate(block);

    const img = block.querySelector('picture img');
    expect(img.getAttribute('loading')).toBe('eager');
  });

  it('defaults to lazy loading without the eager class', () => {
    const block = buildBlock({ eager: false });
    decorate(block);

    const img = block.querySelector('picture img');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('handles a content-only block (no image row)', () => {
    const block = buildBlock({ withImage: false });
    expect(() => decorate(block)).not.toThrow();
    expect(block.querySelector('.teaser-content')).toBeTruthy();
  });

  it('handles an image-only block (no content row)', () => {
    const block = buildBlock({ withContent: false });
    expect(() => decorate(block)).not.toThrow();
    expect(block.querySelector('.teaser-image')).toBeTruthy();
  });

  it('leaves a picture with no img untouched (does not optimize it)', () => {
    const block = document.createElement('div');
    const imageRow = document.createElement('div');
    imageRow.innerHTML = '<picture></picture>';
    block.append(imageRow);

    expect(() => decorate(block)).not.toThrow();
    expect(block.querySelector('picture').children).toHaveLength(0);
  });

  it('only assigns the first row with a picture as the image row', () => {
    const block = document.createElement('div');
    const imageRow = document.createElement('div');
    imageRow.innerHTML = '<picture><img src="/a.jpg"></picture>';
    const contentRow = document.createElement('div');
    contentRow.innerHTML = '<h2>Heading</h2>';
    const extraRow = document.createElement('div');
    extraRow.innerHTML = '<p>Extra row, ignored for row assignment</p>';
    block.append(imageRow, contentRow, extraRow);

    decorate(block);

    expect(imageRow.classList.contains('teaser-image')).toBe(true);
    expect(contentRow.classList.contains('teaser-content')).toBe(true);
    expect(extraRow.classList.contains('teaser-content')).toBe(false);
  });
});
