import {
  describe, it, expect, vi,
} from 'vitest';
import decorate from '../../../blocks/gallery/gallery.js';

function row(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('gallery decorate', () => {
  it('builds a gallery-grid with one li per tile, in authoring order', () => {
    const block = document.createElement('div');
    block.append(
      row('<picture><img src="/a.jpg" alt="A"></picture>'),
      row('<picture><img src="/b.jpg" alt="B"></picture>'),
    );

    decorate(block);

    const items = block.querySelectorAll('.gallery-item');
    expect(items).toHaveLength(2);
    expect(items[0].classList.contains('gallery-item--lead')).toBe(true);
    expect(items[1].classList.contains('gallery-item--portrait1')).toBe(true);
  });

  it('treats a linked .mp4 as the lead tile regardless of its row position', () => {
    const block = document.createElement('div');
    block.append(
      row('<picture><img src="/a.jpg" alt="A"></picture>'),
      row('<p><a href="https://example.com/clip.mp4">clip</a></p>'),
      row('<picture><img src="/b.jpg" alt="B"></picture>'),
    );
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

    decorate(block);

    const items = block.querySelectorAll('.gallery-item');
    expect(items).toHaveLength(3);
    expect(items[0].classList.contains('gallery-item--lead')).toBe(true);
    expect(items[0].querySelector('video')).toBeTruthy();
    // Remaining images fill positions in authoring order (a, then b).
    expect(items[1].querySelector('img').src).toContain('/a.jpg');
    expect(items[2].querySelector('img').src).toContain('/b.jpg');
  });

  it('treats a bare pasted .mp4 URL (no anchor) as a video row too', () => {
    const block = document.createElement('div');
    const videoRow = document.createElement('div');
    videoRow.textContent = 'https://example.com/clip.mp4';
    block.append(videoRow, row('<picture><img src="/a.jpg" alt="A"></picture>'));
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

    decorate(block);

    expect(block.querySelector('.gallery-item--lead video')).toBeTruthy();
  });

  it('caps tiles at the number of available position classes', () => {
    const block = document.createElement('div');
    for (let i = 0; i < 7; i += 1) {
      block.append(row(`<picture><img src="/img${i}.jpg" alt="Image ${i}"></picture>`));
    }

    decorate(block);

    expect(block.querySelectorAll('.gallery-item')).toHaveLength(5);
  });

  it('uses the video row image as the poster frame', () => {
    const block = document.createElement('div');
    block.append(row('<picture><img src="/poster.jpg" alt="Poster"></picture><p><a href="https://example.com/clip.mp4">clip</a></p>'));
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

    decorate(block);

    const video = block.querySelector('video');
    expect(video.poster).toContain('/poster.jpg');
  });

  it('toggles play/pause when the video toggle button is clicked', () => {
    const block = document.createElement('div');
    block.append(row('<p><a href="https://example.com/clip.mp4">clip</a></p>'));
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();
    HTMLMediaElement.prototype.play = play;
    HTMLMediaElement.prototype.pause = pause;

    decorate(block);

    const video = block.querySelector('video');
    Object.defineProperty(video, 'paused', { value: true, configurable: true });
    const toggle = block.querySelector('.gallery-video-toggle');

    toggle.click();
    expect(play).toHaveBeenCalled();

    Object.defineProperty(video, 'paused', { value: false, configurable: true });
    toggle.click();
    expect(pause).toHaveBeenCalled();
  });
});
