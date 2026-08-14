/**
 * Novelties block — a horizontal, scroll-snapping row of watch cards with
 * prev/next controls, matching the "Our 2026 Novelties" carousel on the AP
 * home page.
 *
 * Cards for the "Our 2026 Novelties" instance are sourced live from the
 * Brand Experience API (see NOVELTIES_API_URL below) instead of authored
 * content. This is gated to that specific section (see isApiDriven()) so
 * other pages/sections reusing this same block name with authored rows
 * (e.g. "Our Services") keep rendering their authored content unchanged.
 *
 * NOTE: NOVELTIES_API_URL currently points at a pre-prod ("-test") host
 * that sits behind Cloudflare Access. A plain fetch() cannot supply the
 * CF_Authorization cookie Access requires (browsers block scripts from
 * setting a Cookie header, and it's a short-lived per-user SSO token that
 * must never be hardcoded/committed here). `credentials: 'include'` is set
 * so that if the browser already holds a valid Access session cookie for
 * this domain, it's sent automatically; otherwise the request is rejected
 * by Access and we fall back to MOCK_ITEMS below. Swap in a public,
 * non-gated endpoint here once one exists.
 *
 * Content model (per authored card row, non-API instances only):
 *   col 1: image (picture)
 *   col 2: heading (watch name), body copy, and a "Discover more" link
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

const NOVELTIES_API_URL = 'https://brand-experience-api-test.audemarspiguet.com/public/products/catalogs/novelties?page=1&limit=15';
const NOVELTIES_API_KEY = ''; // use from placeholders

// Fallback data, same shape as the real API response's `_embedded.items`,
// used whenever the live call fails (blocked by Cloudflare Access, offline,
// unexpected payload, etc.) so the carousel still renders something.
const MOCK_ITEMS = [
  {
    title: 'Mini Quartz',
    description: 'Showcasing a new interplay of materials, this timepiece highlights the beauty of white mother-of-pearl, accented by luminescent hour-markers. The refined contrasts and delicate textures deepen the connection between jewellery and watchmaking.',
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguetdamqual/RO_67630BA-OO-1312BA-03_SDT.RO_67630BA-OO-1312BA-03_SDT-web?fmt=png-alpha&dpr=off',
    collection: 'Royal Oak',
    commercialReference: '67630BA.OO.1312BA.03-B',
  },
  {
    title: 'Selfwinding',
    description: 'Radiating light and luminosity, this timepiece features a silver-toned dial and a new brown calfskin strap, expressing fluidity and warmth in a refined design.',
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguetdamqual/CODE_77410OR-OO-A127CR-01_SDT.CODE_77410OR-OO-A134CR-01_SDT-web?fmt=png-alpha&dpr=off',
    collection: 'Code 11.59 by Audemars Piguet',
    commercialReference: '77410OR.OO.A127CR.01',
  },
  {
    title: '"Jumbo" Extra-Thin Openworked',
    description: 'Presented in titanium with BMG accents, the original “Jumbo” model features a refined monochromatic design enhanced by intricate openworking, offering a captivating view of Calibre 7124.',
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguetdamqual/RO_16204XT-OO-1240XT-01_SDT.RO_16204XT-OO-1240XT-01_SDT-web?fmt=png-alpha&dpr=off',
    collection: 'Royal Oak',
    commercialReference: '16204XT.OO.1240XT.01',
  },
  {
    title: 'Selfwinding',
    description: 'Blending the radiance of yellow gold with the unique beauty of natural malachite, this model celebrates the artistry of stone dials - making each watch a singular expression of elegance and craftsmanship.',
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguetdamqual/RO_15513BA-OO-1320BA-01_SDT.RO_15513BA-OO-1320BA-01_SDT-web?fmt=png-alpha&dpr=off',
    collection: 'Royal Oak',
    commercialReference: '15513BA.OO.1320BA.01',
  },
  {
    title: 'Ultra-complication Universal Calendar',
    description: "Bridging centuries of astronomical observation, technical mastery and craftsmanship, the 150 Heritage combines all the Manufacture's savoir-faire in an ultra-complicated pocket watch powered by Calibre 1150 and complemented by the Universal Calendar – a groundbreaking lunisolar mechanism housed within its caseback",
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguetdamqual/150_Heritage_SDT.Pocket-Watch_SDT-web?fmt=png-alpha&dpr=off',
    collection: '150 Heritage',
    commercialReference: '75150PT.OO.01',
  },
  {
    title: 'Selfwinding Diver',
    description: 'This sporty 42 mm reference pairs a deep teal dial with pink gold accents, showcasing the collection’s commitment to creative expression and technical performance.',
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguetdamqual/ROO_15720ST-OO-A403CA-01_SDT.ROO_15720ST-OO-A403CA-01_SDT-web?fmt=png-alpha&dpr=off',
    collection: 'Royal Oak Offshore',
    commercialReference: '15720ST.OO.A403CA.01',
  },
  {
    title: 'Selfwinding Perpetual Calendar',
    description: 'This contemporary reference debuts Calibre 7139, Audemars Piguet’s new openworked perpetual calendar movement. Crafted in titanium with BMG accents, this model features a sapphire dial that reveals the mechanical and technical artistry at its core.',
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguetdamqual/RO_26685XT-OO-1320XT-01_SDT.RO_26685XT-OO-1320XT-01_SDT-web?fmt=png-alpha&dpr=off',
    collection: 'Royal Oak',
    commercialReference: '26685XT.OO.1320XT.01',
  },
  {
    title: 'Jumping Hour',
    description: 'Inspired by the Streamline design movement, this refined watch debuts Audemars Piguet’s first selfwinding jumping hour movement, Calibre 7122. Its rectangular case in pink gold and sapphire blends horological innovation with vintage aesthetics, while the newly developed strap motif embodies the creative spirit that defines the Manufacture.',
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguetdamqual/NF_15245OR-OO-A206VE-01_SDT.NF_15245OR-OO-D206VE-01_SDT-web?fmt=png-alpha&dpr=off',
    collection: 'Neo Frame',
    commercialReference: '15245OR.OO.A206VE.01',
  },
  {
    title: 'Perpetual Calendar Openworked',
    description: 'Debuting Calibre 7139, this Perpetual Calendar combines openworked artistry with a harmonious, legible display. The sapphire dial reveals the movement’s refined architecture, marking a new chapter for the collection.',
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguetdamqual/CODE_26443NB-OO-D002CR-01_SDT.CODE_26443NB-OO-D002CR-01_SDT-web?fmt=png-alpha&dpr=off',
    collection: 'Code 11.59 by Audemars Piguet',
    commercialReference: '26443NB.OO.D002CR.01',
  },
  {
    title: 'Selfwinding Chronograph',
    description: 'Showcasing material innovation, this 43 mm Chronograph pairs a titanium case with a black ceramic bezel and a smoked green Méga Tapisserie dial, bringing new colour and technical sophistication to the collection.',
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguetdamqual/ROO_26420SO-OO-A029VE-01_SDT-web-1?fmt=png-alpha&dpr=off',
    collection: 'Royal Oak Offshore',
    commercialReference: '26420CD.OO.A029VE.01',
  },
  {
    title: 'Selfwinding Perpetual Calendar',
    description: 'Combining refined aesthetics with technical mastery, this 41 mm Perpetual Calendar is crafted entirely in "Bleu Nuit, Nuage 50" ceramic and powered by Calibre 7138. The innovative "all-in-one" crown adjustment system and harmonious Grande Tapisserie dial bring together cutting-edge technology and traditional hand-finishing, reflecting Audemars Piguet’s uncompromising pursuit of excellence.',
    image: 'https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguetdamqual/RO_26674CD-OO-1225CD-01_SDT.RO_26674CD-OO-1225CD-01_SDT-web?fmt=png-alpha&dpr=off',
    collection: 'Royal Oak',
    commercialReference: '26674CD.OO.1225CD.01',
  },
];

/**
 * "Royal Oak Offshore" -> "royal-oak-offshore", "Neo Frame" -> "neo-frame".
 */
function slugifyCollection(collection) {
  return collection.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Builds the product detail URL for a novelty item, or null if there isn't
 * enough data to build one.
 */
function buildProductUrl({ collection, commercialReference }) {
  if (!collection || !commercialReference) return null;
  return `https://www.audemarspiguet.com/en/watch-collection/${slugifyCollection(collection)}/${commercialReference}`;
}

/**
 * Fetches the live novelties feed, falling back to MOCK_ITEMS on any
 * failure (network error, non-2xx, CORS/Access rejection, bad payload).
 */
async function fetchNovelties() {
  try {
    const resp = await fetch(NOVELTIES_API_URL, {
      credentials: 'include',
      headers: {
        'x-api-key': NOVELTIES_API_KEY,
        Accept: 'application/json',
        'Content-Language': document.documentElement.lang || 'en',
      },
    });
    if (!resp.ok) throw new Error(`novelties API responded ${resp.status}`);
    const data = await resp.json();
    // eslint-disable-next-line no-underscore-dangle -- HAL response field name
    const items = data?._embedded?.items;
    if (!Array.isArray(items) || items.length === 0) throw new Error('novelties API returned no items');
    return items;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[novelties] live API unavailable, using mock data:', err);
    return MOCK_ITEMS;
  }
}

/** Builds a single <li class="novelties-card"> from an API item. */
function buildApiCard(item) {
  const li = document.createElement('li');
  li.className = 'novelties-card';

  const imageCol = document.createElement('div');
  imageCol.className = 'novelties-card-image';
  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title || '';
    img.loading = 'lazy';
    imageCol.append(img);
  }
  li.append(imageCol);

  const body = document.createElement('div');
  body.className = 'novelties-card-body';

  const heading = document.createElement('h3');
  heading.textContent = [item.collection, item.title].filter(Boolean).join(' ');
  body.append(heading);

  if (item.description) {
    const p = document.createElement('p');
    p.textContent = item.description;
    body.append(p);
  }

  const url = buildProductUrl(item);
  if (url) {
    const cta = document.createElement('a');
    cta.href = url;
    cta.className = 'button novelties-cta';
    cta.textContent = 'Discover more';
    body.append(cta);
  }

  li.append(body);
  return li;
}

/** Builds a single <li class="novelties-card"> from an authored row. */
function buildAuthoredCard(row) {
  const li = document.createElement('li');
  li.className = 'novelties-card';
  const cols = [...row.children];
  cols.forEach((col) => {
    if (col.querySelector('picture')) {
      col.className = 'novelties-card-image';
      const img = col.querySelector('img');
      if (img) {
        img.closest('picture').replaceWith(
          createOptimizedPicture(img.src, img.alt, false, [{ width: '500' }]),
        );
      }
    } else {
      col.className = 'novelties-card-body';
      col.querySelectorAll('a').forEach((a) => a.classList.add('novelties-cta'));
    }
    li.append(col);
  });
  return li;
}

/**
 * True only for the "Our 2026 Novelties" section (identified by its
 * heading id, which the authoring tool assigns from the heading text).
 * Other sections reusing this same block name with authored content (e.g.
 * "Our Services") fall through and keep their authored rows untouched.
 *
 * TODO: replace this with a proper block variant (e.g. author the block as
 * "Novelties (api)") once that's wired up in content — matching on heading
 * id is a stopgap that breaks if the heading copy changes.
 */
function isApiDriven(block) {
  const heading = block.closest('.section')?.querySelector('h1, h2');
  return heading?.id === 'our-2026-novelties';
}

export default function decorate(block) {
  const authoredRows = [...block.children];
  const apiDriven = isApiDriven(block);

  const track = document.createElement('ul');
  track.className = 'novelties-track';

  if (apiDriven) {
    fetchNovelties().then((items) => {
      items.forEach((item) => track.append(buildApiCard(item)));
    });
  } else {
    authoredRows.forEach((row) => track.append(buildAuthoredCard(row)));
  }

  block.replaceChildren(track);

  // Prev/next controls.
  const nav = document.createElement('div');
  nav.className = 'novelties-nav';
  nav.innerHTML = `
    <button type="button" class="novelties-prev" aria-label="Previous" disabled></button>
    <button type="button" class="novelties-next" aria-label="Next"></button>
  `;
  block.append(nav);

  const prev = nav.querySelector('.novelties-prev');
  const next = nav.querySelector('.novelties-next');

  const scrollByCard = (dir) => {
    const card = track.querySelector('.novelties-card');
    const step = card ? card.getBoundingClientRect().width + 10 : 300;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };
  prev.addEventListener('click', () => scrollByCard(-1));
  next.addEventListener('click', () => scrollByCard(1));

  // Toggle control disabled state at the track ends. Driven by a
  // ResizeObserver (rather than a single call at decoration time) so the
  // disabled state is correct once card widths have actually settled --
  // e.g. after the block CSS finishes loading, images load, cards arrive
  // asynchronously from the API, or the viewport crosses a breakpoint.
  const updateNav = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= maxScroll;
  };
  track.addEventListener('scroll', updateNav, { passive: true });
  new ResizeObserver(updateNav).observe(track);
}
