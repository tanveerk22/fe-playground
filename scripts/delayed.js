// add delayed functionality here

// Google Tag Manager (GTM-NGNW85W)
// Loaded from the delayed phase (~3s after LCP) to keep it off the critical path.
// CSP note: script-src in head.html already allows `https:`, so googletagmanager.com
// is permitted without a headers.yaml change.
(function initGTM() {
  const GTM_ID = 'GTM-NGNW85W';

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
}());
