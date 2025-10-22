Module['Zesty'] = Module['Zesty'] || {};

Module['Zesty'].checkOculusBrowser = function() {
    // As of 5/26/22, only Oculus Browser has implemented the WebXR Hand Input Module and WebXR Layers API.
    var featureDetect = (window.XRHand != null && window.XRMediaBinding != null);
    var uaCheck = navigator.userAgent.includes('OculusBrowser');
    var confidence = featureDetect && uaCheck ? 'Full' : 
                        featureDetect || uaCheck ? 'Partial' : 
                        'None';
    return { match: confidence !== 'None', confidence: confidence }
}

Module['Zesty'].checkWolvicBrowser = function() {
    // While Wolvic is still shipping with a GeckoView backend, this feature detect should hold true.
    // Once versions with different backends start showing up in the wild, this will need revisiting.
    var featureDetect = (window.mozInnerScreenX != null && window.speechSynthesis == null);
    var uaCheck = navigator.userAgent.includes('Mobile VR') && !navigator.userAgent.includes('OculusBrowser');
    var confidence = featureDetect && uaCheck ? 'Full' : 
                        featureDetect || uaCheck ? 'Partial' : 
                        'None';
    return { match: confidence !== 'None', confidence: confidence }
}

Module['Zesty'].checkPicoBrowser = async function() {
    // Pico's internal browser is a Chromium fork and seems to expose some WebXR AR modules,
    // so perform an isSessionSupported() check for immersive-vr and immersive-ar.
    var featureDetect = "xr" in navigator && (await navigator.xr.isSessionSupported('immersive-vr') && await navigator.xr.isSessionSupported('immersive-ar'));
    var uaCheck = navigator.userAgent.includes('Pico Neo 3 Link');
    var confidence = featureDetect && uaCheck ? 'Full' : 
                        featureDetect || uaCheck ? 'Partial' : 
                        'None';
    return { match: confidence !== 'None', confidence: confidence }
}

Module['Zesty'].checkDesktopBrowser = function() {
    // We are doing a coarse check here for lack of touch-capability and no Android/Mobile string in the UA.
    var featureDetect = (navigator.maxTouchPoints === 0 || navigator.msMaxTouchPoints === 0);
    var uaCheck = !navigator.userAgent.includes('Android') && !navigator.userAgent.includes('Mobile');
    var confidence = featureDetect && uaCheck ? 'Full' : 
                        featureDetect || uaCheck ? 'Partial' : 
                        'None';
    return { match: confidence !== 'None', confidence: confidence }
}

Module['Zesty'].checkUserPlatform = async function() {
    let currentMatch = {
        platform: '',
        confidence: ''
    };
        
    if (Module['Zesty'].checkOculusBrowser().match) {
        currentMatch = { platform: 'Oculus', confidence: Module['Zesty'].checkOculusBrowser().confidence };
    } else if (Module['Zesty'].checkWolvicBrowser().match) {
        currentMatch = { platform: 'Wolvic', confidence: Module['Zesty'].checkWolvicBrowser().confidence };
    } else if (await Module['Zesty'].checkPicoBrowser().match) {
        currentMatch = { platform: 'Pico', confidence: await Module['Zesty'].checkPicoBrowser().confidence };
    } else if (Module['Zesty'].checkDesktopBrowser().match) {
        currentMatch = { platform: 'Desktop', confidence: Module['Zesty'].checkDesktopBrowser().confidence };
    } else {
        // Cannot determine platform, return a default object
        currentMatch = { platform: 'Unknown', confidence: 'None' };
    }

    return currentMatch;
}

Module['Zesty']._constructAdModal = (adUnitId, campaignId, format, image, url, delay) => {
  const popover = document.createElement('div');
  popover.setAttribute('popover', 'manual');
  popover.id = 'ad-popover-' + Date.now();

  // basic styles (keeps it on top and clickable)
  Object.assign(popover.style, {
    borderRadius: '8%',
    backgroundColor: '#444343',
    border: '2px solid #F4801E',
    display: 'flex',
    flexDirection: 'column',
    padding: '1em',
    margin: 'auto',
    position: 'relative',
    boxSizing: 'border-box',
    zIndex: '2147483647', // ensure it's above other layers
    pointerEvents: 'auto'
  });

  // Image setup
  const img = document.createElement('img');
  img.src = image;
  let width, height;
  switch (format) {
    case 'medium-rectangle':
      width = 300; height = 250; break;
    case 'billboard':
      width = 970; height = 250; break;
    case 'mobile-phone-interstitial':
      width = 750; height = 1334; break;
    default:
      width = 300; height = 250; break;
  }
  img.width = width;
  img.height = height;
  img.style.display = 'block';

  // CTA link
  const cta = document.createElement('a');
  cta.href = url;
  cta.target = '_blank';
  cta.style.cursor = 'pointer';
  cta.addEventListener('click', () => {
    try { sendOnClickMetric(adUnitId, campaignId); } catch (e) { /* ignore metric errors */ }
  });
  cta.appendChild(img);

  // Close button container
  const closeContainer = document.createElement('div');
  Object.assign(closeContainer.style, {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '0.5em',
    pointerEvents: 'auto'
  });

  // Close button
  const close = document.createElement('button');
  close.textContent = '✕';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.style.display = 'none';
  setTimeout(() => {
    close.style.display = 'block';
  }, delay);
  Object.assign(close.style, {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    fontSize: '1.2em',
    color: '#F4801E',
    padding: '0.5em',
  });

  // Helper that attempts to use the Popover API and falls back to removing the element
  const removePopover = () => {
    // try hidePopover if available (some browsers expose it)
    try {
      if (typeof popover.hidePopover === 'function') {
        popover.hidePopover();
      }
    } catch (err) {
      // ignore errors from hidePopover
    }
    // ensure element is removed from DOM so it definitely disappears
    if (popover.parentElement) popover.parentElement.removeChild(popover);
    // cleanup global listeners
    document.removeEventListener('keydown', onKeyDown);
  };

  // Close click handler: stop propagation and remove
  close.addEventListener('click', (e) => {
    e.stopPropagation();
    removePopover();
  });

  // Close on Escape
  const onKeyDown = (e) => {
    if (e.key === 'Escape') removePopover();
  };
  document.addEventListener('keydown', onKeyDown);

  // Assemble the popover BEFORE showing
  closeContainer.appendChild(close);
  popover.appendChild(closeContainer);
  popover.appendChild(cta);
  document.body.appendChild(popover);

  // Show using Popover API when available, otherwise position it like a modal
  if (typeof popover.showPopover === 'function') {
    setTimeout(() => {
      try { popover.showPopover(); } catch (err) {
        // if showPopover fails, fall back to fixed positioning below
        popover.style.position = 'fixed';
        popover.style.left = '50%';
        popover.style.top = '50%';
        popover.style.transform = 'translate(-50%,-50%)';
      }
    }, 0);
  } else {
    // fallback: position as a centered fixed modal
    setTimeout(() => {
      popover.style.position = 'fixed';
      popover.style.left = '50%';
      popover.style.top = '50%';
      popover.style.transform = 'translate(-50%,-50%)';
    }, 0);
  }

  return popover;
};

Module['Zesty'].prebid = {
    AD_REFRESH_INTERVAL: 15000,
    prebidInit: false,
    interval: null,
    retryCount: 5,
    bids: {},
    currentTries: {}, // Maps retries to specific ad unit id
    previousUrls: {}, // Maps prior fetched URLs to specific ad unit id
    baseDivId: 'pb-slot-right-1',
    divCount: 0,
}