import React from "react";
import { Canvas } from "@react-three/fiber";
import { XR } from "@react-three/xr";
import { ExposeBanners } from "./ExposeBanners";
import ZestyBanner from "./zesty-reactxr-sdk";

export default () => (
  <Canvas>
    <XR>
      <ExposeBanners />
      <ZestyBanner adUnit='00000000-0000-0000-0000-000000000000' format='medium-rectangle' position={[0, 2, 0]} height={4} beacon={false} customDefaultImage={'https://picsum.photos/300/250'} customDefaultCtaUrl={'https://www.example.com'} />
      <ZestyBanner adUnit='10000000-0000-4000-8000-000000000000' format='billboard' position={[0, 0, 0]} height={4} beacon={false} />
      <ZestyBanner adUnit='20000000-0000-4000-8000-000000000000' format='mobile-phone-interstitial' position={[0, -2, 0]} height={4} beacon={false} />
    </XR>
  </Canvas>
)
