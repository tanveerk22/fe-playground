import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Gallery block — a full-bleed image/video mosaic (used under the Yoon &
 * Verbal "Revealing Time" section on the AP home page).
 *
 * Content model (up to 5 rows, any order):
 *   One row:   a reference to an .mp4 file — either a real link or a bare
 *              pasted URL (some authoring tools don't auto-linkify a
 *              pasted URL, so both are supported), alone or alongside an
 *              image in the same row (used as the poster frame if
 *              present). Wherever this row falls in the table, it always
 *              becomes the lead tile — video is a single, special tile,
 *              not just "whichever one is authored first".
 *   Other rows: image, one per tile, filling the remaining named grid
 *              areas (see gallery.css) in authoring order.
 * Fewer than 5 tiles total (video + images) is fine; unused areas simply
 * stay empty.
 */
const VIDEO_HREF_RE = /\.mp4($|[?#])|\/is\/content\//i;
const POSITION_CLASSES = [
  'gallery-item--lead',
  'gallery-item--portrait1',
  'gallery-item--landscape1',
  'gallery-item--landscape2',
  'gallery-item--portrait2',
];

/** Builds an autoplaying/looping muted video with a play/pause toggle. */
function buildVideoMedia(videoHref, img) {
  const wrapper = document.createElement('div');
  wrapper.className = 'gallery-media gallery-media--video';

  const video = document.createElement('video');
  // Set the ATTRIBUTES (not just properties) — browsers only honour
  // autoplay when `muted` is a literal attribute in the markup.
  video.muted = true;
  video.defaultMuted = true;
  ['muted', 'autoplay', 'loop', 'playsinline'].forEach((attr) => video.setAttribute(attr, ''));
  video.setAttribute('preload', 'auto');
  if (img) video.poster = img.src;

  const source = document.createElement('source');
  source.src = videoHref;
  source.type = 'video/mp4';
  video.append(source);

  const label = img?.alt || 'video';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'gallery-video-toggle';
  toggle.setAttribute('aria-pressed', 'true');
  toggle.setAttribute('aria-label', `Pause ${label}`);

  toggle.addEventListener('click', () => {
    if (video.paused) video.play?.().catch(() => {});
    else video.pause();
  });

  video.addEventListener('play', () => {
    toggle.classList.remove('is-paused');
    toggle.setAttribute('aria-pressed', 'true');
    toggle.setAttribute('aria-label', `Pause ${label}`);
  });
  video.addEventListener('pause', () => {
    toggle.classList.add('is-paused');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', `Play ${label}`);
  });

  wrapper.append(video, toggle);

  const tryPlay = () => { video.play?.().catch(() => {}); };
  tryPlay();
  video.addEventListener('canplay', tryPlay, { once: true });

  return wrapper;
}

/** Builds a plain optimized picture for an image-only tile. */
function buildImageMedia(img) {
  return createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]);
}

/**
 * Finds a video URL authored in a row, either as a real link or as a bare
 * pasted URL that wasn't auto-linkified into an <a>.
 */
function findVideoHref(row) {
  const link = [...row.querySelectorAll('a')].find((a) => VIDEO_HREF_RE.test(a.href));
  if (link) return link.href;
  const text = row.textContent.trim();
  return VIDEO_HREF_RE.test(text) ? text : null;
}

export default function decorate(block) {
  const rows = [...block.children];

  // The video (if any) is always the lead tile, regardless of where its
  // row falls in the table — find it first, then fill the rest from the
  // remaining rows' images, in authoring order.
  const videoRowIndex = rows.findIndex((row) => findVideoHref(row));
  const videoRow = videoRowIndex === -1 ? null : rows[videoRowIndex];

  const tiles = [];
  if (videoRow) tiles.push(buildVideoMedia(findVideoHref(videoRow), videoRow.querySelector('img')));
  rows.forEach((row, i) => {
    if (i === videoRowIndex) return;
    const img = row.querySelector('img');
    if (img) tiles.push(buildImageMedia(img));
  });

  const grid = document.createElement('ul');
  grid.className = 'gallery-grid';
  tiles.slice(0, POSITION_CLASSES.length).forEach((media, i) => {
    const li = document.createElement('li');
    li.className = ['gallery-item', POSITION_CLASSES[i]].filter(Boolean).join(' ');
    li.append(media);
    grid.append(li);
  });

  block.replaceChildren(grid);
}
