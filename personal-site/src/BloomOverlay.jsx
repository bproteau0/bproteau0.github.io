import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';

const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform vec2 resolution;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    if (uv.x > 0.5) discard;

    float dist = distance(uv, vec2(0.25, 0.5));
    float glow = exp(-dist * 6.0);
    glow *= 0.6 + 0.4 * sin(time * 1.5);

    vec3 color = vec3(1.0, 0.85, 0.6);
    gl_FragColor = vec4(color * glow, glow * 0.6);
  }
`;

function BloomQuad() {
  const material = useRef();

  useFrame((state) => {
    material.current.uniforms.time.value = state.clock.elapsedTime;
    material.current.uniforms.resolution.value.set(
      state.size.width,
      state.size.height
    );
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        transparent
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          time: { value: 0 },
          resolution: { value: { x: 0, y: 0 } }
        }}
      />
    </mesh>
  );
}

export default function BloomOverlay() {
  return (
    <Canvas
      className="shader-overlay"
      gl={{ alpha: true }}
      orthographic
      camera={{ position: [0, 0, 1] }}
    >
      <BloomQuad />
    </Canvas>
  );
}
