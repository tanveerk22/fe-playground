import { describe, it, expect } from 'vitest';
import decorate from '../../../blocks/token-showcase/token-showcase.js';

describe('token-showcase decorate', () => {
  it('replaces block content with four sections', () => {
    const block = document.createElement('div');
    block.innerHTML = '<div>ignored authored content</div>';

    decorate(block);

    const sections = block.querySelectorAll('.token-showcase-section');
    expect(sections).toHaveLength(4);
    expect(block.textContent).not.toContain('ignored authored content');
  });

  it('renders a swatch for every palette color', () => {
    const block = document.createElement('div');
    decorate(block);

    const swatches = block.querySelectorAll('.token-showcase-swatch');
    expect(swatches).toHaveLength(7);
    expect(swatches[0].textContent).toContain('black');
  });

  it('renders a row for every spacing step', () => {
    const block = document.createElement('div');
    decorate(block);

    const rows = block.querySelectorAll('.token-showcase-spacing-row');
    expect(rows).toHaveLength(12);
  });

  it('renders primary and secondary button samples', () => {
    const block = document.createElement('div');
    decorate(block);

    expect(block.querySelector('.ap-button-primary--normal').textContent).toBe('Primary CTA');
    expect(block.querySelector('.ap-button-secondary--normal').textContent).toBe('Secondary CTA');
  });
});
