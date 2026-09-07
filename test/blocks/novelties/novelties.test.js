import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import decorate from '../../../blocks/novelties/novelties.js';

function flush() {
  return new Promise((resolve) => { setTimeout(resolve, 0); });
}

function buildAuthoredBlock(rows) {
  const block = document.createElement('div');
  rows.forEach(({ image, body }) => {
    const row = document.createElement('div');
    const imgCol = document.createElement('div');
    imgCol.innerHTML = `<picture><img src="${image}" alt="${body}"></picture>`;
    const bodyCol = document.createElement('div');
    bodyCol.innerHTML = `<h3>${body}</h3><p><a href="/discover">Discover more</a></p>`;
    row.append(imgCol, bodyCol);
    block.append(row);
  });
  return block;
}

function attachToApiDrivenSection(block) {
  const section = document.createElement('div');
  section.className = 'section';
  const heading = document.createElement('h2');
  heading.id = 'our-2026-novelties';
  section.append(heading, block);
  document.body.append(section);
  return section;
}

describe('novelties decorate (authored content)', () => {
  it('builds a track with one card per authored row', () => {
    const block = buildAuthoredBlock([
      { image: '/a.jpg', body: 'Watch A' },
      { image: '/b.jpg', body: 'Watch B' },
    ]);

    decorate(block);

    const cards = block.querySelectorAll('.novelties-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('h3').textContent).toBe('Watch A');
  });

  it('classifies image and body columns and tags CTAs', () => {
    const block = buildAuthoredBlock([{ image: '/a.jpg', body: 'Watch A' }]);

    decorate(block);

    const card = block.querySelector('.novelties-card');
    expect(card.querySelector('.novelties-card-image')).toBeTruthy();
    expect(card.querySelector('.novelties-card-body')).toBeTruthy();
    expect(card.querySelector('a').classList.contains('novelties-cta')).toBe(true);
  });

  it('renders prev/next controls with prev disabled initially', () => {
    const block = buildAuthoredBlock([{ image: '/a.jpg', body: 'Watch A' }]);

    decorate(block);

    expect(block.querySelector('.novelties-prev').disabled).toBe(true);
    expect(block.querySelector('.novelties-next')).toBeTruthy();
  });

  it('scrolls the track when next is clicked', () => {
    const block = buildAuthoredBlock([{ image: '/a.jpg', body: 'Watch A' }]);
    decorate(block);
    const track = block.querySelector('.novelties-track');
    track.scrollBy = vi.fn();

    block.querySelector('.novelties-next').click();

    // jsdom's getBoundingClientRect() reports width 0, so the step is just
    // the fixed 10px gap added on top of the (zero) card width.
    expect(track.scrollBy).toHaveBeenCalledWith({ left: 10, behavior: 'smooth' });
  });
});

describe('novelties decorate (API-driven "Our 2026 Novelties" section)', () => {
  let section;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    section?.remove();
  });

  it('renders cards from the live API response', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        _embedded: {
          items: [
            {
              title: 'Mini Quartz', image: '/mq.jpg', collection: 'Royal Oak', commercialReference: '123',
            },
          ],
        },
      }),
    });
    const block = document.createElement('div');
    section = attachToApiDrivenSection(block);

    decorate(block);
    await flush();

    const cards = block.querySelectorAll('.novelties-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].querySelector('h3').textContent).toBe('Royal Oak Mini Quartz');
  });

  it('falls back to mock items when the API call fails', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500 });
    const block = document.createElement('div');
    section = attachToApiDrivenSection(block);

    decorate(block);
    await flush();

    const cards = block.querySelectorAll('.novelties-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('falls back to mock items when the API returns no items', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ _embedded: { items: [] } }) });
    const block = document.createElement('div');
    section = attachToApiDrivenSection(block);

    decorate(block);
    await flush();

    expect(block.querySelectorAll('.novelties-card').length).toBeGreaterThan(0);
  });

  it('omits the CTA link when a card is missing collection/reference data', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ _embedded: { items: [{ title: 'No Link Item' }] } }),
    });
    const block = document.createElement('div');
    section = attachToApiDrivenSection(block);

    decorate(block);
    await flush();

    const card = block.querySelector('.novelties-card');
    expect(card.querySelector('a.novelties-cta')).toBeNull();
  });
});
