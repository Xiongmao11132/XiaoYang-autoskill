// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/30b3c05aa839/src/BatchA.tsx (N004)
// 用途：横向曲面视频带停在主片并展平：多帧沿弧面排布，主帧停中，随后弧面展平、主帧放大成主窗（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, clamp01 } from '../src/theme';

const ez = (x: number) => 1 - Math.pow(1 - x, 3);
const eob = (x: number) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const seg = (t: number, a: number, b: number) => ez(clamp01((t - a) / (b - a)));
const isUrl = (s: string) => /^(https?:|data:|blob:)/.test(s);
const srcOf = (s: string) => (isUrl(s) ? s : staticFile(s));

const Stage: React.FC<{ background?: string; children: React.ReactNode }> = ({ background = C.base, children }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background, overflow: 'hidden', fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${width / 1920}, ${height / 1080})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

const MediaImg: React.FC<{ src?: string; label?: string; style?: React.CSSProperties }> = ({ src, label = '示例画面', style }) =>
  src ? (
    <Img src={srcOf(src)} style={{ objectFit: 'cover', ...style }} />
  ) : (
    <div style={{ background: 'linear-gradient(135deg,#232B36,#141920)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 30, ...style }}>
      {label}
    </div>
  );

export type YangCurveFlattenProps = {
  media: string[];
  heroIndex?: number;
  startSec?: number;
  flatAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangCurveFlatten: React.FC<YangCurveFlattenProps> = ({
  media, heroIndex = 2, startSec = 0.3, flatAtSec = 1.6, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const five = media.slice(0, 5);
  const fw = 400, fh = 250, cy = 470;
  const fp = seg(t, flatAtSec, flatAtSec + 0.75);
  return (
    <Stage background={background}>
      {five.map((m, i) => {
        const off = i - heroIndex;
        const at = startSec + Math.abs(off) * 0.1;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 16, stiffness: 160 } });
        const arcY = Math.abs(off) * 66, rot = off * 13, scaleArc = 1 - Math.abs(off) * 0.1;
        const isHero = i === heroIndex;
        const x = interpolate(fp, [0, 1], [960 + off * (fw + 26), 960]);
        const y = interpolate(fp, [0, 1], [cy + arcY, 470]);
        const sc = interpolate(fp, [0, 1], [scaleArc, isHero ? 2.35 : 0.6]) * (0.7 + 0.3 * p);
        const op = p * (isHero ? 1 : 1 - fp * 0.92);
        return (
          <div key={i} style={{ position: 'absolute', left: x - fw / 2, top: y - fh / 2, width: fw, height: fh, borderRadius: 16, overflow: 'hidden', border: `${isHero ? 3 : 1}px solid ${isHero ? accent : C.hair}`, opacity: op, transform: `rotate(${rot * (1 - fp)}deg) scale(${sc})`, zIndex: isHero ? 4 : 2, boxShadow: isHero ? '0 40px 100px rgba(0,0,0,0.55)' : 'none' }}>
            <MediaImg src={m || undefined} label={`画面 ${i + 1}`} style={{ width: '100%', height: '100%' }} />
          </div>
        );
      })}
    </Stage>
  );
};
