import * as THREE from 'three';
import React, { useRef, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { sendOnLoadMetric, sendOnClickMetric, fetchCampaignAd, AD_REFRESH_INTERVAL } from '../../utils/networking';
import { formats, defaultFormat, defaultStyle } from '../../utils/formats';
import { openURL, visibilityCheck, constructAdModal } from '../../utils/helpers';

export * from '../../utils/formats';
import { version } from '../package.json';

console.log('Zesty SDK Version: ', version);

let modalTriggers = {};

export default function ZestyBanner(props) {
  const [bannerData, setBannerData] = useState(false);
  const [material, setMaterial] = useState(new THREE.MeshBasicMaterial());
  const [refreshInterval, setRefreshInterval] = useState(null);
  const { scene, gl } = useThree();
  const mesh = useRef();

  const adUnit = props.adUnit;
  const format = props.format ?? defaultFormat;

  const width = props.width ?? formats[format].width;
  const height = props.height ?? formats[format].height;

  const newStyle = props.style ?? defaultStyle;
  const beacon = props.beacon ?? true;

  const customDefaultImage = props.customDefaultImage ?? null;
  const customDefaultCtaUrl = props.customDefaultCtaUrl ?? null;

  const modalTrigger = props.modalTrigger ?? null;
  const modalBackground = props.modalBackground ?? false;
  const modalDelay = props.modalDelay ?? 0;

  const loadBanner = async (adUnit, format, style) => {
    const activeCampaign = await fetchCampaignAd(adUnit, format, style, customDefaultImage, customDefaultCtaUrl);
    const { asset_url, cta_url } = activeCampaign.Ads[0];

    // Hook up modal trigger
    if (modalTrigger) {
      // Remove old listener if it exists
      if (modalTriggers[adUnit]) {
        document.removeEventListener(modalTrigger, modalTriggers[adUnit]);
      }

      // Create and store new handler
      modalTriggers[adUnit] = () => {
        let modal = constructAdModal(adUnit, activeCampaign.CampaignId, format, asset_url, cta_url, modalBackground, modalDelay);
        document.body.appendChild(modal);
      };

      document.addEventListener(modalTrigger, modalTriggers[adUnit]);
    }

    return { asset_url, cta_url, campaignId: activeCampaign.CampaignId }
  };

  useEffect(() => {
    loadBanner(adUnit, format, newStyle).then((data) => {
      if (beacon) sendOnLoadMetric(adUnit, data.campaignId);
      setBannerData({ image: data.asset_url, url: data.cta_url, campaignId: data.campaignId });
      mesh.current.url = data.cta_url;
    });
  }, [adUnit]);

  useEffect(() => {
    if (bannerData) {
      new THREE.TextureLoader().load(bannerData.image, tex => {
        const material = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        setMaterial(material);
      });
    }
  }, [bannerData]);


  const onClick = (event) => {
    const banner = bannerData;
    let url = banner.url || banner.properties?.url;
    openURL(url);
    if (props.beacon) sendOnClickMetric(props.adUnit, bannerData.campaignId);
  };

  const getCamera = () => {
    /** @type {THREE.Camera} */
    let camera = null;

    // Get the origin of the camera
    if (gl.xr.isPresenting) {
      camera = gl.xr.getCamera();
    } else {
      camera = scene.getObjectByProperty('isCamera', true);
    }

    return camera;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const camera = getCamera();
      mesh.current.geometry.computeBoundingBox();
      const bb = new THREE.Box3().setFromObject(mesh.current);
      const isVisible = visibilityCheck(
        bb.min.toArray(),
        bb.max.toArray(),
        camera.projectionMatrix.toArray(),
        camera.matrixWorld.toArray(),
      );
      if (isVisible) {
        loadBanner(adUnit, format, newStyle).then(banner => {
          setMaterial(new THREE.MeshBasicMaterial({ map: banner.texture, transparent: true }));
          this.banner = banner;
        });
      }
    }, AD_REFRESH_INTERVAL);
    setRefreshInterval(interval);
  }, []);

  return (
    <mesh {...props} ref={mesh} scale={0.5} onClick={onClick} material={material}>
      <planeGeometry
        args={[formats[format].width * height, height]}
      />
    </mesh>
  );
}
