# @borellion/babylonjs-sdk

Monetize your Babylon.js WebXR experiences with Borellion banner ads.

## Installation

**CDN:**
```html
<script src="https://cdn.borellion.com/sdk/borellion-babylonjs-sdk.js"></script>
```

**NPM:**
```sh
npm install @borellion/babylonjs-sdk
```

```js
import Borellion from '@borellion/babylonjs-sdk';
```

## Quick Start

```js
const banner = new Borellion('YOUR_AD_UNIT_ID', 'medium-rectangle', 'standard', 3, scene);
```

## Constructor

```js
new Borellion(adUnit, format, style, height, scene, webXRExperienceHelper, beacon, prebid)
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `adUnit` | yes | — | Your ad unit ID |
| `format` | yes | — | `billboard`, `medium-rectangle`, or `mobile-phone-interstitial` |
| `style` | yes | — | `standard`, `minimal`, or `transparent` |
| `height` | yes | — | Scale of the banner |
| `scene` | yes | — | Reference to your Babylon.js scene |
| `webXRExperienceHelper` | no | `null` | Reference to a Babylon.js WebXR Experience Helper |
| `beacon` | no | `true` | Set to `false` to opt out of analytics |
| `prebid` | no | `true` | Set to `false` to disable Prebid and fetch ads directly |

## Banner Formats

| Format | Dimensions |
|--------|-----------|
| `medium-rectangle` | 300 x 250 |
| `billboard` | 970 x 250 |
| `mobile-phone-interstitial` | 750 x 1334 |

## Testing Locally

Add `?debug=true` to your URL to load sample ads during development.

## Documentation

Full integration guide: [borellion.com/docs](https://www.borellion.com/docs/guides/developers/integrate/babylonjs)
