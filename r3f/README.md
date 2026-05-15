# @borellion/r3f-sdk

Monetize your React Three Fiber WebXR experiences with Borellion banner ads.

## Installation

```sh
npm install @borellion/r3f-sdk
```

## Quick Start

```jsx
import { Borellion } from '@borellion/r3f-sdk';

function Scene() {
  return (
    <Borellion
      adUnit="YOUR_AD_UNIT_ID"
      format="medium-rectangle"
      position={[0, 2, -3]}
    />
  );
}
```

For WebXR experiences, use the XR variant:

```js
import { BorellionXR } from '@borellion/r3f-sdk/xr';
```

## Props

| Prop | Required | Default | Description |
|------|----------|---------|-------------|
| `adUnit` | yes | — | Your ad unit ID |
| `format` | yes | — | `billboard`, `medium-rectangle`, or `mobile-phone-interstitial` |
| `position` | no | `[0, 0, 0]` | Position in the scene |
| `height` | no | `1` | Scale of the banner |
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

Full integration guide: [borellion.com/docs](https://www.borellion.com/docs/guides/developers/integrate/r3f)
