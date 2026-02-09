/* global WL */

import { fetchCampaignAd, sendOnLoadMetric, sendOnClickMetric, getV3BetaUnitInfo } from '../../utils/networking';
import { formats, defaultFormat } from '../../utils/formats';
import { openURL } from '../../utils/helpers';
import { version } from '../package.json';

console.log(`Zesty SDK Version: ${version} (compatibility)`);

const formatsLink = 'https://cdn.zesty.xyz/sdk/zesty-formats.js';
const networkingLink = 'https://cdn.zesty.xyz/sdk/zesty-networking.js';

/**
 * [Zesty Market](https://zesty.xyz) banner ad unit
 *
 * Fetches a banner and applies it to a texture. If no `cursor-target` and `collision`
 * is found on the object, they will be created automatically (with box shape in group 1).
 *
 * Make sure that you set up a cursor to enable clicking.
 */
WL.registerComponent(
  'zesty-banner',
  {
    /* Your banner ad unit index */
    adUnit: { type: WL.Type.String },
    /* The default banner format, determines aspect ratio */
    format: { type: WL.Type.Enum, values: Object.keys(formats), default: defaultFormat },
    /* The default banner visual style */
    style: {
      type: WL.Type.Enum,
      values: ['standard', 'minimal', 'transparent'],
      default: 'transparent',
    },
    /* Scale width of the object to banner ratio (see format) and set the collider */
    scaleToRatio: { type: WL.Type.Bool, default: true },
    /* Texture property to set after banner is loaded. Leave "auto" to detect from
     * known pipelines (Phong Opaque Textured, Flat Opaque Textured) */
    textureProperty: { type: WL.Type.String, default: 'auto' },
    beacon: { type: WL.Type.Bool, default: true },
    /* Whether to use Prebid for programmatic ads */
    prebid: { type: WL.Type.Bool, default: true },
    /* Load default image uris at runtime, if false at build time */
    dynamicFormats: { type: WL.Type.Bool, default: true },
    /* Automatically creates a collision and cursor-target components, if there isn't one */
    createAutomaticCollision: { type: WL.Type.Bool, default: true },
    /* Load networking logic at runtime, if false at build time */
    dynamicNetworking: { type: WL.Type.Bool, default: true },
  },
  {
    init: function () {
      this.formats = Object.values(formats);
      this.formatKeys = Object.keys(formats);
      this.styleKeys = ['standard', 'minimal', 'transparent'];
    },

    start: function () {
      const isBeta = getV3BetaUnitInfo(this.adUnit).hasOwnProperty('format');

      this.mesh = this.object.getComponent('mesh');

      if (!this.mesh) {
        throw new Error("'zesty-banner ' missing mesh component");
      }

      if (this.createAutomaticCollision) {
        this.collision =
          this.object.getComponent('collision') ||
          this.object.addComponent('collision', {
            collider: WL.Collider.Box,
            group: 0x2,
          });

        this.cursorTarget =
          this.object.getComponent('cursor-target') || this.object.addComponent('cursor-target');
        this.cursorTarget.addClickFunction(this.onClick.bind(this));
      }

      if (this.dynamicFormats) {
        let formatsScript = document.createElement('script');

        formatsScript.onload = () => {
          this.formatsOverride = zestyFormats.formats;
        }
        formatsScript.setAttribute('src', formatsLink);
        formatsScript.setAttribute('crossorigin', 'anonymous');
        document.body.appendChild(formatsScript);
      }

      if (this.dynamicNetworking) {
        import(networkingLink)
          .then(value => {
            this.zestyNetworking = Object.assign({}, value);
            this.startLoading();
            if (isBeta) {
              setInterval(this.startLoading.bind(this), 30000);
            }
          })
          .catch(() => {
            console.error('Failed to dynamically retrieve networking code, falling back to bundled version.');
            this.dynamicNetworking = null;
            this.startLoading();
            if (isBeta) {
              setInterval(this.startLoading.bind(this), 30000);
            }
          });
      } else {
        this.startLoading();
        if (isBeta) {
          setInterval(this.startLoading.bind(this), 30000);
        }
      }
    },

    startLoading: function () {
      this.loadBanner(
        this.adUnit,
        this.formatKeys[this.format],
        this.styleKeys[this.style]
      ).then((banner) => {
        this.banner = banner;

        if (this.scaleToRatio) {
          /* Make banner always 1 meter height, adjust width according to banner aspect ratio */
          this.height = this.object.scalingLocal[1];
          const {
            absoluteWidth: adjustedWidth = this.formats[this.format].width * this.height,
            absoluteHeight: adjustedHeight = this.object.scalingLocal[1]
          } = getV3BetaUnitInfo(this.adUnit);
          this.object.resetScaling();

          if (this.createAutomaticCollision) {
            this.collision.extents = [
              adjustedWidth,
              adjustedHeight,
              0.1,
            ];
          }
          this.object.scale([adjustedWidth, adjustedHeight, 1.0]);
        }

        /* WL.Material.shader will be renamed to pipeline at some point,
         * supporting as many API versions as possible. */
        const m = this.mesh.material.clone();
        if (this.textureProperty === 'auto') {
          const pipeline = m.pipeline || m.shader;
          if (m.diffuseTexture) {
            m.diffuseTexture = banner.texture;
            m.alphaMaskThreshold = 0.3;
          } else if (m.flatTexture) {
            m.flatTexture = banner.texture;
            m.alphaMaskThreshold = 0.8;
          } else {
            throw Error(
              "'zesty-banner ' unable to apply banner texture: unsupported pipeline " + m.shader
            );
          }
          this.mesh.material = m;
        } else {
          this.mesh.material[this.textureProperty] = banner.texture;
        }

        if (this.beacon) {
          this.dynamicNetworking ?
            this.zestyNetworking.sendOnLoadMetric(this.adUnit, this.banner.campaignId) :
            sendOnLoadMetric(this.adUnit, this.banner.campaignId);
        }
      });
    },

    onClick: function () {
      if (this.banner?.url) {
        if (WL.xrSession) {
          WL.xrSession.end().then(this.executeClick.bind(this));
        } else {
          this.executeClick();
        }
      }
    },

    executeClick: function () {
      openURL(this.banner.url);
      if (this.beacon) {
        this.dynamicNetworking ?
          this.zestyNetworking.sendOnClickMetric(this.adUnit, this.banner.campaignId) :
          sendOnClickMetric(this.adUnit, this.banner.campaignId);
      }
    },

    loadBanner: async function (adUnit, format, style) {
      const {
        format: adjustedFormat = format,
      } = getV3BetaUnitInfo(adUnit);
  
  
      const betaFormats = ['mobile-phone-interstitial', 'billboard', 'medium-rectangle'];
      if (betaFormats.includes(adjustedFormat)) {
        this.format = betaFormats.indexOf(adjustedFormat) + 3;
      }

      const activeCampaign = this.dynamicNetworking ?
        await this.zestyNetworking.fetchCampaignAd(adUnit, adjustedFormat, style, this.prebid) :
        await fetchCampaignAd(adUnit, adjustedFormat, style, this.prebid);

      const { asset_url: image, cta_url: url } = activeCampaign.Ads[0];

      return WL.textures.load(image, '').then((texture) => {
        return { texture, imageSrc: image, url, campaignId: activeCampaign.CampaignId };
      });
    },
  }
);
