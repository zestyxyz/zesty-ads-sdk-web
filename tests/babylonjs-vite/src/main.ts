import { Engine, Scene, Color3, Color4, Vector3, UniversalCamera, HemisphericLight, StandardMaterial, MeshBuilder } from '@babylonjs/core';
import ZestyBanner from '@zestyxyz/babylonjs-sdk';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new Engine(canvas, true);

const createScene = async () => {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0, 0, 1, 1);

  const camera = new UniversalCamera('camera', new Vector3(0, 1, 0), scene);
  camera.attachControl(canvas, true);

  const xrHelper = await scene.createDefaultXRExperienceAsync();

  const light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);

  const groundMaterial = new StandardMaterial('groundMaterial', scene);
  groundMaterial.diffuseColor = Color3.Green();

  const ground = MeshBuilder.CreateGround('ground', { width: 10, height: 10 });
  ground.material = groundMaterial;

  const zestyBanner1 = new ZestyBanner(
    '00000000-0000-0000-0000-000000000000',
    'medium-rectangle',
    'standard',
    1,
    scene,
    xrHelper,
    true,
    true,
    {
      modalTrigger: 'lose',
      modalBackground: true,
      modalDelay: 5000,
    }
  );
  zestyBanner1.position = new Vector3(0, 2, 2);

  const zestyBanner2 = new ZestyBanner(
    '10000000-0000-4000-8000-000000000000',
    'billboard',
    'standard',
    1,
    scene,
    xrHelper
  );
  zestyBanner2.position = new Vector3(0, 1, 2);

  const zestyBanner3 = new ZestyBanner(
    '20000000-0000-4000-8000-000000000000',
    'mobile-phone-interstitial',
    'standard',
    1,
    scene,
    xrHelper
  );
  zestyBanner3.position = new Vector3(0, 0, 2);

  (window as any).scene = scene;

  return scene;
};

createScene().then((scene) => {
  engine.runRenderLoop(() => {
    scene.render();
  });
});

window.addEventListener('resize', () => {
  engine.resize();
});
