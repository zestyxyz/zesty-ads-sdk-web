import { formats } from '../utils/formats.js';
import { checkUserPlatform } from '../utils/helpers.js';
import { parse as parseUUID } from 'uuid'
import Beacon from '@zestyxyz/beacon';

const BEACON_API_BASE = 'https://beacon.zesty.market'
const BEACON_GRAPHQL_URI = 'https://beacon2.zesty.market/zgraphql'
const NEW_BEACON_URI = 'https://beacon3.zesty.xyz'
const DEFAULT_CTA_URL = 'https://relay.zesty.xyz/';
const DEFAULT_CAMPAIGN_ID = 'DefaultCampaign';

const DB_ENDPOINT = 'https://api.zesty.market/api';
const STAGING_DB_ENDPOINT = 'https://api-staging.zesty.market/api';

const AD_REFRESH_INTERVAL = 30000;

// Instantiate the beacon prototype as an import side-effect for now
// just so we don't need to modify all the other SDKs
const beacon = new Beacon('https://relay.zesty.xyz');
beacon.signal();

// Check if the Zesty debug param is present
const Params = URLSearchParams ? URLSearchParams : Map; // Shadowing with Map in case unavailable
const urlParams = new Params(globalThis.location?.search);
const isDebug = urlParams.get('debug') === 'true';
const isStaging = urlParams.get('staging') === 'true';
const isNewBeacon = urlParams.get('new_beacon') === 'true';
const isLocalhost = globalThis.location?.hostname === 'localhost' || globalThis.location?.hostname === '127.0.0.1';


const unitOverrides = [
  { id: '4902864a-5531-496b-8d4d-ec7b9849e8e1', format: 'medium-rectangle', oldFormat: 'tall', absoluteWidth: 0.75, absoluteHeight: .625 },
];

const getOverrideUnitInfo = (adUnitId) => {
  return unitOverrides.find(unit => unit.id === adUnitId) || {};
}

const getDefaultBanner = (format, style = 'standard', shouldOverride = false, overrideFormat = null, customDefaultImage = null, customDefaultCtaUrl = null) => {
  let asset_url = customDefaultImage?.length > 0 ? customDefaultImage : formats[shouldOverride ? overrideFormat : format].style[style];
  let cta_url = customDefaultCtaUrl?.length > 0 ? customDefaultCtaUrl : DEFAULT_CTA_URL;
  return { Ads: [{ asset_url, cta_url }], CampaignId: DEFAULT_CAMPAIGN_ID }
}

const getSampleBanner = (format) => {
  const ENDPOINT = isStaging ? STAGING_DB_ENDPOINT : DB_ENDPOINT;
  return { Ads: [{ asset_url: `${ENDPOINT}/ad/sample?format=${format}&timestamp=${Date.now()}`, cta_url: DEFAULT_CTA_URL }], CampaignId: DEFAULT_CAMPAIGN_ID }
}

const fetchFromZestyAPI = async (adUnitId, format, style, shouldOverride, overrideEntry, customDefaultImage = null, customDefaultCtaUrl = null) => {
  try {
    const url = encodeURI(window.location.href).replace(/\/$/, ''); // If URL ends with a slash, remove it
    const res = await fetch(`${DB_ENDPOINT}/ad?ad_unit_id=${adUnitId}&url=${url}`);
    if (res.status == 200) {
      return await res.json();
    }
    return getDefaultBanner(format, style, shouldOverride, overrideEntry?.format, customDefaultImage, customDefaultCtaUrl);
  } catch(e) {
    console.warn('Error retrieving campaign banner. Using default.');
    return getDefaultBanner(format, style, shouldOverride, overrideEntry?.format, customDefaultImage, customDefaultCtaUrl);
  }
}

const fetchCampaignAd = async (adUnitId, format = 'tall', style = 'standard', customDefaultImage = null, customDefaultCtaUrl = null) => {
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
    return new Promise(res => res(getDefaultBanner(format, style, false, null, customDefaultImage, customDefaultCtaUrl)));
  }

  let overrideEntry = getOverrideUnitInfo(adUnitId);
  let shouldOverride = (overrideEntry?.oldFormat && format == overrideEntry?.oldFormat) ?? false;

  if (!adUnitId) {
    return new Promise(res => res(getDefaultBanner(format, style, shouldOverride, overrideEntry.format, customDefaultImage, customDefaultCtaUrl)));
  }

  return fetchFromZestyAPI(adUnitId, format, style, shouldOverride, overrideEntry, customDefaultImage, customDefaultCtaUrl);
}

/**
 * Increment the on-load event count for the ad unit
 * @param {string} adUnit The ad unit ID
 * @returns A Promise representing the POST request
 */
const sendOnLoadMetric = async (adUnitId, campaignId = null) => {
  const { platform, confidence } = await checkUserPlatform();

  try {
    if (isNewBeacon) {
      await fetch(`${NEW_BEACON_URI}/events`, {
        method: 'POST',
        body: JSON.stringify({ ad_unit_id: adUnitId, campaign_id: campaignId, event_type: 'visit', platform: { name: platform, confidence } }),
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      await fetch(BEACON_GRAPHQL_URI, {
        method: 'POST',
        body: JSON.stringify({ query: `mutation { increment(eventType: visits, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` }),
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    console.log("Failed to emit onload event", e.message)
  }
};

const sendOnClickMetric = async (adUnitId, campaignId = null) => {
  const { platform, confidence } = await checkUserPlatform();

  try {
    if (isNewBeacon) {
      await fetch(`${NEW_BEACON_URI}/events`, {
        method: 'POST',
        body: JSON.stringify({ ad_unit_id: adUnitId, campaign_id: campaignId, event_type: 'click', platform: { name: platform, confidence } }),
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      await fetch(BEACON_GRAPHQL_URI, {
        method: 'POST',
        body: JSON.stringify({ query: `mutation { increment(eventType: clicks, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` }),
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    console.log("Failed to emit onclick event", e.message)
  }
}

const analyticsSession = async (adUnitId, campaignId) => {
  const { platform, confidence } = await checkUserPlatform();
  try {
    if (isNewBeacon) {
      await fetch(`${NEW_BEACON_URI}/events`, {
        method: 'POST',
        body: JSON.stringify({ ad_unit_id: adUnitId, campaign_id: campaignId, event_type: 'session', platform: { name: platform, confidence } }),
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      await fetch(BEACON_GRAPHQL_URI, {
        method: 'POST',
        body: JSON.stringify({ query: `mutation { increment(eventType: session, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` }),
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    console.log(`Failed to emit session analytics`, e.message)
  }
}

export { fetchCampaignAd, getDefaultBanner, sendOnLoadMetric, sendOnClickMetric, analyticsSession, getOverrideUnitInfo, AD_REFRESH_INTERVAL, DEFAULT_CTA_URL, DEFAULT_CAMPAIGN_ID };
