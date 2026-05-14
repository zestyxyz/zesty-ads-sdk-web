# @borellion/aframe-sdk

Monetize your A-Frame WebXR experiences with Borellion banner ads.

## Installation

**CDN:**
```html
<script src="https://cdn.borellion.com/sdk/borellion-aframe-sdk.js"></script>
```

**NPM:**
```sh
npm install @borellion/aframe-sdk
```

## Quick Start

Add a banner to your `<a-scene>`:

```html
<a-entity borellion="adUnit: YOUR_AD_UNIT_ID; format: medium-rectangle;" position="0 2 0"></a-entity>
```

## Options

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `adUnit` | yes | — | Your ad unit ID |
| `format` | yes | — | `billboard`, `medium-rectangle`, or `mobile-phone-interstitial` |
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

Full integration guide: [borellion.com/docs](https://www.borellion.com/docs/guides/developers/integrate/a-frame)
