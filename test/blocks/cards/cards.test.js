import { describe, it, expect } from 'vitest';
import decorate from '../../../blocks/cards/cards.js';

function buildBlock(rows) {
  const block = document.createElement('div');
  rows.forEach((cells) => {
    const row = document.createElement('div');
    cells.forEach((html) => {
      const cell = document.createElement('div');
      cell.innerHTML = html;
      row.append(cell);
    });
    block.append(row);
  });
  return block;
}

describe('cards decorate', () => {
  it('converts rows into a ul > li structure', () => {
    const block = buildBlock([
      ['<picture><img src="/a.jpg" alt="A"></picture>', '<p>Body</p>'],
    ]);
    decorate(block);

    const ul = block.querySelector('ul');
    expect(ul).toBeTruthy();
    expect(ul.children).toHaveLength(1);
    expect(ul.children[0].tagName).toBe('LI');
  });

  it('classifies image-only cells as cards-card-image and others as cards-card-body', () => {
    const block = buildBlock([
      ['<picture><img src="/a.jpg" alt="A"></picture>', '<p>Body</p>'],
    ]);
    decorate(block);

    const li = block.querySelector('li');
    const [imageDiv, bodyDiv] = li.children;
    expect(imageDiv.className).toBe('cards-card-image');
    expect(bodyDiv.className).toBe('cards-card-body');
  });

  it('optimizes images inside picture elements', () => {
    const block = buildBlock([
      ['<picture><img src="/a.jpg" alt="A"></picture>', '<p>Body</p>'],
    ]);
    decorate(block);

    const picture = block.querySelector('picture');
    expect(picture).toBeTruthy();
    expect(picture.querySelector('source')).toBeTruthy();
    expect(picture.querySelector('img').getAttribute('alt')).toBe('A');
  });

  it('handles multiple rows', () => {
    const block = buildBlock([
      ['<picture><img src="/a.jpg" alt="A"></picture>', '<p>One</p>'],
      ['<picture><img src="/b.jpg" alt="B"></picture>', '<p>Two</p>'],
    ]);
    decorate(block);

    expect(block.querySelectorAll('li')).toHaveLength(2);
  });
});
