/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: UPS About site cleanup.
 * Removes non-authorable content (header, footer, nav, modals, overlays, tracking)
 * and cleans up AEM-specific markup wrappers.
 * All selectors verified against migration-work/cleaned.html from about.ups.com.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove language selector modal (blocks page interaction)
    // Found: <div class="modal fade upspr-lang-select" id="upspr-language-selector-modal">
    WebImporter.DOMUtils.remove(element, ['#upspr-language-selector-modal']);

    // Remove global forms modal
    // Found: <div id="global-forms" class="modal fade upspr-form-modal">
    WebImporter.DOMUtils.remove(element, ['#global-forms']);

    // Remove overlays that may block content
    // Found: <div class="upspr-overlay"> and <div class="upspr-overlay-global">
    WebImporter.DOMUtils.remove(element, ['.upspr-overlay', '.upspr-overlay-global']);

    // Remove tracking/analytics container
    // Found: <div id="ZN_dpzhr48CPI7BKES">
    WebImporter.DOMUtils.remove(element, ['#ZN_dpzhr48CPI7BKES']);

    // Remove preconnect and preload link tags (non-visual, non-authorable)
    // Found: <link rel="preconnect" href="https://www.google.com">
    // Found: <link href="https://s.go-mpulse.net/boomerang/..." rel="preload" as="script">
    WebImporter.DOMUtils.remove(element, ['link[rel="preconnect"]', 'link[rel="preload"]']);
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove header experience fragment and navigation
    // Found: <div class="cmp-experiencefragment cmp-experiencefragment--upspr-header-fragment">
    // Contains: <header id="upspr-headerWrap">, <nav>, search, etc.
    WebImporter.DOMUtils.remove(element, ['.cmp-experiencefragment--upspr-header-fragment']);

    // Remove footer experience fragment
    // Found: <div class="cmp-experiencefragment cmp-experiencefragment--upspr-footer-fragment">
    // Contains: <footer class="upspr-footer">, social links, legal links, etc.
    WebImporter.DOMUtils.remove(element, ['.cmp-experiencefragment--upspr-footer-fragment']);

    // Fallback: remove header and footer tags directly if not inside experience fragments
    // Found: <header id="upspr-headerWrap"> and <footer class="upspr-footer">
    WebImporter.DOMUtils.remove(element, ['header', 'footer']);

    // Remove remaining navigation containers
    // Found: <div id="uspsr-navContainer">
    WebImporter.DOMUtils.remove(element, ['#uspsr-navContainer']);

    // Remove noscript tags, iframes, and remaining link elements
    WebImporter.DOMUtils.remove(element, ['noscript', 'iframe', 'link']);

    // Remove script tags that may remain
    WebImporter.DOMUtils.remove(element, ['script']);

    // Unwrap web.archive.org links back to their original destination.
    // Source pages sometimes carry Wayback-wrapped hrefs of the form
    // http://web.archive.org/web/<timestamp>/<original-url>. Restore the
    // original URL so links point at the live destination, not the archive.
    element.querySelectorAll('a[href*="web.archive.org/web/"]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const m = href.match(/web\.archive\.org\/web\/[^/]+\/(https?:\/\/.+)$/);
      if (m && m[1]) a.setAttribute('href', m[1]);
    });

    // Clean up analytics data attributes from remaining content elements
    // Found on many elements: data-link-name, data-link-type, data-toggle, data-target, data-attribute
    element.querySelectorAll('[data-link-name]').forEach((el) => {
      el.removeAttribute('data-link-name');
    });
    element.querySelectorAll('[data-link-type]').forEach((el) => {
      el.removeAttribute('data-link-type');
    });
    element.querySelectorAll('[data-toggle]').forEach((el) => {
      el.removeAttribute('data-toggle');
    });
    element.querySelectorAll('[data-target]').forEach((el) => {
      el.removeAttribute('data-target');
    });
    element.querySelectorAll('[data-attribute]').forEach((el) => {
      el.removeAttribute('data-attribute');
    });
  }
}
