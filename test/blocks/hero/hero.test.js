import {
  describe, it, expect, vi,
} from 'vitest';
import decorate from '../../../blocks/hero/hero.js';

describe('hero decorate', () => {
  it('adds hero-cta class to links', () => {
    const block = document.createElement('div');
    block.innerHTML = '<h1>Title</h1><p><a href="/discover">Discover</a></p>';

    decorate(block);

    expect(block.querySelector('a').classList.contains('hero-cta')).toBe(true);
  });

  it('adds hero-with-content when both a picture and h1 are present', () => {
    const block = document.createElement('div');
    block.innerHTML = '<picture><img src="/a.jpg"></picture><h1>Title</h1>';

    decorate(block);

    expect(block.classList.contains('hero-with-content')).toBe(true);
  });

  it('does not add hero-with-content when there is no h1', () => {
    const block = document.createElement('div');
    block.innerHTML = '<picture><img src="/a.jpg"></picture>';

    decorate(block);

    expect(block.classList.contains('hero-with-content')).toBe(false);
  });

  it('marks non-image, non-CTA paragraphs as hero-subtitle', () => {
    const block = document.createElement('div');
    block.innerHTML = '<h1>Title</h1><p>Subtitle copy</p><p><a href="/discover">Discover</a></p>';

    decorate(block);

    const [subtitle] = block.querySelectorAll('p');
    expect(subtitle.classList.contains('hero-subtitle')).toBe(true);
  });

  it('does not mark an empty paragraph as hero-subtitle', () => {
    const block = document.createElement('div');
    block.innerHTML = '<h1>Title</h1><p>   </p>';

    decorate(block);

    const p = block.querySelector('p');
    expect(p.classList.contains('hero-subtitle')).toBe(false);
  });

  describe('video background', () => {
    function buildVideoBlock() {
      const block = document.createElement('div');
      block.innerHTML = `
        <picture><img src="/poster.jpg" alt="Poster"></picture>
        <h1>Title</h1>
        <p><a href="https://example.com/clip.mp4">clip.mp4</a></p>
      `;
      return block;
    }

    it('replaces the picture with an autoplaying muted looping video', () => {
      const block = buildVideoBlock();
      HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

      decorate(block);

      const video = block.querySelector('video.hero-video');
      expect(video).toBeTruthy();
      expect(video.hasAttribute('muted')).toBe(true);
      expect(video.hasAttribute('autoplay')).toBe(true);
      expect(video.hasAttribute('loop')).toBe(true);
      expect(video.querySelector('source').src).toBe('https://example.com/clip.mp4');
      expect(block.querySelector('picture')).toBeNull();
    });

    it('removes the paragraph that held the video link but keeps other copy', () => {
      const block = buildVideoBlock();
      const bodyP = document.createElement('p');
      bodyP.textContent = 'Body copy';
      block.append(bodyP);
      HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

      decorate(block);

      expect([...block.querySelectorAll('p')].some((p) => p.textContent === 'clip.mp4')).toBe(false);
      expect([...block.querySelectorAll('p')].some((p) => p.textContent === 'Body copy')).toBe(true);
    });

    it('does nothing when no video link is present', () => {
      const block = document.createElement('div');
      block.innerHTML = '<picture><img src="/poster.jpg"></picture><h1>Title</h1>';

      decorate(block);

      expect(block.querySelector('video')).toBeNull();
      expect(block.querySelector('picture')).toBeTruthy();
    });

    it('builds a video with no poster when there is no image', () => {
      const block = document.createElement('div');
      block.innerHTML = '<h1>Title</h1><p><a href="https://example.com/clip.mp4">clip.mp4</a></p>';
      HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

      decorate(block);

      expect(block.querySelector('video').poster).toBe('');
    });

    it('removes a bare video link with no wrapping paragraph', () => {
      const block = document.createElement('div');
      block.innerHTML = '<h1>Title</h1><a href="https://example.com/clip.mp4">clip.mp4</a>';
      HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);

      decorate(block);

      expect(block.querySelector('a[href$=".mp4"]')).toBeNull();
      expect(block.querySelector('h1')).toBeTruthy();
    });
  });
});
