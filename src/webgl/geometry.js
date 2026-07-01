export function createSphere(latitudeBands = 36, longitudeBands = 36) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let lat = 0; lat <= latitudeBands; lat++) {
    const theta = lat * Math.PI / latitudeBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= longitudeBands; lon++) {
      const phi = lon * 2 * Math.PI / longitudeBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      positions.push(x, y, z);
      normals.push(x, y, z);
    }
  }

  for (let lat = 0; lat < latitudeBands; lat++) {
    for (let lon = 0; lon < longitudeBands; lon++) {
      const first = lat * (longitudeBands + 1) + lon;
      const second = first + longitudeBands + 1;
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    vertexCount: positions.length / 3,
    triangleCount: indices.length / 3
  };
}

export function createOrbitCircle(radius, segments = 160) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i < segments; i++) {
    const angle = i * 2 * Math.PI / segments;
    positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    normals.push(0, 1, 0);
    indices.push(i);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    vertexCount: segments,
    triangleCount: 0
  };
}

export function createAnnulus(innerRadius = 0.8, outerRadius = 1.2, segments = 128) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const angle = i * 2 * Math.PI / segments;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    positions.push(c * innerRadius, 0, s * innerRadius);
    normals.push(0, 1, 0);
    positions.push(c * outerRadius, 0, s * outerRadius);
    normals.push(0, 1, 0);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    vertexCount: positions.length / 3,
    triangleCount: indices.length / 3
  };
}

export function createStarField(count = 900, spread = 65) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const radius = spread * (0.65 + Math.random() * 0.35);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    positions.push(x, y, z);
    normals.push(0, 0, 1);
    indices.push(i);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
    vertexCount: count,
    triangleCount: 0
  };
}
