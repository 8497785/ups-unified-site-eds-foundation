/*
 * Video Block — shows a video referenced by a link.
 * Adapted from the AEM Block Collection video block
 * (https://github.com/adobe/aem-block-collection/blob/main/blocks/video/video.js),
 * trimmed to the sources this project uses:
 *   - YouTube (youtube.com / youtu.be) -> embedded iframe
 *   - DAM video assets (/content/dam/... .mp4/...) that are published to
 *     Dynamic Media -> Scene7 HTML5 VideoViewer (mirrors the AEM HTL component)
 *   - Any other direct video file / URL -> native <video> element (fallback)
 * Vimeo support has been removed.
 *
 * An optional placeholder image (a <picture> in the block) shows a play button;
 * the embed loads on click, or lazily on scroll (IntersectionObserver) when
 * autoplay is set. Honors prefers-reduced-motion for autoplay.
 */

import { SCENE7, getScene7VideoConfig } from '../../scripts/config.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const VIDEO_EXT_RE = /\.(mp4|webm|ogv|ogg|mov|m4v|m3u8)(?:$|\?)/i;

// Monotonic id for Scene7 viewer containers (the viewer needs a unique DOM id).
let s7ContainerSeq = 0;

// Load Adobe's s7viewers VideoViewer.js once; resolves when window.s7viewers
// is available. Subsequent calls reuse the same in-flight/loaded promise.
let s7ViewerPromise;
function loadScene7Viewer() {
  if (window.s7viewers) return Promise.resolve(window.s7viewers);
  if (s7ViewerPromise) return s7ViewerPromise;
  s7ViewerPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCENE7.viewerScript;
    script.async = true;
    script.addEventListener('load', () => resolve(window.s7viewers));
    script.addEventListener('error', reject);
    document.head.append(script);
  });
  return s7ViewerPromise;
}

// 'youtube' for YouTube links; 'dm' for DAM video assets served via Dynamic
// Media (Scene7 viewer); else 'video' (direct file / URL -> native <video>).
function getVideoSource(link) {
  if (link.includes('youtube') || link.includes('youtu.be')) return 'youtube';
  if (link.includes('/content/dam/') && VIDEO_EXT_RE.test(link)) return 'dm';
  return 'video';
}

function getVideoTypeLabel(source) {
  if (source === 'youtube') return 'YouTube video';
  return 'video';
}

// Render an Adobe Scene7 HTML5 VideoViewer for a DAM asset published to
// Dynamic Media. Mirrors the AEM HTL component: derive the asset id from the
// file name and init s7viewers.VideoViewer with the configured server URLs.
async function embedDynamicMedia(block, link) {
  const cfg = getScene7VideoConfig(link);
  if (!cfg) return false;

  s7ContainerSeq += 1;
  const containerId = `video-s7-${s7ContainerSeq}`;
  const container = document.createElement('div');
  container.id = containerId;
  container.className = 'video-dm-viewer';
  block.append(container);

  try {
    const s7viewers = await loadScene7Viewer();
    if (!s7viewers || !s7viewers.VideoViewer) return false;
    const viewer = new s7viewers.VideoViewer({
      containerId,
      params: {
        asset: cfg.asset,
        serverurl: cfg.serverurl,
        videoserverurl: cfg.videoserverurl,
        contenturl: cfg.contenturl,
      },
    });
    viewer.init();
    block.dataset.embedLoaded = true;
    return true;
  } catch (e) {
    // Viewer library failed to load/init — let caller fall back to native.
    container.remove();
    return false;
  }
}

function embedYoutube(url, autoplay, background) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      mute: background ? '1' : '0',
      controls: background ? '0' : '1',
      disablekb: background ? '1' : '0',
      loop: background ? '1' : '0',
      playsinline: background ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

// Native <video> for a direct file, a DAM asset, or a Dynamic Media video URL.
// The type is inferred from the extension; DM delivery URLs without an obvious
// extension fall back to a generic type so the browser can still negotiate.
function getVideoElement(source, autoplay, background) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  if (autoplay) video.setAttribute('autoplay', '');
  if (background) {
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.removeAttribute('controls');
    video.addEventListener('canplay', () => {
      video.muted = true;
      if (autoplay) video.play();
    });
  }

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  const ext = (source.split('?')[0].split('.').pop() || '').toLowerCase();
  const knownTypes = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogv: 'video/ogg',
    mov: 'video/quicktime',
    m4v: 'video/mp4',
  };
  if (knownTypes[ext]) sourceEl.setAttribute('type', knownTypes[ext]);
  video.append(sourceEl);

  return video;
}

function embedNativeVideo(block, link, autoplay, background) {
  const videoEl = getVideoElement(link, autoplay, background);
  block.append(videoEl);
  videoEl.addEventListener('canplay', () => {
    block.dataset.embedLoaded = true;
  });
}

async function loadVideoEmbed(block, link, autoplay, background) {
  if (block.dataset.embedLoaded === 'true') return;

  const source = getVideoSource(link);
  if (source === 'youtube') {
    const url = new URL(link);
    const embedWrapper = embedYoutube(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
  } else if (source === 'dm') {
    // Dynamic Media: render the Scene7 viewer; fall back to native <video>
    // (using the raw DAM path) if the viewer can't load/init.
    const ok = await embedDynamicMedia(block, link);
    if (!ok) embedNativeVideo(block, link, autoplay, background);
  } else {
    embedNativeVideo(block, link, autoplay, background);
  }
}

// Resolve the video link. A DAM asset is delivered as an anchor (<a href>);
// an external URL is authored in a plain text field and delivered as text.
// Prefer the anchor; otherwise pull the first URL-looking token from the text.
function resolveLink(block) {
  const anchor = block.querySelector('a');
  if (anchor && anchor.href) return anchor.href;
  const text = block.textContent.trim();
  const match = text.match(/https?:\/\/\S+/);
  return match ? match[0] : '';
}

export default async function decorate(block) {
  const placeholder = block.querySelector('picture');
  const link = resolveLink(block);
  if (!link) return; // nothing to play
  block.textContent = '';
  block.dataset.embedLoaded = false;

  const autoplay = block.classList.contains('autoplay');
  if (placeholder) {
    block.classList.add('placeholder');
    const wrapper = document.createElement('div');
    wrapper.className = 'video-placeholder';
    wrapper.append(placeholder);

    if (!autoplay) {
      const source = getVideoSource(link);
      const ariaLabel = `Play ${getVideoTypeLabel(source)}`;
      wrapper.insertAdjacentHTML(
        'beforeend',
        `<div class="video-placeholder-play"><button type="button" title="${ariaLabel}" aria-label="${ariaLabel}"></button></div>`,
      );
      wrapper.addEventListener('click', () => {
        wrapper.remove();
        loadVideoEmbed(block, link, true, false);
      });
    }
    block.append(wrapper);
  }

  if (!placeholder || autoplay) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        const playOnLoad = autoplay && !prefersReducedMotion.matches;
        loadVideoEmbed(block, link, playOnLoad, autoplay);
      }
    });
    observer.observe(block);
  }
}
