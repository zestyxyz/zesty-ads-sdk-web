import { sendOnLoadMetric, sendOnClickMetric, fetchCampaignAd } from '../../utils/networking';
import { formats, defaultFormat, defaultStyle } from '../../utils/formats';
import { openURL } from '../../utils/helpers';
import { version } from '../package.json';

console.log('Zesty SDK Version: ', version);

class Zesty extends HTMLElement {
  constructor() {
    super();
    this.adUnit = '';
    this.format = defaultFormat;
    this.bannerstyle = defaultStyle;
    this.width = '100%';
    this.height = '100%';
    this.shadow = this.attachShadow({ mode: 'open' });
    this.beacon = true;

    this.adjustHeightandWidth = this.adjustHeightandWidth.bind(this);
  }

  connectedCallback() {
    this.style.cursor = 'pointer';

    this.adUnit = this.hasAttribute('ad-unit') ? this.getAttribute('ad-unit') : this.adUnit;
    this.format = this.hasAttribute('format') ? this.getAttribute('format') : this.format;
    this.bannerstyle = this.hasAttribute('bannerstyle')
      ? this.getAttribute('bannerstyle')
      : this.bannerstyle;
    this.height = this.hasAttribute('height') ? this.getAttribute('height') : this.height;
    this.width = this.hasAttribute('width') ? this.getAttribute('width') : this.width;
    this.beacon = this.hasAttribute('beacon') ? this.getAttribute('beacon') : this.beacon;

    this.adjustHeightandWidth();

    async function loadBanner(adUnit, format, style, shadow, width, height, beacon) {
      const activeCampaign = await fetchCampaignAd(adUnit, format, style);

      const { id, asset_url: image, cta_url: url } = activeCampaign.Ads[0];

      const img = document.createElement('img');
      shadow.appendChild(img);
      img.setAttribute('id', id);
      img.style.width = width;
      img.style.height = height;
      img.setAttribute('crossorigin', '');
      img.setAttribute('data-url', url);
      img.addEventListener('click', (e) => {
        e.preventDefault();
        openURL(url);
        if (beacon) {
          sendOnClickMetric(adUnit, activeCampaign.CampaignId);
        }
      });

      if (beacon) {
        sendOnLoadMetric(adUnit, activeCampaign.CampaignId);
      }

      if (image) {
        img.setAttribute('src', image);
        return new Promise((resolve, reject) => {
          img.onload = () => resolve({ img, url });
          img.onerror = () => reject(new Error('img load error'));
        });
      } else {
        return { id: 'blank' };
      }
    }

    loadBanner(
      this.adUnit,
      this.format,
      this.bannerstyle,
      this.shadow,
      this.width,
      this.height,
      this.beacon
    );
  }

  /**
   * Adjusts height and width after setting initial values in order to scale the image correctly.
   */
  adjustHeightandWidth() {
    // Use regex to split height/width and its suffix.
    // Will get an array of ['', num, suffix].
    const numMatch = /(\d+)/;
    const height = this.height.split(numMatch);
    const width = this.width.split(numMatch);
    // If height was set explicitly, keep it.
    // Otherwise, scale it off the width according to format or keep the default if neither were set.
    this.height = this.hasAttribute('height')
      ? this.height
      : this.hasAttribute('width')
      ? `${width[1] / formats[this.format].width}${width[2]}`
      : this.height;
    // If height was set explicitly, scale width off of it according to format.
    // Otherwise, use explicitly set width or use default value if neither were set.
    this.width = this.hasAttribute('height')
      ? `${height[1] * formats[this.format].width}${height[2]}`
      : this.hasAttribute('width')
      ? this.width
      : this.width;
  }
}

customElements.define('zesty-web', Zesty);