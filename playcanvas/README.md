# @borellion/playcanvas-sdk

Monetize your PlayCanvas WebXR experiences with Borellion banner ads.

## Installation

**Editor:** Download and import `borellion-playcanvas-sdk-editor.js` from the CDN:
```
https://cdn.borellion.com/sdk/borellion-playcanvas-sdk-editor.js
```

**NPM (Engine):**
```sh
npm install @borellion/playcanvas-sdk
```

```js
import Borellion from '@borellion/playcanvas-sdk';
```

**CDN (Engine):**
```js
import Borellion from 'https://cdn.borellion.com/sdk/borellion-playcanvas-sdk.js';
```

## Quick Start

### PlayCanvas Editor

1. Import the editor script into your project
2. Create a new entity, attach a script component, and add the `borellion` script
3. Configure the ad unit ID and format in the Inspector

### PlayCanvas Engine

```js
const banner = new pc.Entity();
banner.addComponent('script');
banner.script.create('borellion');
banner.script['borellion'].adUnitId = 'YOUR_AD_UNIT_ID';
banner.script['borellion'].format = format;
banner.script['borellion'].cameraEntity = camera;
app.root.addChild(banner);
```

## Options

| Property | Required | Default | Description |
|----------|----------|---------|-------------|
| `adUnitId` | yes | — | Your ad unit ID |
| `format` | yes | — | `Medium Rectangle` (1), `Billboard` (2), or `Mobile Phone Interstitial` (3) |
| `cameraEntity` | yes | — | The main camera entity in your scene |
| `prebid` | no | `true` | Set to `false` to disable Prebid and fetch ads directly |

## Banner Formats

| Format | Dimensions |
|--------|-----------|
| Medium Rectangle | 300 x 250 |
| Billboard | 970 x 250 |
| Mobile Phone Interstitial | 750 x 1334 |

## Testing Locally

Add `?debug=true` to your URL to load sample ads during development.

## Documentation

Full integration guide: [borellion.com/docs](https://www.borellion.com/docs/guides/developers/integrate/playcanvas)
