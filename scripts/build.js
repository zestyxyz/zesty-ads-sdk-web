const execSync = require('child_process').execSync;

console.log('Building A-Frame:\n' + execSync('cd aframe && yarn build').toString());
console.log('Building babylon.js:\n' + execSync('cd babylonjs && yarn build').toString());
console.log('Building beacon:\n' + execSync('cd beacon && yarn build').toString());
console.log('Building three.js:\n' + execSync('cd threejs && yarn build').toString());
console.log('Building Playcanvas:\n' + execSync('cd playcanvas && yarn build:editor && yarn build:no-editor').toString());
console.log('Building r3f:\n' + execSync('cd r3f && yarn build').toString());
console.log('Building Wonderland:\n' + execSync('cd wonderland && yarn build').toString());
console.log('Building zestyFormats and zestyNetworking:\n' + execSync('cd utils && yarn build && yarn build-networking').toString());
