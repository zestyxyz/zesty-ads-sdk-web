import {
  Camera,
  Mesh, 
  MeshBasicMaterial,
  WebGLRenderer,
  PlaneGeometry,
  TextureLoader,
  Box3
} from 'three';
import { sendOnLoadMetric, sendOnClickMetric, fetchCampaignAd, AD_REFRESH_INTERVAL } from '../../utils/networking';
import { formats } from '../../utils/formats';
import { openURL, visibilityCheck, constructAdModal } from '../../utils/helpers';
import { version } from '../package.json';

console.log('Zesty SDK Version: ', version);

export default class ZestyBanner extends Mesh {
  /**
   * @constructor
   * @param {string} adUnit The ad unit ID
   * @param {string} format The format of the default banner
   * @param {string} style The visual style of the default banner
   * @param {Number} height Height of the banner
   * @param {WebGLRenderer} renderer Optional field to pass in the WebGLRenderer in a WebXR project
   * @param {boolean} beacon Whether to send analytics events
   * @param {boolean} prebid Whether to use Prebid for programmatic ads
   */
  constructor(adUnit, format, style, height, renderer = null, beacon = true, prebid = true, config = {}) {
    super();
    this.geometry = new PlaneGeometry(formats[format].width * height, height, 1, 1);

    this.type = 'ZestyBanner';
    this.adUnit = adUnit;
    this.format = format;
    this.style = style;
    this.renderer = renderer;
    this.beacon = beacon;
    this.prebid = prebid;
    this.customDefaultImage = config.customDefaultImage ?? null;
    this.customDefaultCtaUrl = config.customDefaultCtaUrl ?? null;
    this.modalTrigger = config.modalTrigger ?? null;
    this.modalBackground = config.modalBackground ?? false;
    this.modalDelay = config.modalDelay ?? 0;
    this.banner = {};

    this.bannerPromise = loadBanner(adUnit, format, style, this.prebid, this.customDefaultImage, this.customDefaultCtaUrl, this.modalTrigger, this.modalBackground, this.modalDelay).then(banner => {
      this.material = new MeshBasicMaterial({
        map: banner.texture
      });
      this.material.transparent = true;
      this.banner = banner;

      if (beacon) {
        sendOnLoadMetric(adUnit, banner.campaignId);
      }
    });
    this.onClick = this.onClick.bind(this);

    setInterval(this.refreshIfVisible.bind(this), AD_REFRESH_INTERVAL);
  }

  onClick() {
    if (this.banner.url) {
      if (this.renderer != null && this.renderer.xr.getSession() != null) {
        this.renderer.xr.getSession().end();
      }

      openURL(this.banner.url);
      if (this.beacon) {
        sendOnClickMetric(this.adUnit, this.banner.campaignId);
      }
    }
  }

  getCamera() {
    /** @type {Camera} */
    let camera = null;
    let getScene = () => {
      let parent = this.parent;
      while (parent.parent != null) {
        parent = parent.parent;
      }
      return parent;
    }
    // Get the origin of the camera
    if (this.renderer?.xr.isPresenting) {
      camera = this.renderer.xr.getCamera();
    } else {
      camera = getScene().getObjectByProperty('isCamera', true);
    }
    return camera;
  }

  refreshIfVisible() {
    const camera = this.getCamera();
    this.geometry.computeBoundingBox();
    const bb = new Box3().setFromObject(this);
    const isVisible = visibilityCheck(
      bb.min.toArray(),
      bb.max.toArray(),
      camera.projectionMatrix.toArray(),
      camera.matrixWorld.toArray(),
    );
    if (isVisible) {
      loadBanner(this.adUnit, this.format, this.style, this.prebid, this.customDefaultImage, this.customDefaultCtaUrl).then(banner => {
        this.material.map = banner.texture;
        this.material.needsUpdate = true;
        this.banner = banner;
      });
    }
  }
}

async function loadBanner(adUnit, format, style, prebid = true, customDefaultImage = null, customDefaultCtaUrl = null, modalTrigger = null, modalBackground = false, modalDelay = 0) {
  const activeBanner = await fetchCampaignAd(adUnit, format, style, prebid, customDefaultImage, customDefaultCtaUrl);

  const { asset_url: image, cta_url: url } = activeBanner.Ads[0];

  // Hook up modal trigger
  const onModalTrigger = () => {
    let modal = constructAdModal(adUnit, activeBanner.CampaignId, format, image, url, modalBackground, modalDelay);
    document.body.appendChild(modal);
  };
  document.removeEventListener(modalTrigger, onModalTrigger);
  document.addEventListener(modalTrigger, onModalTrigger);

  return new Promise((resolve, reject) => {
    const loader = new TextureLoader();

    loader.load(
      image,
      function(texture) {
        texture.needsUpdate = true;
        resolve({ texture: texture, src: image, uri: activeBanner.uri, url: url, campaignId: activeBanner.CampaignId });
      },
      undefined,
      function(err) {
        console.error('An error occurred while loading the ad.');
        reject(err);
      }
    );
  });
}

window.ZestyBanner = ZestyBanner;
