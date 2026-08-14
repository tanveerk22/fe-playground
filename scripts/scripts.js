import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  // Skip auto-blocking when the page already authors an explicit hero block
  // (e.g. the AP home page). Otherwise the auto-blocker would tear the first
  // picture + h1 out of the authored hero and orphan its body copy.
  if (main.querySelector('.hero')) return;
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto block `*/fragments/*` references
    const fragments = main.querySelectorAll('a[href*="/fragments/"]');
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(frag.firstElementChild);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Creates wrappers around adjacent h2s and accordions.
 * @param {Element} main The main element
 */
function createWrapper(main) {
  const sections = main.querySelectorAll('.section');

  sections.forEach((section) => {
    const children = Array.from(section.children);
    let wrapper = null;
    let wrapperInserted = false;

    children.forEach((child) => {
      let isH2 = false;
      let isAccordion = false;
      let h2Element = null;
      let isDefaultWrapper = false;

      // Check if child is H2 or contains H2 in default-content-wrapper
      if (child.tagName === 'H2') {
        isH2 = true;
        h2Element = child;
      } else if (child.classList.contains('default-content-wrapper')) {
        isDefaultWrapper = true;
        const h2 = child.querySelector('h2');
        if (h2) {
          isH2 = true;
          h2Element = h2;
        }
      }

      // Check if accordion
      if (child.classList.contains('accordion-wrapper')) {
        isAccordion = true;
      }

      if (isH2 || isAccordion) {
        if (!wrapper) {
          wrapper = document.createElement('div');
          wrapper.className = 'faq-wrapper';
          wrapperInserted = false;
        }

        // If h2 is inside default-content-wrapper, extract it and insert wrapper after
        if (h2Element && isDefaultWrapper) {
          wrapper.appendChild(h2Element);
          if (!wrapperInserted) {
            section.insertBefore(wrapper, child.nextSibling);
            wrapperInserted = true;
          }
        } else {
          // For bare h2 or accordion
          if (!wrapperInserted) {
            section.insertBefore(wrapper, child);
            wrapperInserted = true;
          }
          wrapper.appendChild(child);
        }
      } else {
        wrapper = null;
        wrapperInserted = false;
      }
    });
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);

    // Create FAQ wrappers if page has both 'legal' and 'faq' classes
    if (document.body.classList.contains('legal') && document.body.classList.contains('faq')) {
      createWrapper(main);
    }
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
