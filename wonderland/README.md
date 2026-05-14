# @borellion/wonderland-sdk

Monetize your Wonderland Engine WebXR experiences with Borellion banner ads.

## Installation

```sh
npm install @borellion/wonderland-sdk
```

Register the component with your Wonderland Engine app:

```js
import { Borellion } from '@borellion/wonderland-sdk';

engine.registerComponent(Borellion);
```

## Quick Start

Add a mesh object to your scene and attach the `borellion` component:

```js
const bannerObject = engine.scene.addObject();
bannerObject.addComponent(Borellion, {
  adUnit: 'YOUR_AD_UNIT_ID',
  format: 5, // 5 = medium-rectangle
});
```

The component requires a `mesh` component on the same object. `cursor-target` and `collision` components are created automatically if not present.

## Properties

| Property | Required | Default | Description |
|----------|----------|---------|-------------|
| `adUnit` | yes | — | Your ad unit ID |
| `format` | no | `square` | `billboard`, `medium-rectangle`, `mobile-phone-interstitial`, `tall`, `wide`, or `square` |
| `style` | no | `transparent` | `standard`, `minimal`, or `transparent` |
| `scaleToRatio` | no | `true` | Scale object width to match banner aspect ratio |
| `beacon` | no | `true` | Set to `false` to opt out of analytics |
| `prebid` | no | `true` | Set to `false` to disable Prebid and fetch ads directly |
| `customDefaultImage` | no | — | Custom image URL when no ad is running |
| `customDefaultCtaUrl` | no | — | Custom CTA URL when no ad is running |

## Banner Formats

| Format | Dimensions |
|--------|-----------|
| `medium-rectangle` | 300 x 250 |
| `billboard` | 970 x 250 |
| `mobile-phone-interstitial` | 750 x 1334 |

## Testing Locally

Add `?debug=true` to your URL to load sample ads during development.

## Documentation

Full integration guide: [borellion.com/docs](https://www.borellion.com/docs/guides/developers/integrate/wonderland)
