export const vertexShaderSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform float uPointSize;

varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = uModel * vec4(aPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize(mat3(uModel) * aNormal);
  gl_Position = uProjection * uView * worldPosition;
  gl_PointSize = uPointSize;
}
`;

export const fragmentShaderSource = `
precision mediump float;

uniform vec3 uBaseColor;
uniform vec3 uLightPosition;
uniform vec3 uCameraPosition;
uniform float uLightIntensity;
uniform float uAmbientStrength;
uniform int uShadingMode;
uniform bool uEmissive;
uniform float uAlpha;

varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightPosition - vWorldPosition);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

  float diffuse = max(dot(normal, lightDir), 0.0);
  vec3 result = uBaseColor * (uAmbientStrength + diffuse * uLightIntensity);

  if (uShadingMode == 1) {
    vec3 reflectDir = reflect(-lightDir, normal);
    float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    result += vec3(1.0) * specular * 0.34 * uLightIntensity;
  }

  if (uEmissive) {
    result = uBaseColor * (0.85 + 0.15 * uLightIntensity);
  }

  gl_FragColor = vec4(result, uAlpha);
}
`;

export function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Gagal menghubungkan program shader: ${gl.getProgramInfoLog(program)}`);
  }

  return program;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader gagal dikompilasi: ${message}`);
  }

  return shader;
}
