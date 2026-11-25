"use client";
// Source: Remocn/remocn registry/remocn/shader-mesh-gradient-lagoon/index.tsx @ 126221a — MIT (see ../LICENSE)

import {
  ShaderMeshGradient,
  type ShaderMeshGradientProps,
} from "../shader-mesh-gradient/index";

// Lagoon: bright aqua and teal shallows with a deep-blue undertow.
// A preset of ShaderMeshGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderMeshGradientLagoonPreset = {
  speed: 1,
  colors: ["#d6f5ff", "#2bb3ff", "#00d4c0", "#0b3d91"],
  distortion: 0.7,
  swirl: 0.35,
  rotation: 90,
} satisfies ShaderMeshGradientProps;

export function ShaderMeshGradientLagoon({
  speed = 1,
  ...props
}: ShaderMeshGradientProps) {
  return (
    <ShaderMeshGradient
      {...shaderMeshGradientLagoonPreset}
      {...props}
      speed={shaderMeshGradientLagoonPreset.speed * speed}
    />
  );
}
