import { Scene, Mesh, WebXRDefaultExperience } from '@babylonjs/core';

export type BannerFormat =
  | 'tall'
  | 'wide'
  | 'square'
  | 'mobile-phone-interstitial'
  | 'billboard'
  | 'medium-rectangle';

export type BannerStyle = 'standard' | 'minimal' | 'transparent';

export interface ZestyBannerConfig {
  customDefaultImage?: string;
  customDefaultCtaUrl?: string;
  modalTrigger?: string;
  modalBackground?: boolean;
  modalDelay?: number;
}

interface ZestyBannerConstructor {
  new (
    adUnit: string,
    format: BannerFormat,
    style: BannerStyle,
    height: number,
    scene: Scene,
    webXRExperienceHelper?: WebXRDefaultExperience | null,
    beacon?: boolean,
    prebid?: boolean,
    config?: ZestyBannerConfig
  ): Mesh;
}

declare const ZestyBanner: ZestyBannerConstructor;
export default ZestyBanner;
