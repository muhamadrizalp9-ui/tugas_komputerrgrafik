import { planets } from "./planets/index.js";
import { createSphere, createOrbitCircle, createAnnulus, createStarField } from "./webgl/geometry.js";
import { createProgram, vertexShaderSource, fragmentShaderSource } from "./webgl/shaders.js";
import {
  add,
  clamp,
  degToRad,
  identity,
  lookAt,
  multiply,
  perspective,
  rotateX,
  rotateY,
  rotateZ,
  scale,
  translate,
  vec3
} from "./webgl/math.js";

const canvas = document.querySelector("#glCanvas");
const renderStatus = document.querySelector("#renderStatus");
const fpsCounter = document.querySelector("#fpsCounter");
const planetSelect = document.querySelector("#planetSelect");
const planetPicker = document.querySelector("#planetPicker");
const objectInfo = document.querySelector("#objectInfo");
const focusBtn = document.querySelector("#focusBtn");
const overviewBtn = document.querySelector("#overviewBtn");
const resetBtn = document.querySelector("#resetBtn");

const controls = {
  translateX: document.querySelector("#translateX"),
  translateY: document.querySelector("#translateY"),
  translateZ: document.querySelector("#translateZ"),
  rotateX: document.querySelector("#rotateX"),
  rotateY: document.querySelector("#rotateY"),
  rotateZ: document.querySelector("#rotateZ"),
  scaleObj: document.querySelector("#scaleObj"),
  lightIntensity: document.querySelector("#lightIntensity"),
  lightX: document.querySelector("#lightX"),
  lightY: document.querySelector("#lightY"),
  lightZ: document.querySelector("#lightZ"),
  speed: document.querySelector("#speed"),
  shadingMode: document.querySelector("#shadingMode")
};

const outputIds = [
  "translateX", "translateY", "translateZ", "rotateX", "rotateY", "rotateZ",
  "scaleObj", "lightIntensity", "lightX", "lightY", "lightZ", "speed"
];
const outputs = Object.fromEntries(outputIds.map((id) => [id, document.querySelector(`#${id}Out`)]));

let gl;
try {
  gl = canvas.getContext("webgl", { antialias: true, alpha: false });
  if (!gl) throw new Error("Browser tidak menyediakan WebGL.");
} catch (error) {
  renderStatus.textContent = error.message;
  throw error;
}

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
gl.useProgram(program);

const locations = {
  aPosition: gl.getAttribLocation(program, "aPosition"),
  aNormal: gl.getAttribLocation(program, "aNormal"),
  uModel: gl.getUniformLocation(program, "uModel"),
  uView: gl.getUniformLocation(program, "uView"),
  uProjection: gl.getUniformLocation(program, "uProjection"),
  uBaseColor: gl.getUniformLocation(program, "uBaseColor"),
  uLightPosition: gl.getUniformLocation(program, "uLightPosition"),
  uCameraPosition: gl.getUniformLocation(program, "uCameraPosition"),
  uLightIntensity: gl.getUniformLocation(program, "uLightIntensity"),
  uAmbientStrength: gl.getUniformLocation(program, "uAmbientStrength"),
  uShadingMode: gl.getUniformLocation(program, "uShadingMode"),
  uEmissive: gl.getUniformLocation(program, "uEmissive"),
  uAlpha: gl.getUniformLocation(program, "uAlpha"),
  uPointSize: gl.getUniformLocation(program, "uPointSize")
};

const sphereMesh = createMesh(createSphere(40, 40));
const starMesh = createMesh(createStarField(1000, 75));
const orbitMeshes = new Map();
const ringMeshes = new Map();

const transformState = new Map(planets.map((planet) => [
  planet.id,
  { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, s: 1 }
]));

const planetRuntime = new Map(planets.map((planet, index) => [
  planet.id,
  {
    angleOffset: index * 0.67,
    position: [0, 0, 0],
    modelMatrix: identity()
  }
]));

const state = {
  selectedPlanetId: "bumi",
  elapsed: 0,
  lastTime: 0,
  fpsTime: 0,
  frameCount: 0,
  camera: {
    yaw: 0.58,
    pitch: 0.34,
    distance: 21.5,
    target: vec3(0, 0, 0),
    dragging: false,
    lastX: 0,
    lastY: 0,
    eye: vec3(0, 0, 21.5),
    movedWhileDragging: false
  },
  light: {
    intensity: 1.25,
    position: vec3(0, 5, 4)
  },
  speed: 1,
  shadingMode: "phong",
  viewMatrix: identity(),
  projectionMatrix: identity(),
  lastPickCandidates: []
};

initializeUi();
initializeMouseCamera();
requestAnimationFrame(render);

function initializeUi() {
  planets.forEach((planet) => {
    const option = document.createElement("option");
    option.value = planet.id;
    option.textContent = planet.name;
    planetSelect.appendChild(option);

    const quickButton = document.createElement("button");
    quickButton.type = "button";
    quickButton.className = "planet-chip";
    quickButton.dataset.planetId = planet.id;
    quickButton.textContent = planet.name;
    quickButton.setAttribute("aria-label", `Fokus ke ${planet.name}`);
    quickButton.addEventListener("click", () => setSelectedPlanet(planet.id, true));
    planetPicker.appendChild(quickButton);
  });
  planetSelect.value = state.selectedPlanetId;

  planetSelect.addEventListener("change", () => {
    setSelectedPlanet(planetSelect.value, true);
  });

  ["translateX", "translateY", "translateZ", "rotateX", "rotateY", "rotateZ", "scaleObj"].forEach((id) => {
    controls[id].addEventListener("input", () => {
      const transform = getSelectedTransform();
      transform.tx = Number(controls.translateX.value);
      transform.ty = Number(controls.translateY.value);
      transform.tz = Number(controls.translateZ.value);
      transform.rx = Number(controls.rotateX.value);
      transform.ry = Number(controls.rotateY.value);
      transform.rz = Number(controls.rotateZ.value);
      transform.s = Number(controls.scaleObj.value);
      updateOutputs();
      updateObjectInfo();
    });
  });

  ["lightIntensity", "lightX", "lightY", "lightZ", "speed"].forEach((id) => {
    controls[id].addEventListener("input", () => {
      state.light.intensity = Number(controls.lightIntensity.value);
      state.light.position = [Number(controls.lightX.value), Number(controls.lightY.value), Number(controls.lightZ.value)];
      state.speed = Number(controls.speed.value);
      updateOutputs();
    });
  });

  controls.shadingMode.addEventListener("change", () => {
    state.shadingMode = controls.shadingMode.value;
    updateObjectInfo();
  });

  focusBtn.addEventListener("click", () => {
    focusOnSelectedPlanet();
  });

  overviewBtn.addEventListener("click", () => {
    setOverviewCamera();
  });

  resetBtn.addEventListener("click", () => {
    transformState.set(state.selectedPlanetId, { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, s: 1 });
    syncTransformControlsFromState();
    updateObjectInfo();
  });

  syncTransformControlsFromState();
  updateOutputs();
  updateActivePlanetButtons();
}

function syncTransformControlsFromState() {
  const transform = getSelectedTransform();
  controls.translateX.value = transform.tx;
  controls.translateY.value = transform.ty;
  controls.translateZ.value = transform.tz;
  controls.rotateX.value = transform.rx;
  controls.rotateY.value = transform.ry;
  controls.rotateZ.value = transform.rz;
  controls.scaleObj.value = transform.s;
  updateOutputs();
}

function updateOutputs() {
  outputs.translateX.textContent = Number(controls.translateX.value).toFixed(2);
  outputs.translateY.textContent = Number(controls.translateY.value).toFixed(2);
  outputs.translateZ.textContent = Number(controls.translateZ.value).toFixed(2);
  outputs.rotateX.textContent = `${Math.round(Number(controls.rotateX.value))}°`;
  outputs.rotateY.textContent = `${Math.round(Number(controls.rotateY.value))}°`;
  outputs.rotateZ.textContent = `${Math.round(Number(controls.rotateZ.value))}°`;
  outputs.scaleObj.textContent = `${Number(controls.scaleObj.value).toFixed(2)}x`;
  outputs.lightIntensity.textContent = Number(controls.lightIntensity.value).toFixed(2);
  outputs.lightX.textContent = Number(controls.lightX.value).toFixed(2);
  outputs.lightY.textContent = Number(controls.lightY.value).toFixed(2);
  outputs.lightZ.textContent = Number(controls.lightZ.value).toFixed(2);
  outputs.speed.textContent = `${Number(controls.speed.value).toFixed(2)}x`;
}


function setSelectedPlanet(planetId, shouldFocus = false) {
  state.selectedPlanetId = planetId;
  planetSelect.value = planetId;
  syncTransformControlsFromState();
  updateActivePlanetButtons();
  updateObjectInfo();

  if (shouldFocus) {
    focusOnSelectedPlanet();
  }
}

function updateActivePlanetButtons() {
  planetPicker.querySelectorAll(".planet-chip").forEach((button) => {
    const isActive = button.dataset.planetId === state.selectedPlanetId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function getSelectedWorldPosition() {
  const runtime = planetRuntime.get(state.selectedPlanetId);
  const transform = getSelectedTransform();
  return add(runtime.position, [transform.tx, transform.ty, transform.tz]);
}

function focusOnSelectedPlanet() {
  const planet = planets.find((item) => item.id === state.selectedPlanetId);
  const transform = getSelectedTransform();
  const target = getSelectedWorldPosition();

  state.camera.target = target;
  state.camera.distance = planet.id === "matahari"
    ? 5.6
    : clamp(planet.radius * transform.s * 8.2 + (planet.ring ? 2.4 : 2.0), 3.0, 6.8);
}

function setOverviewCamera() {
  state.camera.target = vec3(0, 0, 0);
  state.camera.distance = 21.5;
  state.camera.yaw = 0.58;
  state.camera.pitch = 0.34;
}

function initializeMouseCamera() {
  canvas.addEventListener("mousedown", (event) => {
    state.camera.dragging = true;
    state.camera.movedWhileDragging = false;
    state.camera.lastX = event.clientX;
    state.camera.lastY = event.clientY;
    canvas.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    state.camera.dragging = false;
    canvas.classList.remove("is-dragging");
  });

  window.addEventListener("mousemove", (event) => {
    if (!state.camera.dragging) return;
    const dx = event.clientX - state.camera.lastX;
    const dy = event.clientY - state.camera.lastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) {
      state.camera.movedWhileDragging = true;
    }
    state.camera.yaw += dx * 0.008;
    state.camera.pitch = clamp(state.camera.pitch + dy * 0.008, -1.25, 1.25);
    state.camera.lastX = event.clientX;
    state.camera.lastY = event.clientY;
  });

  canvas.addEventListener("click", (event) => {
    if (state.camera.movedWhileDragging) return;
    const pickedPlanet = pickPlanetFromCanvas(event);
    if (pickedPlanet) {
      setSelectedPlanet(pickedPlanet.id, true);
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    if (state.camera.dragging) return;
    canvas.classList.toggle("can-pick", Boolean(pickPlanetFromCanvas(event)));
  });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    state.camera.distance = clamp(state.camera.distance + event.deltaY * 0.015, 2.7, 32);
  }, { passive: false });
}

function render(now) {
  const seconds = now * 0.001;
  const delta = state.lastTime ? seconds - state.lastTime : 0;
  state.lastTime = seconds;
  state.elapsed += delta * state.speed;

  resizeCanvasToDisplaySize();
  updatePlanetPositions();
  drawScene();
  updateFps(delta);
  updateObjectInfo();

  requestAnimationFrame(render);
}

function updatePlanetPositions() {
  planets.forEach((planet) => {
    const runtime = planetRuntime.get(planet.id);
    if (planet.orbitRadius === 0) {
      runtime.position = [0, 0, 0];
      return;
    }

    const angle = runtime.angleOffset + state.elapsed * planet.orbitSpeed * 0.28;
    runtime.position = [
      Math.cos(angle) * planet.orbitRadius,
      0,
      Math.sin(angle) * planet.orbitRadius
    ];
  });
}

function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.015, 0.02, 0.06, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  const aspect = canvas.width / canvas.height;
  const projection = perspective(degToRad(58), aspect, 0.1, 180);
  const camera = state.camera;
  camera.eye = [
    camera.target[0] + Math.sin(camera.yaw) * Math.cos(camera.pitch) * camera.distance,
    camera.target[1] + Math.sin(camera.pitch) * camera.distance,
    camera.target[2] + Math.cos(camera.yaw) * Math.cos(camera.pitch) * camera.distance
  ];
  const view = lookAt(camera.eye, camera.target, [0, 1, 0]);
  state.viewMatrix = view;
  state.projectionMatrix = projection;

  gl.useProgram(program);
  gl.uniformMatrix4fv(locations.uView, false, new Float32Array(view));
  gl.uniformMatrix4fv(locations.uProjection, false, new Float32Array(projection));
  gl.uniform3fv(locations.uLightPosition, new Float32Array(state.light.position));
  gl.uniform3fv(locations.uCameraPosition, new Float32Array(camera.eye));
  gl.uniform1f(locations.uLightIntensity, state.light.intensity);
  gl.uniform1f(locations.uAmbientStrength, 0.16);
  gl.uniform1i(locations.uShadingMode, state.shadingMode === "phong" ? 1 : 0);

  drawStars();
  drawOrbits();
  drawPlanets();
}

function drawStars() {
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);
  drawMesh({ mesh: starMesh, mode: gl.POINTS, model: identity(), color: [0.83, 0.92, 1.0], emissive: true, alpha: 0.85, pointSize: 1.8 });
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
}

function drawOrbits() {
  gl.disable(gl.CULL_FACE);
  planets.filter((planet) => planet.orbitRadius > 0).forEach((planet) => {
    if (!orbitMeshes.has(planet.id)) {
      orbitMeshes.set(planet.id, createMesh(createOrbitCircle(planet.orbitRadius, 180)));
    }
    drawMesh({
      mesh: orbitMeshes.get(planet.id),
      mode: gl.LINE_LOOP,
      model: identity(),
      color: [0.35, 0.48, 0.72],
      emissive: true,
      alpha: planet.id === state.selectedPlanetId ? 0.62 : 0.22,
      pointSize: 1
    });
  });
  gl.enable(gl.CULL_FACE);
}

function drawPlanets() {
  planets.forEach((planet) => {
    const runtime = planetRuntime.get(planet.id);
    const transform = transformState.get(planet.id);
    const selectedBoost = planet.id === state.selectedPlanetId ? 1.08 : 1;
    const position = add(runtime.position, [transform.tx, transform.ty, transform.tz]);

    let model = identity();
    model = translate(model, position[0], position[1], position[2]);
    model = rotateX(model, planet.axialTilt + degToRad(transform.rx));
    model = rotateY(model, state.elapsed * planet.rotationSpeed + degToRad(transform.ry));
    model = rotateZ(model, degToRad(transform.rz));
    model = scale(model, planet.radius * transform.s * selectedBoost, planet.radius * transform.s * selectedBoost, planet.radius * transform.s * selectedBoost);
    runtime.modelMatrix = model;

    drawMesh({
      mesh: sphereMesh,
      mode: gl.TRIANGLES,
      model,
      color: planet.color,
      emissive: planet.emissive,
      alpha: 1,
      pointSize: 1
    });

    if (planet.ring) {
      drawRing(planet, position, transform, selectedBoost);
    }
  });
}

function drawRing(planet, position, transform, selectedBoost) {
  if (!ringMeshes.has(planet.id)) {
    ringMeshes.set(planet.id, createMesh(createAnnulus(planet.ring.innerRadius, planet.ring.outerRadius, 160)));
  }

  let model = identity();
  model = translate(model, position[0], position[1], position[2]);
  model = rotateX(model, planet.ring.tilt + degToRad(transform.rx));
  model = rotateY(model, degToRad(transform.ry));
  model = rotateZ(model, degToRad(transform.rz));
  model = scale(model, transform.s * selectedBoost, transform.s * selectedBoost, transform.s * selectedBoost);

  gl.disable(gl.CULL_FACE);
  drawMesh({
    mesh: ringMeshes.get(planet.id),
    mode: gl.TRIANGLES,
    model,
    color: planet.ring.color,
    emissive: false,
    alpha: 0.72,
    pointSize: 1
  });
  gl.enable(gl.CULL_FACE);
}

function drawMesh({ mesh, mode, model, color, emissive, alpha, pointSize }) {
  bindMesh(mesh);
  gl.uniformMatrix4fv(locations.uModel, false, new Float32Array(model));
  gl.uniform3fv(locations.uBaseColor, new Float32Array(color));
  gl.uniform1i(locations.uEmissive, emissive ? 1 : 0);
  gl.uniform1f(locations.uAlpha, alpha);
  gl.uniform1f(locations.uPointSize, pointSize);

  if (alpha < 1) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  } else {
    gl.disable(gl.BLEND);
  }

  gl.drawElements(mode, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
}

function createMesh(geometry) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

  return {
    positionBuffer,
    normalBuffer,
    indexBuffer,
    indexCount: geometry.indices.length,
    vertexCount: geometry.vertexCount,
    triangleCount: geometry.triangleCount
  };
}

function bindMesh(mesh) {
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
  gl.enableVertexAttribArray(locations.aPosition);
  gl.vertexAttribPointer(locations.aPosition, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
  gl.enableVertexAttribArray(locations.aNormal);
  gl.vertexAttribPointer(locations.aNormal, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
}

function resizeCanvasToDisplaySize() {
  const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * window.devicePixelRatio));
  const displayHeight = Math.max(1, Math.floor(canvas.clientHeight * window.devicePixelRatio));
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

function updateFps(delta) {
  state.frameCount += 1;
  state.fpsTime += delta;
  if (state.fpsTime >= 0.5) {
    fpsCounter.textContent = `${Math.round(state.frameCount / state.fpsTime)} FPS`;
    state.frameCount = 0;
    state.fpsTime = 0;
  }
}


function pickPlanetFromCanvas(event) {
  if (!canvas.width || !canvas.height) return null;

  const rect = canvas.getBoundingClientRect();
  const mouseX = (event.clientX - rect.left) * window.devicePixelRatio;
  const mouseY = (event.clientY - rect.top) * window.devicePixelRatio;
  const mvp = multiply(state.projectionMatrix, state.viewMatrix);

  const candidates = planets.map((planet) => {
    const runtime = planetRuntime.get(planet.id);
    const transform = transformState.get(planet.id);
    const worldPosition = add(runtime.position, [transform.tx, transform.ty, transform.tz]);
    const screenCenter = projectWorldToScreen(worldPosition, mvp);
    if (!screenCenter) return null;

    const scaleFactor = planet.radius * transform.s * (planet.id === state.selectedPlanetId ? 1.08 : 1);
    const radiusProbe = projectWorldToScreen([worldPosition[0] + Math.max(scaleFactor, 0.22), worldPosition[1], worldPosition[2]], mvp);
    const projectedRadius = radiusProbe
      ? Math.hypot(radiusProbe.x - screenCenter.x, radiusProbe.y - screenCenter.y)
      : 18;
    const clickableRadius = Math.max(projectedRadius + 8, planet.id === "matahari" ? 28 : 18);
    const distanceFromMouse = Math.hypot(mouseX - screenCenter.x, mouseY - screenCenter.y);

    return {
      id: planet.id,
      distanceFromMouse,
      clickableRadius,
      depth: screenCenter.depth
    };
  }).filter(Boolean)
    .filter((candidate) => candidate.distanceFromMouse <= candidate.clickableRadius)
    .sort((a, b) => a.distanceFromMouse - b.distanceFromMouse || a.depth - b.depth);

  return candidates[0] ?? null;
}

function projectWorldToScreen(position, matrix) {
  const clip = transformPoint(matrix, [position[0], position[1], position[2], 1]);
  if (clip[3] <= 0) return null;

  const ndcX = clip[0] / clip[3];
  const ndcY = clip[1] / clip[3];
  const ndcZ = clip[2] / clip[3];
  if (ndcZ < -1 || ndcZ > 1) return null;

  return {
    x: (ndcX * 0.5 + 0.5) * canvas.width,
    y: (1 - (ndcY * 0.5 + 0.5)) * canvas.height,
    depth: ndcZ
  };
}

function transformPoint(matrix, point) {
  const [x, y, z, w] = point;
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12] * w,
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13] * w,
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14] * w,
    matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15] * w
  ];
}

function updateObjectInfo() {
  const planet = planets.find((item) => item.id === state.selectedPlanetId);
  const runtime = planetRuntime.get(planet.id);
  const transform = transformState.get(planet.id);
  const position = add(runtime.position, [transform.tx, transform.ty, transform.tz]);
  const ringInfo = planet.ring ? `Ada, annulus ${ringMeshes.get(planet.id)?.triangleCount ?? 320} segitiga` : "Tidak ada";

  objectInfo.innerHTML = `
    ${infoRow("Nama", planet.name)}
    ${infoRow("Jenis", planet.category)}
    ${infoRow("Posisi", `<code>x=${position[0].toFixed(2)}, y=${position[1].toFixed(2)}, z=${position[2].toFixed(2)}</code>`)}
    ${infoRow("Transformasi", `<code>T(${transform.tx.toFixed(2)}, ${transform.ty.toFixed(2)}, ${transform.tz.toFixed(2)}) R(${transform.rx}°, ${transform.ry}°, ${transform.rz}°) S(${transform.s.toFixed(2)})</code>`)}
    ${infoRow("Radius model", `<code>${planet.radius.toFixed(2)} unit</code>`)}
    ${infoRow("Orbit", planet.orbitRadius === 0 ? "Objek pusat" : `<code>${planet.orbitRadius.toFixed(2)} unit</code>`)}
    ${infoRow("Mesh bola", `<code>${sphereMesh.vertexCount} vertex, ${sphereMesh.triangleCount} segitiga</code>`)}
    ${infoRow("Cincin", ringInfo)}
    ${infoRow("Shading", state.shadingMode === "phong" ? "Phong Shading: ambient + diffuse + specular" : "Lambertian: ambient + diffuse")}
    ${infoRow("Catatan", planet.description)}
  `;
}

function infoRow(label, value) {
  return `<div class="info-row"><strong>${label}</strong><span>${value}</span></div>`;
}

function getSelectedTransform() {
  return transformState.get(state.selectedPlanetId);
}
