# com.borellion.unity-sdk

Monetize your Unity WebXR and VR experiences with Borellion banner ads.

## Installation

### Option A: Asset Package

Download and import the `.unitypackage` via `Assets > Import Package > Custom Package`.

### Option B: Package Manager

1. Open the Package Manager (`Window > Package Manager`)
2. Click `+` > `Add package from git URL`
3. Enter: `https://github.com/borellion/sdk`

## Quick Start

1. Add the **BorellionSDK** prefab to your scene hierarchy
2. Add the **Banner** prefab to your scene
3. In the Inspector, set your **Ad Unit ID** and **Format** from your Borellion Dashboard

## Options

| Field | Default | Description |
|-------|---------|-------------|
| Ad Unit ID | — | Your ad unit ID from the Borellion Dashboard |
| Format | — | `Medium Rectangle`, `Billboard`, or `Mobile Phone Interstitial` |
| Beacon Enabled | `true` | Uncheck to opt out of analytics |
| Prebid Enabled | `true` | Uncheck to disable Prebid and fetch ads directly |

## Banner Formats

| Format | Dimensions |
|--------|-----------|
| Medium Rectangle | 300 x 250 |
| Billboard | 970 x 250 |
| Mobile Phone Interstitial | 750 x 1334 |

## Documentation

Full integration guide: [borellion.com/docs](https://www.borellion.com/docs/guides/developers/integrate/unity)
