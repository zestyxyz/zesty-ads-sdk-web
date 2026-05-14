# @borellion/web-sdk

Monetize your web experiences with Borellion banner ads via Web Components.

## Installation

**CDN:**
```html
<script src="https://cdn.borellion.com/sdk/borellion-web-sdk.js"></script>
```

**NPM:**
```sh
npm install @borellion/web-sdk
```

## Quick Start

```html
<borellion-ad
  ad-unit="YOUR_AD_UNIT_ID"
  format="medium-rectangle"
  width="300px">
</borellion-ad>
```

## Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `ad-unit` | yes | Your ad unit ID |
| `format` | yes | `billboard`, `medium-rectangle`, or `mobile-phone-interstitial` |
| `width` | no | Width of the banner element (e.g. `300px`, `100%`) |

## Banner Formats

| Format | Dimensions |
|--------|-----------|
| `medium-rectangle` | 300 x 250 |
| `billboard` | 970 x 250 |
| `mobile-phone-interstitial` | 750 x 1334 |

## Testing Locally

Add `?debug=true` to your URL to load sample ads during development.

## Documentation

Full integration guide: [borellion.com/docs](https://www.borellion.com/docs/guides/developers/integrate/web)
