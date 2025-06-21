#!/bin/bash

cd utils && yarn
cd ..
cd aframe && yarn && yarn run build
cd ..
cd babylonjs && yarn && yarn run build
cd ..
cd beacon && yarn && yarn run build
cd ..
cd playcanvas && yarn && yarn run build:editor && yarn run build:no-editor
cd ..
cd r3f && yarn && yarn run build
cd ..
cd threejs && yarn && yarn run build
cd ..
cd wonderland && yarn && yarn run build && yarn run build-compat
cd ..
cd utils && yarn && yarn run build && yarn run build-networking
cd ..

cp -R aframe/dist dist
cp -R babylonjs/dist/* dist
cp -R beacon/dist* dist
cp -R playcanvas/dist/* dist
cp -R r3f/dist/* dist
cp -R threejs/dist/* dist
cp unity/zesty-unity-sdk.unitypackage dist
cp -R wonderland/dist/* dist
cp -R utils/dist/* dist
cp -R assets dist