import { Box3, Frustum, Matrix4, Vector3 } from 'three';
import { sendOnClickMetric } from './networking.js';

/**
 * For each of the following browser checking functions, we have a match with a
 * confidence of "Full" if both the feature detection check and user agent check
 * come back true. If only one of them comes back true, we have a match with a confidence
 * of "Partial". If neither are true, match is false and our confidence is "None".
 */

/**
 * Performs feature detection and a UA check to determine if user is using Oculus Browser.
 * @returns an object indicating whether there is a match and the associated confidence level.
 */
const checkOculusBrowser = () => {
  // As of 5/26/22, only Oculus Browser has implemented the WebXR Hand Input Module and WebXR Layers API.
  const featureDetect = (window.XRHand != null && window.XRMediaBinding != null);
  const uaCheck = navigator.userAgent.includes('OculusBrowser');
  const confidence = featureDetect && uaCheck ? 'Full' :
                     featureDetect || uaCheck ? 'Partial' :
                     'None';
  return { match: confidence !== 'None', confidence: confidence }
}

/**
 * Performs feature detection and a UA check to determine if user is using Wolvic.
 * @returns an object indicating whether there is a match and the associated confidence level.
 */
const checkWolvicBrowser = () => {
  // While Wolvic is still shipping with a GeckoView backend, this feature detect should hold true.
  // Once versions with different backends start showing up in the wild, this will need revisiting.
  const featureDetect = (window.mozInnerScreenX != null && window.speechSynthesis == null);
  const uaCheck = navigator.userAgent.includes('Mobile VR') && !navigator.userAgent.includes('OculusBrowser');
  const confidence = featureDetect && uaCheck ? 'Full' :
                     featureDetect || uaCheck ? 'Partial' :
                     'None';
  return { match: confidence !== 'None', confidence: confidence }
}

/**
 * Performs feature detection and a UA check to determine if user is using Pico's browser.
 * @returns an object indicating whether there is a match and the associated confidence level.
 */
 const checkPicoBrowser = async () => {
  // Pico's internal browser is a Chromium fork and seems to expose some WebXR AR modules,
  // so perform an isSessionSupported() check for immersive-vr and immersive-ar.
  const featureDetect = navigator.xr && 
    (await navigator.xr.isSessionSupported('immersive-vr') && await navigator.xr.isSessionSupported('immersive-ar'));
  const uaCheck = navigator.userAgent.includes('Pico Neo 3 Link');
  const confidence = featureDetect && uaCheck ? 'Full' :
                     featureDetect || uaCheck ? 'Partial' :
                     'None';
  return { match: confidence !== 'None', confidence: confidence }
}

/**
 * Performs feature detection and a UA check to determine if user is using a browser on their desktop.
 * @returns an object indicating whether there is a match and the associated confidence level.
 */
 const checkDesktopBrowser = () => {
  // We are doing a coarse check here for lack of touch-capability and no Android/Mobile string in the UA.
  const featureDetect = (navigator.maxTouchPoints === 0 || navigator.msMaxTouchPoints === 0);
  const uaCheck = !navigator.userAgent.includes('Android') && !navigator.userAgent.includes('Mobile');
  const confidence = featureDetect && uaCheck ? 'Full' :
                     featureDetect || uaCheck ? 'Partial' :
                     'None';
  return { match: confidence !== 'None', confidence: confidence }
}

const checkUserPlatform = async () => {
  let currentMatch = {
    platform: '',
    confidence: ''
  };

  if (checkOculusBrowser().match) {
    currentMatch = { platform: 'Oculus', confidence: checkOculusBrowser().confidence };
  } else if (checkWolvicBrowser().match) {
    currentMatch = { platform: 'Wolvic', confidence: checkWolvicBrowser().confidence };
  } else if (await checkPicoBrowser().match) {
    currentMatch = { platform: 'Pico', confidence: await checkPicoBrowser().confidence };
  } else if (checkDesktopBrowser().match) {
    currentMatch = { platform: 'Desktop', confidence: checkDesktopBrowser().confidence };
  } else {
    // Cannot determine platform, return a default object
    currentMatch = { platform: 'Unknown', confidence: 'None' };
  }

  return currentMatch;
}

const openURL = url => {
  if (!url) return;

  // Are we on a device that will deeplink?
  // This may need to be expanded in the future.
  if (checkOculusBrowser().match) {
    if (url.includes('https://www.meta.com/experiences/')) {
        setTimeout(() => {
          window.open(url, '_blank');
        }, 1000);
        return;
    }
  } else if (checkWolvicBrowser().match) {
    // Wolvic's pop-up blocking is more aggressive than other
    // Chromium-based XR browsers, probably due to its Firefox
    // lineage. In order to prevent clicks being caught by it,
    // construct our own modal window and directly link the
    // yes button to the window.open call.
    const modal = document.createElement('div');
    const content = document.createElement('div');
    const message = document.createElement('p');
    const yes = document.createElement('button');
    const no = document.createElement('button');

    modal.style.backgroundColor = 'rgb(0, 0, 0, 0.75)'
    modal.style.color = 'white';
    modal.style.textAlign = 'center';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.padding = '5%';
    modal.style.borderRadius = '5%';
    modal.style.transform = 'translate(-50%, -50%)';

    message.innerHTML = `<b>This billboard leads to ${url}. Continue?</b>`;

    yes.innerText = 'Move cursor back into window.';
    yes.style.width = '100vw';
    yes.style.height = '100vh';
    yes.onmouseenter = () => {
      yes.style.width = 'auto';
      yes.style.height = 'auto';
      yes.innerText = 'Yes';
    }
    yes.onclick = () => {
      window.open(url, '_blank');
      modal.remove();
    }

    no.innerText = 'No';
    no.onclick = () => {
      modal.remove();
    }

    modal.append(content);
    content.append(message);
    content.append(yes);
    content.append(no);
    document.body.append(modal);
    return;
  }
  window.open(url, '_blank');
}

const urlContainsUTMParams = (url) => {
  return url.indexOf('utm_source=') !== -1 || url.indexOf('utm_campaign=') !== -1 || url.indexOf('utm_channel=') !== -1;
}

const appendUTMParams = (url, adUnitId) => {
  let new_url = new URL(url)
  new_url.searchParams.set('utm_source', 'ZestyMarket');
  new_url.searchParams.set('utm_campaign', 'ZestyCampaign');
  new_url.searchParams.set('utm_channel', `AdUnitId_${adUnitId}`);
  return new_url.href;
}

/**
 * Calculates whether an object is visible by checking for intersections between
 * the object's bounding box and the camera's frustum.
 * @param {min: number[]} bbMin
 * @param {max: number[]} bbMax
 * @param {number[]} cameraProjMatrix
 * @param {number[]} cameraWorldMatrix
 * @returns
 */
const visibilityCheck = (bbMin, bbMax, cameraProjMatrix, cameraWorldMatrix) => {
  const boundingBox = new Box3(new Vector3().fromArray(bbMin), new Vector3().fromArray(bbMax));
  const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().fromArray(cameraProjMatrix));
  frustum.planes.forEach(plane => plane.applyMatrix4(new Matrix4().fromArray(cameraWorldMatrix)));
  return frustum.intersectsBox(boundingBox);
}

const constructAdModal = (adUnitId, campaignId, format, image, url, delay = 0) => {
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

  const title = document.createElement('h1');
  title.innerText = 'Ad';
  title.style.textAlign = 'center';
  title.style.font = 'normal 32px sans-serif';
  title.style.color = '#F4801E';
  title.style.marginTop = '0';

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
    pointerEvents: 'auto',
    zIndex: '2'
  });

  // Close button
  const close = document.createElement('button');
  close.textContent = '✕';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.style.display = 'none';
  setTimeout(() => {
    close.style.display = 'block';
    title.style.marginTop = '-1.4em';
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
  popover.appendChild(title);
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

export {
  checkOculusBrowser,
  checkWolvicBrowser,
  checkPicoBrowser,
  checkDesktopBrowser,
  checkUserPlatform,
  openURL,
  urlContainsUTMParams,
  appendUTMParams,
  visibilityCheck,
  constructAdModal,
};