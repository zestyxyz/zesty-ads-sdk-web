declare module '@zestyxyz/babylonjs-sdk' {
  import { Scene, WebXRDefaultExperience } from '@babylonjs/core';

  interface ZestyBannerConfig {
    customDefaultImage?: string;
    customDefaultCtaUrl?: string;
    modalTrigger?: string;
    modalBackground?: boolean;
    modalDelay?: number;
  }

  export default class ZestyBanner {
    constructor(
      adUnit: string,
      format: string,
      style: string,
      height: number,
      scene: Scene,
      webXRExperienceHelper?: WebXRDefaultExperience | null,
      beacon?: boolean,
      prebid?: boolean,
      config?: ZestyBannerConfig
    );
  }
}
