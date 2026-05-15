# @borellion/threejs-sdk

Monetize your three.js WebXR experiences with Borellion banner ads.

## Installation

```sh
npm install @borellion/threejs-sdk
```

```js
import Borellion from '@borellion/threejs-sdk';
```

## Quick Start

```js
const banner = new Borellion('YOUR_AD_UNIT_ID', 'medium-rectangle', 'standard', 3);
scene.add(banner);
```

## Constructor

```js
new Borellion(adUnit, format, style, height, renderer, beacon, prebid)
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `adUnit` | yes | — | Your ad unit ID |
| `format` | yes | — | `billboard`, `medium-rectangle`, or `mobile-phone-interstitial` |
| `style` | yes | — | `standard`, `minimal`, or `transparent` |
| `height` | yes | — | Scale of the banner |
| `renderer` | no | `null` | Pass the `WebGLRenderer` when building a WebXR experience |
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

Full integration guide: [borellion.com/docs](https://www.borellion.com/docs/guides/developers/integrate/threejs)
