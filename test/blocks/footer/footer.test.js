import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';

const loadFragment = vi.fn();

vi.mock('../../../blocks/fragment/fragment.js', () => ({ loadFragment }));

const { default: decorate } = await import('../../../blocks/footer/footer.js');

function fragmentWithSections(sectionsHtml) {
  const fragment = document.createElement('main');
  sectionsHtml.forEach((html) => {
    const section = document.createElement('div');
    section.innerHTML = html;
    fragment.append(section);
  });
  return fragment;
}

describe('footer decorate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when the fragment fails to load', async () => {
    loadFragment.mockResolvedValue(null);
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    expect(block.textContent).toBe('/footer');
  });

  it('bails out when fewer than two sections are present', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections(['<p>only one section</p>']));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    expect(block.querySelector('.footer-content')).toBeNull();
  });

  it('renders partner logos from the first section', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div class="ap-chronicles"><a href="/a">A</a><a href="/b">B</a></div>',
      '<p><a href="/lang">EN</a></p>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    const logos = block.querySelectorAll('.footer-partner-logos > div > a');
    expect(logos).toHaveLength(2);
  });

  it('builds a language button from the second section', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div></div>',
      '<p><a href="https://example.com/fr">Français</a></p>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    const langButton = block.querySelector('.footer-language-button');
    expect(langButton.textContent.trim()).toBe('Français');
  });

  it('builds a nav section with a toggle for each h3 heading', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div></div>',
      '<h3>Watches</h3><ul><li><a href="/watches">All</a></li></ul>'
        + '<h3>Services</h3><ul><li><a href="/services">All</a></li></ul>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    const sections = block.querySelectorAll('.footer-nav-section');
    expect(sections).toHaveLength(2);
    expect(sections[0].querySelector('.footer-nav-title').textContent).toBe('Watches');
  });

  it('toggles a nav section open and closed on click', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div></div>',
      '<h3>Watches</h3><ul><li><a href="/watches">All</a></li></ul>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    const toggle = block.querySelector('.footer-nav-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.classList.contains('active')).toBe(true);

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders an empty bottom section when there is no third section', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div></div>',
      '<p><a href="/lang">EN</a></p>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    expect(block.querySelector('.footer-bottom')).toBeTruthy();
    expect(block.querySelector('.footer-bottom').children).toHaveLength(0);
  });

  it('builds legal links, splitting out the accessibility icon link', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div></div>',
      '<p><a href="/lang">EN</a></p>',
      '<p><a href="/terms">Terms</a> | <a href="/accessibility"><img src="/ea.svg"></a></p>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    const legal = block.querySelector('.footer-legal');
    expect(legal.querySelectorAll('a')).toHaveLength(2);
    expect(legal.querySelector('a[target="_blank"] img.ea-icon')).toBeTruthy();
  });

  it('builds a social links section when multiple icon links are present', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div></div>',
      '<p><a href="/lang">EN</a></p>',
      '<p><a href="/x"><span class="icon icon-twitter-x"></span></a> '
        + '<a href="/ig"><span class="icon icon-instagram"></span></a></p>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    const social = block.querySelector('.footer-social');
    expect(social.querySelectorAll('a')).toHaveLength(2);
    expect(social.querySelector('a[aria-label="twitter-x"]')).toBeTruthy();
  });

  it('renders plain-text paragraphs as copyright lines', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div></div>',
      '<p><a href="/lang">EN</a></p>',
      '<p>ICP number 123</p><p>© 2026 Audemars Piguet</p>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    expect(block.querySelector('.footer-copyright-icp').textContent).toBe('ICP number 123');
    expect(block.querySelector('.footer-copyright-text').textContent).toBe('© 2026 Audemars Piguet');
  });

  it('does not throw when loadFragment rejects', async () => {
    loadFragment.mockRejectedValue(new Error('network error'));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await expect(decorate(block)).resolves.not.toThrow();
  });

  it('navigates on language button click without throwing', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div></div>',
      '<p><a href="/lang">Français</a></p>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    expect(() => block.querySelector('.footer-language-button').click()).not.toThrow();
  });

  it('skips past non-UL content between a heading and its submenu list', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div></div>',
      '<h3>Watches</h3><p>A short description</p><ul><li><a href="/watches">All</a></li></ul>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    const content = block.querySelector('.footer-nav-content');
    expect(content.querySelector('ul li a').textContent).toBe('All');
  });

  it('groups a second accessibility-icon link under an already-created accessibility group', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div></div>',
      '<p><a href="/lang">EN</a></p>',
      '<p>Terms | <a href="/accessibility">Accessibility</a> '
        + '<a href="/ea"><img src="/ea.svg"></a></p>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    const group = block.querySelector('.footer-legal-accessibility-group');
    expect(group).toBeTruthy();
    expect(group.querySelectorAll('a')).toHaveLength(2);
  });

  it('removes an inline img from a social link that also carries an icon span', async () => {
    loadFragment.mockResolvedValue(fragmentWithSections([
      '<div></div>',
      '<p><a href="/lang">EN</a></p>',
      '<p><a href="/x"><span class="icon icon-twitter-x"></span><img src="/x.svg"></a> '
        + '<a href="/ig"><span class="icon icon-instagram"></span></a></p>',
    ]));
    const block = document.createElement('div');
    block.textContent = '/footer';

    await decorate(block);

    const socialLink = block.querySelector('.footer-social a[aria-label="twitter-x"]');
    expect(socialLink.querySelector('img')).toBeNull();
  });
});
