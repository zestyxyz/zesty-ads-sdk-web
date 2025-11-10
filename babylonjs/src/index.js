/* global BABYLON */

import { fetchCampaignAd, sendOnLoadMetric, sendOnClickMetric, AD_REFRESH_INTERVAL } from '../../utils/networking';
import { formats } from '../../utils/formats';
import { openURL, visibilityCheck, constructAdModal } from '../../utils/helpers';
import { version } from '../package.json';

console.log('Zesty SDK Version: ', version);

let modalTriggers = {};

export default class ZestyBanner {
  constructor(adUnit, format, style, height, scene, webXRExperienceHelper = null, beacon = true, config = {}) {
    const options = {
      height: height,
      width: formats[format].width * height
    };

    this.zestyBanner = BABYLON.MeshBuilder.CreatePlane('zestybanner', options);
    this.scene = scene;
    this.xr = webXRExperienceHelper;

    loadBanner(adUnit, format, style, config.customDefaultImage, config.customDefaultCtaUrl, config.modalTrigger, config.modalBackground, config.modalDelay).then(data => {
      this.zestyBanner.material = data.mat;
      this.zestyBanner.actionManager = new BABYLON.ActionManager(scene);
      this.zestyBanner.url = data.url;

      if (beacon) {
        sendOnLoadMetric(adUnit, data.campaignId);
      }

      this.zestyBanner.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
          if (webXRExperienceHelper?.baseExperience) {
            webXRExperienceHelper.baseExperience.sessionManager.exitXRAsync().then(() => {
              openURL(data.url);
            });
          } else {
            openURL(data.url);
          }
          if (beacon) {
            sendOnClickMetric(adUnit, data.campaignId);
          }
        })
      );
    });

    setInterval(() => {
      const camera = this.getCamera();
      const boundingBox = this.zestyBanner.getBoundingInfo().boundingBox;
      const isVisible = visibilityCheck(
        boundingBox.minimumWorld.asArray(),
        boundingBox.maximumWorld.asArray(),
        camera.getProjectionMatrix().asArray(),
        camera.getWorldMatrix().asArray()
      );
      if (isVisible) {
        loadBanner(adUnit, format, style, config.customDefaultImage, config.customDefaultCtaUrl, config.modalTrigger, config.modalBackground, config.modalDelay).then(banner => {
          this.zestyBanner.material.diffuseTexture.updateURL(banner.src);
        });
      }
    }, AD_REFRESH_INTERVAL);

    return this.zestyBanner;
  }

  getCamera() {
    let camera = null;

    // Get the origin of the camera
    if (this.xr?.baseExperience && this.xr.baseExperience.state == BABYLON.WebXRState.IN_XR) {
      camera = this.xr.baseExperience.camera;
    } else {
      camera = this.scene.cameras[0];
    }

    return camera;
  }
}

async function loadBanner(adUnit, format, style, customDefaultImage, customDefaultCtaUrl, modalTrigger, modalBackground, modalDelay) {
  const activeBanner = await fetchCampaignAd(adUnit, format, style, customDefaultImage, customDefaultCtaUrl);

  const { asset_url: image, cta_url: url } = activeBanner.Ads[0];

  const mat = new BABYLON.StandardMaterial('');
  mat.diffuseTexture = new BABYLON.Texture(image);
  mat.diffuseTexture.hasAlpha = true;

  // Hook up modal trigger
  if (modalTrigger) {
    // Remove old listener if it exists
    if (modalTriggers[adUnit]) {
      document.removeEventListener(modalTrigger, modalTriggers[adUnit]);
    }

    // Create and store new handler
    modalTriggers[adUnit] = () => {
      let modal = constructAdModal(adUnit, activeBanner.CampaignId, format, image, url, modalBackground, modalDelay);
      document.body.appendChild(modal);
    };

    document.addEventListener(modalTrigger, modalTriggers[adUnit]);
  }

  return { mat: mat, src: image, uri: activeBanner.uri, url: url, campaignId: activeBanner.CampaignId };
}

window.ZestyBanner = ZestyBanner;
