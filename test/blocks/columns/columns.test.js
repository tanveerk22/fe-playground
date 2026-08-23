import { describe, it, expect } from 'vitest';
import decorate from '../../../blocks/columns/columns.js';

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

describe('columns decorate', () => {
  it('adds a columns-N-cols class based on the first row width', () => {
    const block = buildBlock([['<p>A</p>', '<p>B</p>', '<p>C</p>']]);
    decorate(block);
    expect(block.classList.contains('columns-3-cols')).toBe(true);
  });

  it('marks a column as columns-img-col when a picture is its only content', () => {
    const block = buildBlock([['<picture><img src="/a.jpg"></picture>', '<p>Text</p>']]);
    decorate(block);

    const cols = block.querySelector('div').children;
    expect(cols[0].classList.contains('columns-img-col')).toBe(true);
    expect(cols[1].classList.contains('columns-img-col')).toBe(false);
  });

  it('does not mark a column as image-only when it has other content alongside the picture', () => {
    const block = document.createElement('div');
    const row = document.createElement('div');
    const col = document.createElement('div');
    col.innerHTML = '<picture><img src="/a.jpg"></picture><p>Caption</p>';
    row.append(col);
    block.append(row);

    decorate(block);
    expect(col.classList.contains('columns-img-col')).toBe(false);
  });
});
