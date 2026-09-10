const THREE = require('./js/three.min.js');

const scene = new THREE.Scene();
const hairGroup = new THREE.Group();
scene.add(hairGroup);

const aiState = {
  selectedHairstyleId: 'hs-1',
  selectedColorHex: '#2b1d0f',
  hairGloss: 0.85,
  hairVolume: 1.0,
  beardStyle: 'stubble'
};

const threeApp = {
  hairGroup: hairGroup,
  strands: []
};

function adjustColorHSL(colorInput, dH, dS, dL) {
  const c = new THREE.Color(colorInput);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  let h = (hsl.h + dH) % 1;
  if (h < 0) h += 1;
  let s = Math.max(0, Math.min(1, hsl.s + dS));
  let l = Math.max(0, Math.min(1, hsl.l + dL));
  c.setHSL(h, s, l);
  return c;
}

function build3DHairstyle(styleId, colorHex) {
  try {
    const hairGroup = threeApp.hairGroup;
    while (hairGroup.children.length > 0) {
      const child = hairGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      hairGroup.remove(child);
    }
    threeApp.strands = [];

    const color = new THREE.Color(colorHex);
    const hairMaterial = new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: Math.max(0.18, 0.62 - aiState.hairGloss * 0.42),
      metalness: 0.16,
      clearcoat: Math.min(1.0, aiState.hairGloss * 0.85),
      clearcoatRoughness: 0.22,
      side: THREE.DoubleSide
    });
    threeApp.hairMaterial = hairMaterial;

    const baseCapGeo = new THREE.SphereGeometry(0.74, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.56);
    const baseCapMesh = new THREE.Mesh(baseCapGeo, hairMaterial);
    baseCapMesh.position.set(0, 0.20, -0.02);
    baseCapMesh.scale.set(1.03, 1.02, 1.05);
    hairGroup.add(baseCapMesh);

    const addSideFades = (height = 0.45, yPos = 0.22) => {
      [-1, 1].forEach(side => {
        const fadeGeo = new THREE.CylinderGeometry(0.725, 0.695, height, 24, 1, true, side > 0 ? 0.25 : Math.PI - 1.15, 0.9);
        const fadeMat = new THREE.MeshStandardMaterial({
          color: color.clone().multiplyScalar(0.72),
          roughness: 0.88,
          metalness: 0.08
        });
        const fadeMesh = new THREE.Mesh(fadeGeo, fadeMat);
        fadeMesh.position.set(0, yPos, -0.05);
        hairGroup.add(fadeMesh);
      });
    };

    if (styleId === 'hs-1') {
      addSideFades(0.48, 0.22);
      for (let i = -10; i <= 10; i++) {
        const xOffset = i * 0.046;
        const arc = (1 - Math.pow(i / 11, 2));
        const heightArc = arc * 0.42;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xOffset * 0.65, 0.72 + heightArc * 0.5, 0.54),
          new THREE.Vector3(xOffset * 0.82, 1.02 + heightArc, 0.36),
          new THREE.Vector3(xOffset * 0.88, 1.08 + heightArc * 0.7, 0.06),
          new THREE.Vector3(xOffset * 0.95, 0.96 + heightArc * 0.25, -0.22),
          new THREE.Vector3(xOffset * 0.85, 0.68, -0.48)
        ]);
        const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.044 + arc * 0.026, 8, false);
        const strandMesh = new THREE.Mesh(tubeGeo, hairMaterial);
        hairGroup.add(strandMesh);
        threeApp.strands.push({ mesh: strandMesh, phase: i * 0.25, baseCurve: curve });
      }
    }
    console.log('Successfully built hair! Children count:', hairGroup.children.length);
  } catch (err) {
    console.error('Error building hair:', err);
  }
}

build3DHairstyle('hs-1', '#2b1d0f');
