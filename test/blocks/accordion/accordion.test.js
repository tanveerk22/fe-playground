import { describe, it, expect } from 'vitest';
import decorate from '../../../blocks/accordion/accordion.js';

function buildBlock(pairs) {
  const block = document.createElement('div');
  pairs.forEach(([q, a]) => {
    const row = document.createElement('div');
    const qCell = document.createElement('div');
    qCell.textContent = q;
    const aCell = document.createElement('div');
    aCell.textContent = a;
    row.append(qCell, aCell);
    block.append(row);
  });
  return block;
}

describe('accordion decorate', () => {
  it('builds a header button and content pane per row', () => {
    const block = buildBlock([['Question 1', 'Answer 1']]);
    decorate(block);

    const btn = block.querySelector('.accordion-header');
    const content = block.querySelector('.accordion-content');
    expect(btn.querySelector('span').textContent).toBe('Question 1');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(content.textContent).toBe('Answer 1');
  });

  it('skips rows missing a question or answer cell', () => {
    const block = document.createElement('div');
    const row = document.createElement('div');
    const onlyCell = document.createElement('div');
    onlyCell.textContent = 'Only one cell';
    row.append(onlyCell);
    block.append(row);

    decorate(block);
    expect(block.querySelector('.accordion-header')).toBeNull();
  });

  it('expands a header on click', () => {
    const block = buildBlock([['Q1', 'A1']]);
    decorate(block);
    const btn = block.querySelector('.accordion-header');

    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('collapses an already-expanded header on a second click', () => {
    const block = buildBlock([['Q1', 'A1']]);
    decorate(block);
    const btn = block.querySelector('.accordion-header');

    btn.click();
    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes other open items when a new one is opened', () => {
    const block = buildBlock([['Q1', 'A1'], ['Q2', 'A2']]);
    decorate(block);
    const [btn1, btn2] = block.querySelectorAll('.accordion-header');

    btn1.click();
    expect(btn1.getAttribute('aria-expanded')).toBe('true');

    btn2.click();
    expect(btn1.getAttribute('aria-expanded')).toBe('false');
    expect(btn2.getAttribute('aria-expanded')).toBe('true');
  });

  it('ignores clicks outside of a header button', () => {
    const block = buildBlock([['Q1', 'A1']]);
    decorate(block);
    const content = block.querySelector('.accordion-content');

    content.click();
    expect(block.querySelector('.accordion-header').getAttribute('aria-expanded')).toBe('false');
  });
});
