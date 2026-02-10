# Zesty Wonderland SDK

[Zesty Market](https://zesty.xyz) Banner integration for [Wonderland Engine](https://wonderlandengine.com).

## Getting started

### Using Internal Bundler

Build the SDK with the following commands (or download a prebuilt version from
[releases](https://github.com/zestymarket/zesty-sdk/releases)).

```sh
yarn
yarn build
```

If you've run `yarn` at the top level, you don't need to run it here again.

After building the SDK, copy `dist/zesty-wonderland-sdk.min.js` into your project
and add a JavaScript path. You will find the `zesty-banner` component in
"Property View > Add Component" after selecting any object.

Make sure that you set up a cursor to enable clicking.

### Using npm

Install the SDK in your project using npm:

```sh
npm i --save @zestyxyz/wonderland-sdk
```

Then import it in your main bundle file:

```js
require('@zestyxyz/wonderland-sdk');
```

If your bundle built successfully, you will find the `zesty-banner` component in
"Property View > Add Component" after selecting any object.

Make sure that you set up a cursor to enable clicking.

## Configuring

To set up the `zesty-banner` component, make sure to create an account and ad unit on the market,
[find more info here](https://zestyxyz.notion.site/Docs-346d6f9aa8544cf9a5484c3ccf61523a).

 1. Right-click "root" > Add Object > Mesh.
 2. Set mesh to "PrimitivePlane".
 3. Create a material in "Views > Resources > Materials".
 4. Assign the material to your plane.
 5. Add a `zesty-banner` component and copy your creator ID and ad unit ID into the respective
    fields.
