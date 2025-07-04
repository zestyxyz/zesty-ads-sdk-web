import { formats } from '../utils/formats.js';
import { checkUserPlatform } from '../utils/helpers.js';
import { parse as parseUUID } from 'uuid'
import Beacon from 'sig-beacon';

const BEACON_API_BASE = 'https://beacon.zesty.market'
const BEACON_GRAPHQL_URI = 'https://beacon2.zesty.market/zgraphql'
const DEFAULT_CTA_URL = 'https://relay.zesty.xyz/';
const DEFAULT_CAMPAIGN_ID = 'DefaultCampaign';

const DB_ENDPOINT = 'https://api.zesty.market/api';
const STAGING_DB_ENDPOINT = 'https://api-staging.zesty.market/api';

// Prebid variables
const AD_REFRESH_INTERVAL = 5000;
let prebidInit = false;
let interval = null;
const retryCount = 5;
let bids = {};
const currentTries = {} // Maps retries to specific ad unit id
const previousUrls = {} // Maps prior fetched URLs to specific ad unit id
const adUnitDivIds = {} // Maps ad units to their div ids
let baseDivId = 'pb-slot-right-1';
let divCount = 0;

// Instantiate the beacon prototype as an import side-effect for now
// just so we don't need to modify all the other SDKs
const beacon = new Beacon('https://relay.zesty.xyz');
beacon.signal();

// Check if the Zesty debug param is present
const urlParams = new URLSearchParams(window.location.search);
const isDebug = urlParams.get('debug') === 'true';
const isStaging = urlParams.get('staging') === 'true';

const initPrebid = (adUnitId, format) => {
  if (isDebug) {
    console.log("Debug mode enabled, skipping Prebid initialization.");
    prebidInit = true;
    return;
  }

  // Create div for prebid to target
  const div = document.createElement('div');
  div.id = 'zesty-div';
  div.style.height = '250px';
  div.style.width = '300px';
  div.style.position = 'fixed';
  div.style.top = '0';
  div.style.zIndex = '-2';
  document.body.appendChild(div);

  // Append google gpt tag
  const script = document.createElement('link');
  script.href = 'https://www.googletagservices.com/tag/js/gpt.js';
  script.rel = 'preload';
  script.as = 'script';
  document.head.appendChild(script);

  // Append aditude wrapper tag
  const aditudeScript = document.createElement('script');
  aditudeScript.src = 'https://dn0qt3r0xannq.cloudfront.net/zesty-ig89tpzq8N/zesty-longform/prebid-load.js';
  aditudeScript.async = true;
  document.head.appendChild(aditudeScript);

  // Load gifler script in case gif creative is served
  const gifscript = document.createElement('script');
  gifscript.src = 'https://cdn.jsdelivr.net/npm/gifler@0.1.0/gifler.min.js';
  document.head.appendChild(gifscript);

  // Select baseDivId based on format, defaulting to the one for medium rectangle
  if (format == 'medium-rectangle') {
    div.id = 'zesty-div-medium-rectangle';
  } else if (format == 'billboard') {
    baseDivId = 'pb-slot-billboard';
    div.id = 'zesty-div-billboard';
    div.style.width = '728px';
    div.style.height = '90px';
  } else if (format == 'mobile-phone-interstitial') {
    baseDivId = 'pb-slot-interstitial';
    div.id = 'zesty-div-mobile-phone-interstitial';
    div.style.width = '1080px';
    div.style.height = '1920px';
  }

  adUnitDivIds[adUnitId] = div.id;

  // Pass ad unit id as a custom param for prebid metrics
  window.Raven = window.Raven || { cmd: [] };
  window.Raven.cmd.push(({ config }) => {
    config.setCustom({
      param1: adUnitId,
    });
  });

  window.tude = window.tude || { cmd: [] };
  tude.cmd.push(function() {
    tude.refreshAdsViaDivMappings([
      {
        divId: `zesty-div-${format}`,
        baseDivId,
      }
    ]);
  });

  function getUrlsFromIframe(iframe) {
    if (!iframe.contentDocument) return;

    const images = iframe.contentDocument.querySelectorAll('img');
    const adImage = Array.prototype.filter.call(images, image => image.height > 1);
    if (adImage.length == 0) return;
    const asset_url = adImage[0].src;
    const cta_url = adImage[0].parentElement.href;
    return { asset_url, cta_url };
  }

  interval = setInterval(() => {
    let div = document.getElementById(`zesty-div-${format}`);
    if (!div) {
      // If for some reason we can't find the proper div (e.g. the given format is invalid),
      // fallback to the plain name
      div = document.getElementById('zesty-div');
      adUnitDivIds[adUnitId] = div.id;
    }
    const iframe = div?.querySelector('iframe:not([title*="prpb"])'); // Don't grab the iframe if professor prebid is installed
    if (iframe) {
      let urls = getUrlsFromIframe(iframe);
      if (urls) {
        const { asset_url, cta_url } = urls;
        if (asset_url !== previousUrls[adUnitId].asset_url || cta_url !== previousUrls[adUnitId].cta_url) {
          previousUrls[adUnitId] = { asset_url, cta_url };
          bids = { asset_url, cta_url };
        }
      }
    }
  }, 1000);

  prebidInit = true;
}

const unitOverrides = [
  { id: '4902864a-5531-496b-8d4d-ec7b9849e8e1', format: 'medium-rectangle', oldFormat: 'tall', absoluteWidth: 0.75, absoluteHeight: .625 },
];

const getOverrideUnitInfo = (adUnitId) => {
  return unitOverrides.find(unit => unit.id === adUnitId) || {};
}

const getDefaultBanner = (format, style, shouldOverride = false, overrideFormat = null) => {
  return { Ads: [{ asset_url: formats[shouldOverride ? overrideFormat : format].style[style], cta_url: DEFAULT_CTA_URL }], CampaignId: DEFAULT_CAMPAIGN_ID }
}

const getSampleBanner = (format) => {
  const ENDPOINT = isStaging ? STAGING_DB_ENDPOINT : DB_ENDPOINT;
  return { Ads: [{ asset_url: `${ENDPOINT}/ad/sample?format=${format}&timestamp=${Date.now()}`, cta_url: DEFAULT_CTA_URL }], CampaignId: DEFAULT_CAMPAIGN_ID }
}

const fetchCampaignAd = async (adUnitId, format = 'tall', style = 'standard') => {
  if (['tall', 'wide', 'square'].includes(format)) {
    console.warn(`The old Zesty banner formats (tall, wide, and square) are being deprecated and will be removed in a future version. Please update to one of the new IAB formats (mobile-phone-interstitial, billboard, and medium-rectangle).
Check https://docs.zesty.xyz/guides/developers/ad-units for more information.`);
  }

  if (isDebug) {
    return new Promise(res => res(getSampleBanner(format)));
  }

  // Early exit if ad unit ID is an invalid format and would not map to a Zesty ad unit
  try {
    parseUUID(adUnitId);
  } catch (e) {
    console.warn(`Ad unit ID ${adUnitId} is not a valid UUID.`);
    return new Promise(res => res(getDefaultBanner(format, style)));
  }

  let overrideEntry = getOverrideUnitInfo(adUnitId);
  let shouldOverride = overrideEntry?.oldFormat && format == overrideEntry.oldFormat;

  if (!adUnitId) {
    return new Promise(res => res(getDefaultBanner(format, style, shouldOverride, overrideEntry.format)));
  }

  if (!prebidInit) {
    const finalFormat = shouldOverride ? overrideEntry.format : format;
    currentTries[adUnitId] = 0;
    previousUrls[adUnitId] = { asset_url: null, cta_url: null };
    initPrebid(adUnitId, finalFormat, style);
  } else {
    bids = null;
    currentTries[adUnitId] = 0;
    previousUrls[adUnitId] = { asset_url: null, cta_url: null };
    tude.cmd.push(function() {
      tude.refreshAdsViaDivMappings([
        {
          divId: adUnitDivIds[adUnitId],
          baseDivId,
        }
      ]);
    });
  }

  return new Promise((resolve, reject) => {
    async function getBanner() {
      if (bids?.asset_url && bids?.cta_url) {
        // Clear the interval and grab the image+url from the prebid ad
        const { asset_url, cta_url } = bids;
        if (asset_url.startsWith('canvas://')) {
          const canvasIframe = document.createElement('iframe');
          canvasIframe.id = "zesty-canvas-iframe";
          document.body.appendChild(canvasIframe);
          canvasIframe.contentDocument.open();
          canvasIframe.contentDocument.write(asset_url.split('canvas://')[1]);
          canvasIframe.contentDocument.close();
        }
        resolve({ Ads: [{ asset_url, cta_url }], CampaignId: 'Prebid' });
      } else {
        // Wait to see if we get any winning bids. If we hit max retry count, fallback to Zesty ad server
        currentTries[adUnitId]++;
        if (currentTries[adUnitId] == retryCount) {
          try {
            const url = encodeURI(window.location.href).replace(/\/$/, ''); // If URL ends with a slash, remove it
            const res = await fetch(`${DB_ENDPOINT}/ad?ad_unit_id=${adUnitId}&url=${url}`);
            if (res.status == 200) {
              const data = await res.json();
              resolve(data);
            } else {
              // No active campaign, just display default banner
              resolve(getDefaultBanner(format, style, shouldOverride, overrideEntry.format));
            }
            currentTries[adUnitId] = 0;
          } catch(e) {
            console.error(e);
            console.warn('Error retrieving an active campaign banner. Retrieving default banner.')
            resolve(getDefaultBanner(format, style, shouldOverride, overrideEntry.format));
            currentTries[adUnitId] = 0;
          }
        } else {
          setTimeout(getBanner, 1000);
        }
      }
    }
    getBanner();
  });
}

/**
 * Increment the on-load event count for the ad unit
 * @param {string} adUnit The ad unit ID
 * @returns A Promise representing the POST request
 */
const sendOnLoadMetric = async (adUnitId, campaignId = null) => {
  const { platform, confidence } = await checkUserPlatform();

  try {
    await fetch(BEACON_GRAPHQL_URI, {
      method: 'POST',
      body: JSON.stringify({ query: `mutation { increment(eventType: visits, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    console.log("Failed to emit onload event", e.message)
  }
};

const sendOnClickMetric = async (adUnitId, campaignId = null) => {
  const { platform, confidence } = await checkUserPlatform();

  try {
    await fetch(BEACON_GRAPHQL_URI, {
      method: 'POST',
      body: JSON.stringify({ query: `mutation { increment(eventType: clicks, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` }),
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.log("Failed to emit onclick event", e.message)
  }
}

const analyticsSession = async (adUnitId, campaignId) => {
  const { platform, confidence } = await checkUserPlatform();
  try {
    await fetch(BEACON_GRAPHQL_URI, {
      method: 'POST',
      body: JSON.stringify({ query: `mutation { increment(eventType: session, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` }),
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.log(`Failed to emit session analytics`, e.message)
  }
}

export { fetchCampaignAd, sendOnLoadMetric, sendOnClickMetric, analyticsSession, getOverrideUnitInfo, AD_REFRESH_INTERVAL, DEFAULT_CTA_URL, DEFAULT_CAMPAIGN_ID };
