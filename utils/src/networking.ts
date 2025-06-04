import axios from 'axios';
import { formats } from './formats.js';
import { checkUserPlatform } from './helpers.js';
import { parse as parseUUID } from 'uuid'
const BeaconModule = require('sig-beacon');
import type { 
  AdFormat, 
  AdStyle, 
  Campaign, 
  UnitOverride, 
  PrebidUrls, 
  PrebidBids
} from './types.js';

// const BEACON_API_BASE = 'https://beacon.zesty.market'
const BEACON_GRAPHQL_URI = 'https://beacon2.zesty.market/zgraphql'

const DB_ENDPOINT = 'https://api.zesty.market/api';
// TODO: Determine best way to enable switching to staging
// const STAGING_DB_ENDPOINT = 'https://api-staging.zesty.market/api';

// Prebid variables
const AD_REFRESH_INTERVAL = 5000;
let prebidInit = false;
// Note: interval variable used in setInterval but not directly referenced
// let interval: NodeJS.Timeout | null = null;
const retryCount = 5;
let bids: PrebidBids | null = {};
const currentTries: Record<string, number> = {} // Maps retries to specific ad unit id
const previousUrls: Record<string, PrebidUrls> = {} // Maps prior fetched URLs to specific ad unit id
const adUnitDivIds: Record<string, string> = {} // Maps ad units to their div ids
let baseDivId = 'pb-slot-right-1';
// let divCount = 0;

// Declare global types for prebid/tude
declare global {
  interface Window {
    Raven?: {
      cmd: Array<(args: { config: { setCustom: (params: Record<string, any>) => void } }) => void>;
    };
    tude?: {
      cmd: Array<() => void>;
      refreshAdsViaDivMappings?: (mappings: Array<{ divId: string; baseDivId: string }>) => void;
    };
    XRHand?: any;
    XRMediaBinding?: any;
    mozInnerScreenX?: any;
  }
}

// Type declaration for sig-beacon
interface BeaconInterface {
  new(url: string): {
    signal(): void;
  };
}

declare const Beacon: BeaconInterface;

// Instantiate the beacon prototype as an import side-effect for now
// just so we don't need to modify all the other SDKs
const beacon = new BeaconModule('https://relay.zesty.xyz');
beacon.signal();

const initPrebid = (adUnitId: string, format: AdFormat): void => {
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
  window.tude.cmd.push(function() {
    if (window.tude?.refreshAdsViaDivMappings) {
      window.tude.refreshAdsViaDivMappings([
        {
          divId: `zesty-div-${format}`,
          baseDivId,
        }
      ]);
    }
  });

  function getUrlsFromIframe(iframe: HTMLIFrameElement): PrebidUrls | undefined {
    if (!iframe.contentDocument) return;

    const images = iframe.contentDocument.querySelectorAll('img');
    const adImage = Array.prototype.filter.call(images, (image: HTMLImageElement) => image.height > 1);
    if (adImage.length == 0) return;
    const asset_url = adImage[0].src;
    const cta_url = (adImage[0].parentElement as HTMLAnchorElement)?.href || null;
    return { asset_url, cta_url };
  }

  setInterval(() => {
    let div = document.getElementById(`zesty-div-${format}`);
    if (!div) {
      // If for some reason we can't find the proper div (e.g. the given format is invalid),
      // fallback to the plain name
      div = document.getElementById('zesty-div');
      if (div) {
        adUnitDivIds[adUnitId] = div.id;
      }
    }
    const iframe = div?.querySelector('iframe:not([title*="prpb"])') as HTMLIFrameElement; // Don't grab the iframe if professor prebid is installed
    if (iframe) {
      let urls = getUrlsFromIframe(iframe);
      if (urls) {
        const { asset_url, cta_url } = urls;
        if (asset_url !== previousUrls[adUnitId]?.asset_url || cta_url !== previousUrls[adUnitId]?.cta_url) {
          previousUrls[adUnitId] = { asset_url, cta_url };
          bids = { asset_url: asset_url || undefined, cta_url: cta_url || undefined };
        }
      }
    }
  }, 1000);

  prebidInit = true;
}

const unitOverrides: UnitOverride[] = [
  { id: '4902864a-5531-496b-8d4d-ec7b9849e8e1', format: 'medium-rectangle', oldFormat: 'tall', absoluteWidth: 0.75, absoluteHeight: .625 },
];

const getOverrideUnitInfo = (adUnitId: string): Partial<UnitOverride> => {
  return unitOverrides.find(unit => unit.id === adUnitId) || {};
}

const getDefaultBanner = (format: AdFormat, style: AdStyle, shouldOverride = false, overrideFormat: AdFormat | null = null): Campaign => {
  return { Ads: [{ asset_url: formats[shouldOverride && overrideFormat ? overrideFormat : format].style[style], cta_url: 'https://relay.zesty.xyz' }], CampaignId: 'DefaultCampaign' }
}

const fetchCampaignAd = async (adUnitId: string, format: AdFormat = 'tall', style: AdStyle = 'standard'): Promise<Campaign> => {
  if (['tall', 'wide', 'square'].includes(format)) {
    console.warn(`The old Zesty banner formats (tall, wide, and square) are being deprecated and will be removed in a future version. Please update to one of the new IAB formats (mobile-phone-interstitial, billboard, and medium-rectangle).
Check https://docs.zesty.xyz/guides/developers/ad-units for more information.`);
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
    const finalFormat = shouldOverride && overrideEntry.format ? overrideEntry.format : format;
    currentTries[adUnitId] = 0;
    previousUrls[adUnitId] = { asset_url: null, cta_url: null };
    initPrebid(adUnitId, finalFormat);
  } else {
    bids = null;
    currentTries[adUnitId] = 0;
    previousUrls[adUnitId] = { asset_url: null, cta_url: null };
    window.tude?.cmd.push(function() {
      if (window.tude?.refreshAdsViaDivMappings) {
        window.tude.refreshAdsViaDivMappings([
          {
            divId: adUnitDivIds[adUnitId],
            baseDivId,
          }
        ]);
      }
    });
  }

  return new Promise((resolve) => {
    async function getBanner(): Promise<void> {
      if (bids?.asset_url && bids?.cta_url) {
        // Clear the interval and grab the image+url from the prebid ad
        const { asset_url, cta_url } = bids;
        if (asset_url.startsWith('canvas://')) {
          const canvasIframe = document.createElement('iframe');
          canvasIframe.id = "zesty-canvas-iframe";
          document.body.appendChild(canvasIframe);
          canvasIframe.contentDocument?.open();
          canvasIframe.contentDocument?.write(asset_url.split('canvas://')[1]);
          canvasIframe.contentDocument?.close();
        }
        resolve({ Ads: [{ asset_url, cta_url }], CampaignId: 'Prebid' });
      } else {
        // Wait to see if we get any winning bids. If we hit max retry count, fallback to Zesty ad server
        currentTries[adUnitId]++;
        if (currentTries[adUnitId] == retryCount) {
          try {
            const url = encodeURI(window.location.href).replace(/\/$/, ''); // If URL ends with a slash, remove it
            const res = await axios.get(`${DB_ENDPOINT}/ad?ad_unit_id=${adUnitId}&url=${url}`);
            if (res.data) {
              resolve(res.data);
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
 * @param adUnitId The ad unit ID
 * @param campaignId The campaign ID (optional)
 * @returns A Promise representing the POST request
 */
const sendOnLoadMetric = async (adUnitId: string, campaignId: string | null = null): Promise<void> => {
  const { platform, confidence } = await checkUserPlatform();

  try {
    await axios.post(
      BEACON_GRAPHQL_URI,
      { query: `mutation { increment(eventType: visits, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e: any) {
    console.log("Failed to emit onload event", e.message)
  }
};

const sendOnClickMetric = async (adUnitId: string, campaignId: string | null = null): Promise<void> => {
  const { platform, confidence } = await checkUserPlatform();

  try {
    await axios.post(
      BEACON_GRAPHQL_URI,
      { query: `mutation { increment(eventType: clicks, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e: any) {
    console.log("Failed to emit onclick event", e.message)
  }
}

const analyticsSession = async (adUnitId: string, campaignId: string): Promise<void> => {
  const { platform, confidence } = await checkUserPlatform();
  try {
    await axios.post(
      BEACON_GRAPHQL_URI,
      { query: `mutation { increment(eventType: session, spaceId: \"${adUnitId}\", campaignId: \"${campaignId}\", platform: { name: ${platform}, confidence: ${confidence} }) { message } }` },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e: any) {
    console.log(`Failed to emit session analytics`, e.message)
  }
}

export { fetchCampaignAd, sendOnLoadMetric, sendOnClickMetric, analyticsSession, getOverrideUnitInfo, AD_REFRESH_INTERVAL };