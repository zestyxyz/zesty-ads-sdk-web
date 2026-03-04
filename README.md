# Zesty Ads SDK

Monetize your 3D and WebXR experiences with the Zesty Ads SDK. Display banner ads in virtual environments across multiple frameworks.

[![Documentation](https://img.shields.io/badge/docs-zesty.xyz-blue)](https://docs.zesty.xyz)

## Supported Platforms

| Platform | Package | Install |
|----------|---------|---------|
| [A-Frame](./aframe) | `@zestyxyz/aframe-sdk` | `npm i @zestyxyz/aframe-sdk` |
| [Babylon.js](./babylonjs) | `@zestyxyz/babylonjs-sdk` | `npm i @zestyxyz/babylonjs-sdk` |
| [PlayCanvas](./playcanvas) | `@zestyxyz/playcanvas-sdk` | `npm i @zestyxyz/playcanvas-sdk` |
| [React Three Fiber](./r3f) | `@zestyxyz/r3f-sdk` | `npm i @zestyxyz/r3f-sdk` |
| [Three.js](./threejs) | `@zestyxyz/threejs-sdk` | `npm i @zestyxyz/threejs-sdk` |
| [Web Components](./web) | `@zestyxyz/web-sdk` | `npm i @zestyxyz/web-sdk` |
| [Wonderland Engine](./wonderland) | `@zestyxyz/wonderland-sdk` | `npm i @zestyxyz/wonderland-sdk` |

## Quick Start

1. **Create an ad unit** at [zesty.xyz](https://www.zesty.xyz) to get your Ad Unit ID
2. **Install the SDK** for your framework (see table above)
3. **Add a banner** to your scene:

```jsx
// React Three Fiber example
import { ZestyBanner } from '@zestyxyz/r3f-sdk';

<ZestyBanner
  adUnit="your-ad-unit-id"
  format="medium-rectangle"
  position={[0, 2, -3]}
/>
```

```javascript
// Three.js example
import { ZestyBanner } from '@zestyxyz/threejs-sdk';

const banner = new ZestyBanner({
  adUnit: 'your-ad-unit-id',
  format: 'medium-rectangle',
});
scene.add(banner);
```

## Banner Formats

| Format | Dimensions | Use Case |
|--------|-----------|----------|
| `medium-rectangle` | 300 x 250 | General purpose |
| `billboard` | 970 x 250 | Wide displays |
| `mobile-phone-interstitial` | 750 x 1334 | Tall/portrait displays |

## Testing Locally

Add `?debug=true` to your URL to load sample ads during development:
```
http://localhost:3000/?debug=true
```

## Documentation

Full integration guides for each platform: [docs.zesty.xyz](https://docs.zesty.xyz/guides/developers/integrate)

## Development

```bash
# Install dependencies (uses yarn workspaces)
yarn

# Build all SDKs
yarn build

# Run tests
yarn test
```
