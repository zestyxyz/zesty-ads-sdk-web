# Zesty Babylon.js Integration

This is the Babylon.js SDK for Zesty Banner integration. TypeScript type declarations are included.

## Getting Started

There are two main ways to integrate this SDK.

## Using Script Tag

This is an older approach but still works. Add this to the head of your page:
```html
<script src="https://cdn.babylonjs.com/babylon.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@zestyxyz/babylonjs-sdk"></script>
```
Then in your JavaScript, after scene and xrHelper are created:
```javascript
const zestyBanner = new ZestyBanner(
  "your-ad-unit-id",
  "medium-rectangle",
  "standard",
  1,
  scene,
  xrHelper,
  true,  // beacon
  true,  // prebid
  {
    customDefaultImage: "https://example.com/fallback.png",
    customDefaultCtaUrl: "https://www.example.com",
    modalTrigger: "lose",
    modalBackground: true,
    modalDelay: 5000,
  }
);
zestyBanner.position = new BABYLON.Vector3(0, 2, 2);
```

## Using TypeScript/JavaScript Modules

This is the recommended approach for Babylon.js 6.0+.

Install the package:
```bash
npm i --save @zestyxyz/babylonjs-sdk
```

Import and use:
```typescript
import { Vector3 } from '@babylonjs/core';
import ZestyBanner from '@zestyxyz/babylonjs-sdk';

const banner = new ZestyBanner(
  'your-ad-unit-id',
  'medium-rectangle',
  'standard',
  1,
  scene,
  xrHelper
);
banner.position = new Vector3(0, 2, 2);
```

## Constructor Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `adUnit` | `string` | *required* | Your Zesty ad unit ID |
| `format` | `string` | *required* | Banner format (see below) |
| `style` | `string` | *required* | Visual style: `'standard'`, `'minimal'`, or `'transparent'` |
| `height` | `number` | *required* | Height of the banner in scene units |
| `scene` | `Scene` | *required* | The Babylon.js scene |
| `webXRExperienceHelper` | `WebXRDefaultExperience` | `null` | XR helper for WebXR projects |
| `beacon` | `boolean` | `true` | Whether to send analytics events |
| `prebid` | `boolean` | `true` | Whether to use Prebid for programmatic ads |
| `config` | `object` | `{}` | Additional configuration (see below) |

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `customDefaultImage` | `string` | `null` | URL for a custom fallback image |
| `customDefaultCtaUrl` | `string` | `null` | URL for the fallback image click-through |
| `modalTrigger` | `string` | `null` | DOM event name that triggers an ad modal |
| `modalBackground` | `boolean` | `false` | Whether the modal has a background overlay |
| `modalDelay` | `number` | `0` | Delay in ms before the modal appears |

## Banner Formats

| Format | Aspect Ratio |
|--------|-------------|
| `medium-rectangle` | 1.2 : 1 |
| `billboard` | 3.88 : 1 |
| `mobile-phone-interstitial` | 0.56 : 1 |
| `tall` | 0.75 : 1 |
| `wide` | 4 : 1 |
| `square` | 1 : 1 |

The banner width is calculated automatically from the format and height.

## Peer Dependency

This SDK requires `@babylonjs/core` as a peer dependency (v5+).
