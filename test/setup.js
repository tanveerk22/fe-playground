// Shared jsdom polyfills for browser APIs the blocks rely on that jsdom
// doesn't implement itself.

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

function ResizeObserver() {
  this.observe = () => {};
  this.unobserve = () => {};
  this.disconnect = () => {};
}

if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;
}
