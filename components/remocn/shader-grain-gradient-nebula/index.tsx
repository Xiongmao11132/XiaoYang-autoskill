"use client";
// Source: Remocn/remocn registry/remocn/shader-grain-gradient-nebula/index.tsx @ 126221a — MIT (see ../LICENSE)

import {
  ShaderGrainGradient,
  type ShaderGrainGradientProps,
} from "../shader-grain-gradient/index";

// Nebula: magenta and cyan glow blooming from the corners of deep space.
// A preset of ShaderGrainGradient. The whole look lives in the object below, so tune
// it freely. Props you pass override the preset, except `speed`, which scales
// the preset's own speed instead of replacing it.

export const shaderGrainGradientNebulaPreset = {
  speed: 1,
  shape: "corners",
  colorBack: "#05010f",
  colors: ["#7a2cff", "#ff4ecd", "#2ec5ff"],
  softness: 1,
  intensity: 0.7,
  noise: 0.2,
  scale: 0.6,
} satisfies ShaderGrainGradientProps;

export function ShaderGrainGradientNebula({
  speed = 1,
  ...props
}: ShaderGrainGradientProps) {
  return (
    <ShaderGrainGradient
      {...shaderGrainGradientNebulaPreset}
      {...props}
      speed={shaderGrainGradientNebulaPreset.speed * speed}
    />
  );
}
