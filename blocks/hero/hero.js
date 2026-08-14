// Turn a link that points at a video file into an autoplaying, muted,
// looping background video (used by the AP home page hero slides). The
// poster image, if authored alongside, stays as the pre-roll/fallback.
function decorateVideoBackground(block) {
  const videoLink = [...block.querySelectorAll('a')].find((a) => /\.mp4($|[?#])|\/is\/content\//i.test(a.href));
  if (!videoLink) return;

  const video = document.createElement('video');
  video.className = 'hero-video';
  // Set the muted/autoplay/loop/playsinline ATTRIBUTES (not just the
  // properties). Browsers only honour autoplay when the literal `muted`
  // attribute is present in the markup; the property alone is not enough.
  video.muted = true;
  video.defaultMuted = true;
  ['muted', 'autoplay', 'loop', 'playsinline'].forEach((attr) => video.setAttribute(attr, ''));
  video.setAttribute('preload', 'auto');
  // Use the authored image as the video's poster (pre-roll / fallback frame),
  // then remove the <picture> element entirely — left in the DOM it renders
  // on top of the video and is constrained to the content width, hiding the
  // full-bleed video underneath.
  const poster = block.querySelector('img');
  if (poster) video.poster = poster.src;
  block.querySelector('picture')?.remove();

  const source = document.createElement('source');
  source.src = videoLink.href;
  source.type = 'video/mp4';
  video.append(source);

  // Place the video as the first child so it sits behind the content.
  block.prepend(video);
  // Remove only the paragraph that held the authoring link — keep the
  // heading, body and CTA that share the content cell.
  (videoLink.closest('p') || videoLink).remove();

  // Kick off playback once metadata is ready; retry on canplay. Autoplay can
  // still be deferred by the browser until the muted video is ready to render.
  const tryPlay = () => { video.play?.().catch(() => {}); };
  tryPlay();
  video.addEventListener('canplay', tryPlay, { once: true });
}

export default function decorate(block) {
  decorateVideoBackground(block);

  // Mark any CTA link so it can be styled as a hero call-to-action.
  block.querySelectorAll('a').forEach((a) => a.classList.add('hero-cta'));

  const picture = block.querySelector('picture');
  const h1 = block.querySelector('h1');
  if (picture && h1) {
    block.classList.add('hero-with-content');
  }

  // Style the body copy (any paragraph that isn't the image or the CTA) as a
  // hero subtitle. Each hero owns its own content — no borrowing across blocks.
  block.querySelectorAll('p').forEach((p) => {
    if (p.querySelector('picture, a')) return;
    if (p.textContent.trim()) p.classList.add('hero-subtitle');
  });
}
