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
  '.advertisement',
  '.video-ads',
  '.adbreak',
  '.ad-block',
  '.ad-area',
  '.ad-interrupting',
  '.vjs-ad-overlay',
  '.vast-ad',
  '.jw-ad',
  '.skip-ad',
  '[data-ad]',
  '[data-ads]',
  '[data-advertisement]',
  '[aria-label*="advertisement" i]'
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

function clickSkipButtons() {
  SKIP_BUTTON_SELECTORS.forEach(selector => {
    document.querySelectorAll(selector).forEach(clickElement);
  });

  document.querySelectorAll('button, a, [role="button"]').forEach(el => {
    const text = (el.innerText || el.getAttribute('aria-label') || '').trim().toLowerCase();
    if (/(skip|close|dismiss|no thanks|continue)/i.test(text) && isVisible(el)) {
      clickElement(el);
    }
  });
}

function hideAdOverlays() {
  GENERIC_AD_OVERLAY_SELECTORS.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (isVisible(el)) {
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
    const element = document.querySelector(selector);
    return element && isVisible(element);
  }) || document.body.classList.contains('ad-showing');
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

function skipGenericVideoAds() {
  document.querySelectorAll('video').forEach(video => {
    if (!video || video.readyState === 0 || video.ended || !isFinite(video.duration)) {
      return;
    }

    const adMeta = [
      video.className && /ad|advertisement|promo/i.test(video.className),
      video.id && /ad|advertisement|promo/i.test(video.id),
      video.poster && /ad|advertisement|promo/i.test(video.poster),
      video.closest('[class*=ad], [id*=ad], [data-ad], .vjs-ad-overlay, .jw-ad-overlay'),
      document.querySelector(GENERIC_AD_OVERLAY_SELECTORS.join(','))
    ].some(Boolean);

    if (adMeta || video.currentTime < 1 && isVisible(video.closest('.ad-overlay, .video-ads, .advertisement, .vjs-ad-overlay, .jw-ad-overlay'))) {
      clickSkipButtons();
      hideAdOverlays();

      if (video.currentTime + 0.5 < video.duration) {
        video.currentTime = Math.max(0, video.duration - 0.1);
      }

      video.play().catch(() => {});
      video.playbackRate = Math.max(1, Math.min(16, video.playbackRate));
    }
  });
}

function runSkipCycle() {
  try {
    clickSkipButtons();
    hideAdOverlays();
    skipYouTubeAds();
    skipGenericVideoAds();
  } catch (error) {
    console.error('Ad Skipper:', error);
  }
}

const observer = new MutationObserver(() => {
  runSkipCycle();
});

observer.observe(document.documentElement || document.body, {
  childList: true,
  subtree: true
});

setInterval(runSkipCycle, 700);

window.addEventListener('load', () => {
  runSkipCycle();
});
