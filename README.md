# Borellion Ads SDK

Monetize your 3D and WebXR experiences with the Borellion Ads SDK. Display banner ads in virtual environments across multiple frameworks.

## Supported Platforms

| Platform | Package | Install |
|----------|---------|---------|
| [A-Frame](./aframe) | `@borellion/aframe-sdk` | `npm i @borellion/aframe-sdk` |
| [Babylon.js](./babylonjs) | `@borellion/babylonjs-sdk` | `npm i @borellion/babylonjs-sdk` |
| [PlayCanvas](./playcanvas) | `@borellion/playcanvas-sdk` | `npm i @borellion/playcanvas-sdk` |
| [React Three Fiber](./r3f) | `@borellion/r3f-sdk` | `npm i @borellion/r3f-sdk` |
| [Three.js](./threejs) | `@borellion/threejs-sdk` | `npm i @borellion/threejs-sdk` |
| [Web Components](./web) | `@borellion/web-sdk` | `npm i @borellion/web-sdk` |
| [Wonderland Engine](./wonderland) | `@borellion/wonderland-sdk` | `npm i @borellion/wonderland-sdk` |

## Quick Start

1. **Create an ad unit** at [borellion.com](https://www.borellion.com) to get your Ad Unit ID
2. **Install the SDK** for your framework (see table above)
3. **Add a banner** to your scene:

```jsx
// React Three Fiber example
import { BorellionBanner } from '@borellion/r3f-sdk';

<BorellionBanner
  adUnit="your-ad-unit-id"
  format="medium-rectangle"
  position={[0, 2, -3]}
/>
```

```javascript
// Three.js example
import { BorellionBanner } from '@borellion/threejs-sdk';

const banner = new BorellionBanner({
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

Full integration guides for each platform: [borellion.com](https://www.borellion.com)

## Development

```bash
# Install dependencies (uses yarn workspaces)
yarn

# Build all SDKs
yarn build

# Run tests
yarn test
```
