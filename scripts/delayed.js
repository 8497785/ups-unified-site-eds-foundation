/**
 * Loads third-party analytics and tracking scripts.
 * These load 3+ seconds after page load to avoid impacting Core Web Vitals.
 */

function loadScript(src, attrs = {}) {
  const script = document.createElement('script');
  script.src = src;
  Object.entries(attrs).forEach(([key, value]) => {
    script.setAttribute(key, value);
  });
  document.head.append(script);
  return script;
}

function buildDataLayer() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);

  window.utag_data = {
    page_country_code: parts[0] || 'us',
    page_language: parts[1] || 'en',
    page_id: path.replace(/^\//, ''),
    site_area: parts[2] || 'home',
    site_sub_area: parts[2] || 'home',
    brand_name: 'stories.ups.com',
    new_page_name: `about:${parts.join(':')}`,
    clean_URL: window.location.href,
    tealium_event: 'view',
  };
}

function loadOneTrust() {
  const script = loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js');
  script.setAttribute('data-domain-script', 'cff9470e-ab7d-4e8a-8a45-14391b299f19');
}

function loadTealium() {
  buildDataLayer();
  loadScript('https://tags.tiqcdn.com/utag/ups/ups-stories/prod/utag.js', { async: '' });
}

loadOneTrust();
loadTealium();
