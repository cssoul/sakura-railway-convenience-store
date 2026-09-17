import * as THREE from 'three'

/** 渐变天空穹顶（天气系统可动态改色） */
export interface SkyDome {
  mesh: THREE.Mesh
  setColors(top: THREE.Color, bottom: THREE.Color): void
  dispose(): void
}

export function createSky(): SkyDome {
  const uniforms = {
    topColor: { value: new THREE.Color(0x63b4ec) },
    bottomColor: { value: new THREE.Color(0xeaf7f5) },
  }
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorld;
      void main() {
        float h = normalize(vWorld).y;
        float t = pow(smoothstep(-0.05, 0.62, h), 0.85);
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
      }
    `,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 18), mat)
  mesh.frustumCulled = false

  return {
    mesh,
    setColors(top, bottom) {
      uniforms.topColor.value.copy(top)
      uniforms.bottomColor.value.copy(bottom)
    },
    dispose() {
      mesh.geometry.dispose()
      mat.dispose()
    },
  }
}
