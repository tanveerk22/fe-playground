import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';

const decorateMain = vi.fn();
const loadSections = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../scripts/scripts.js', () => ({ decorateMain }));
vi.mock('../../../scripts/aem.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, loadSections };
});

const { loadFragment, default: decorate } = await import('../../../blocks/fragment/fragment.js');

describe('loadFragment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns null for a path that does not start with /', () => loadFragment('fragments/foo').then((result) => {
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  }));

  it('returns null when the fetch response is not ok', async () => {
    fetch.mockResolvedValue({ ok: false });
    const result = await loadFragment('/fragments/foo');
    expect(result).toBeNull();
  });

  it('fetches the .plain.html variant of the path', async () => {
    fetch.mockResolvedValue({ ok: true, text: async () => '<div>content</div>' });
    await loadFragment('/fragments/foo');
    expect(fetch).toHaveBeenCalledWith('/fragments/foo.plain.html');
  });

  it('builds a main element from the response and decorates it', async () => {
    fetch.mockResolvedValue({ ok: true, text: async () => '<div class="section">content</div>' });
    const main = await loadFragment('/fragments/foo');

    expect(main.tagName).toBe('MAIN');
    expect(main.querySelector('.section').textContent).toBe('content');
    expect(decorateMain).toHaveBeenCalledWith(main);
    expect(loadSections).toHaveBeenCalledWith(main);
  });

  it('rewrites relative media_ image src attributes to be fragment-relative', async () => {
    fetch.mockResolvedValue({
      ok: true,
      text: async () => '<img src="./media_123.png">',
    });
    const main = await loadFragment('/fragments/foo');
    expect(main.querySelector('img').src).toBe(`${window.location.origin}/fragments/media_123.png`);
  });
});

describe('fragment decorate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('resolves the fragment path from a link href when present', async () => {
    fetch.mockResolvedValue({ ok: true, text: async () => '<div class="section">frag</div>' });
    const block = document.createElement('div');
    block.className = 'fragment';
    block.innerHTML = '<a href="/fragments/foo">foo</a>';
    const section = document.createElement('div');
    section.className = 'section';
    section.append(block);
    document.body.append(section);

    await decorate(block);

    expect(fetch).toHaveBeenCalledWith('/fragments/foo.plain.html');
    section.remove();
  });

  it('falls back to the block text content when there is no link', async () => {
    fetch.mockResolvedValue({ ok: true, text: async () => '<div class="section">frag</div>' });
    const block = document.createElement('div');
    block.className = 'fragment';
    block.textContent = '/fragments/bar';
    const section = document.createElement('div');
    section.className = 'section';
    section.append(block);
    document.body.append(section);

    await decorate(block);

    expect(fetch).toHaveBeenCalledWith('/fragments/bar.plain.html');
    section.remove();
  });

  it('does nothing when the fragment fails to load', async () => {
    fetch.mockResolvedValue({ ok: false });
    const block = document.createElement('div');
    block.className = 'fragment';
    block.textContent = '/fragments/missing';
    const section = document.createElement('div');
    section.className = 'section';
    section.append(block);
    document.body.append(section);

    await expect(decorate(block)).resolves.not.toThrow();
    expect(section.contains(block)).toBe(true);
    section.remove();
  });
});
