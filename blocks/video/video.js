/*
 * Video Block — shows a video referenced by a link.
 * Adapted from the AEM Block Collection video block
 * (https://github.com/adobe/aem-block-collection/blob/main/blocks/video/video.js),
 * trimmed to the two sources this project uses:
 *   - YouTube (youtube.com / youtu.be) -> embedded iframe
 *   - Direct video files, incl. AEM DAM assets (/content/dam/... .mp4) and
 *     Dynamic Media video delivery URLs -> native <video> element
 * Vimeo support has been removed.
 *
 * An optional placeholder image (a <picture> in the block) shows a play button;
 * the embed loads on click, or lazily on scroll (IntersectionObserver) when
 * autoplay is set. Honors prefers-reduced-motion for autoplay.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// 'youtube' for YouTube links, else 'video' (direct file / DAM / Dynamic Media).
function getVideoSource(link) {
  if (link.includes('youtube') || link.includes('youtu.be')) return 'youtube';
  return 'video';
}

function getVideoTypeLabel(source) {
  return source === 'youtube' ? 'YouTube video' : 'video';
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

function loadVideoEmbed(block, link, autoplay, background) {
  if (block.dataset.embedLoaded === 'true') return;

  const source = getVideoSource(link);
  if (source === 'youtube') {
    const url = new URL(link);
    const embedWrapper = embedYoutube(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
  } else {
    const videoEl = getVideoElement(link, autoplay, background);
    block.append(videoEl);
    videoEl.addEventListener('canplay', () => {
      block.dataset.embedLoaded = true;
    });
  }
}

export default async function decorate(block) {
  const placeholder = block.querySelector('picture');
  const anchor = block.querySelector('a');
  if (!anchor) return; // nothing to play
  const link = anchor.href;
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
