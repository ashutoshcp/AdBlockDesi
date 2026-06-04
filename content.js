const SKIP_BUTTON_SELECTORS = [
  'button.ytp-ad-skip-button',
  'button[aria-label*="skip" i]',
  'button[aria-label*="close" i]',
  '[role="button"][aria-label*="skip" i]',
  '[role="button"][aria-label*="close" i]',
  '.videoAdUiSkipButton',
  '.ytp-ad-text-overlay',
  '.vjs-ad-control',
  '.jw-ad-overlay',
  'button[id*=skip]',
  'button[class*=skip][class*=ad]',
  'button[class*=close][class*=ad]'
];

const GENERIC_AD_OVERLAY_SELECTORS = [
  '.ad-container',
  '.ad-overlay',
  '.video-ads',
  '.adbreak',
  '.ad-interrupting',
  '.vjs-ad-overlay',
  '.jw-ad-overlay',
  '.jw-ad',
  '.skip-ad',
  '.ad-layer',
  '.ad-ui'
];

const YOUTUBE_AD_SELECTORS = [
  '.ytp-ad-module',
  '.ytp-ad-player-overlay',
  '.ytp-ad-preview-text',
  '.ad-showing',
  '.ad-interrupting',
  'ytd-player-legacy-desktop-watch-ads-renderer'
];

function isVisible(element) {
  return !!(
    element &&
    element.offsetParent !== null &&
    (element.offsetWidth || element.offsetHeight || element.getClientRects().length)
  );
}

function clickElement(element) {
  if (element && isVisible(element) && typeof element.click === 'function') {
    element.click();
    return true;
  }
  return false;
}

function safeQuerySelectorAll(root, selector) {
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch (error) {
    return [];
  }
}

function safeQuerySelector(root, selector) {
  try {
    return root.querySelector(selector);
  } catch (error) {
    return null;
  }
}

const AD_CONTAINER_SELECTORS = [
  ...GENERIC_AD_OVERLAY_SELECTORS,
  ...YOUTUBE_AD_SELECTORS
];

const SAFER_GLOBAL_SKIP_SELECTORS = [
  'button.ytp-ad-skip-button',
  '.videoAdUiSkipButton',
  '.ytp-ad-text-overlay'
];

function clickSkipButtons() {
  SAFER_GLOBAL_SKIP_SELECTORS.forEach(selector => {
    safeQuerySelectorAll(document, selector).forEach(clickElement);
  });

  const adContainers = Array.from(new Set(
    safeQuerySelectorAll(document, AD_CONTAINER_SELECTORS.join(','))
  ));

  adContainers.forEach(container => {
    safeQuerySelectorAll(container, 'button, a, [role="button"]').forEach(el => {
      const text = (el.innerText || el.getAttribute('aria-label') || '').trim().toLowerCase();
      if (/(skip|close|dismiss|no thanks|continue)/i.test(text) && isVisible(el)) {
        clickElement(el);
      }
    });
  });
}

function hideAdOverlays() {
  AD_CONTAINER_SELECTORS.forEach(selector => {
    safeQuerySelectorAll(document, selector).forEach(el => {
      if (isVisible(el) && !el.closest('video') && !el.closest('.ytp-chrome-controls')) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
      }
    });
  });
}

function usesYouTube() {
  return location.hostname.endsWith('youtube.com');
}

function getYouTubeVideo() {
  return document.querySelector('video');
}

function isYouTubeAdPlaying() {
  return YOUTUBE_AD_SELECTORS.some(selector => {
    const element = safeQuerySelector(document, selector);
    return element && isVisible(element);
  }) || (document.body && document.body.classList.contains('ad-showing'));
}

function isVideoOrAdPage() {
  if (!document.body) {
    return false;
  }

  return Boolean(
    safeQuerySelector(document, 'video') ||
    safeQuerySelector(document, 'iframe[src*="youtube.com"]') ||
    safeQuerySelector(document, 'iframe[src*="vimeo.com"]') ||
    safeQuerySelector(document, GENERIC_AD_OVERLAY_SELECTORS.join(',')) ||
    YOUTUBE_AD_SELECTORS.some(selector => safeQuerySelector(document, selector))
  );
}

function skipYouTubeAds() {
  if (!usesYouTube()) {
    return;
  }

  const video = getYouTubeVideo();
  if (!video || !isFinite(video.duration) || video.ended) {
    return;
  }

  if (isYouTubeAdPlaying()) {
    clickSkipButtons();
    hideAdOverlays();

    if (video.currentTime + 0.5 < video.duration) {
      video.currentTime = Math.max(0, video.duration - 0.1);
    }

    if (video.paused) {
      video.play().catch(() => {});
    }
  }
}

function isAdVideoElement(video) {
  if (!video) {
    return false;
  }

  const adSelectorMatch = video.closest(AD_CONTAINER_SELECTORS.join(','));

  return Boolean(
    /ad|advertisement|promo/i.test(video.className || '') ||
    /ad|advertisement|promo/i.test(video.id || '') ||
    /ad|advertisement|promo/i.test(video.poster || '') ||
    adSelectorMatch
  );
}

function skipGenericVideoAds() {
  document.querySelectorAll('video').forEach(video => {
    if (!video || video.readyState === 0 || video.ended || !isFinite(video.duration)) {
      return;
    }

    if (!isAdVideoElement(video)) {
      return;
    }

    clickSkipButtons();
    hideAdOverlays();

    if (video.currentTime + 0.5 < video.duration) {
      video.currentTime = Math.max(0, video.duration - 0.1);
    }

    video.play().catch(() => {});
  });
}

function processAds() {
  skipYouTubeAds();
  skipGenericVideoAds();
}

let mutationScheduled = false;

function runSkipCycle() {
  if (!isVideoOrAdPage()) {
    return;
  }

  try {
    clickSkipButtons();
    hideAdOverlays();
    skipYouTubeAds();
    skipGenericVideoAds();
  } catch (error) {
    console.error('Ad Skipper:', error);
  }
}

function scheduleSkipCycle() {
  if (mutationScheduled) {
    return;
  }

  mutationScheduled = true;
  requestAnimationFrame(() => {
    mutationScheduled = false;
    runSkipCycle();
  });
}

const observer = new MutationObserver(() => {
  scheduleSkipCycle();
});

observer.observe(document.body || document.documentElement || document, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true
});

runSkipCycle();
setInterval(runSkipCycle, 1400);
window.addEventListener('load', runSkipCycle);

