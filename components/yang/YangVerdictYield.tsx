// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/bf89393afeeb/src/R7LateMotion.tsx (107-05)
// 用途：居中结论让位，两项原因刷入：大结论先居中落定，随后上移缩小让位，两张原因卡自两侧刷入（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangVerdictYieldProps = {
  verdict: string;
  reasons: string[];
  startSec?: number;
  yieldAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangVerdictYield: React.FC<YangVerdictYieldProps> = ({
  verdict, reasons, startSec = 0.3, yieldAtSec = 1.5, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const inp = spring({ frame, fps, delay: Math.round(startSec * fps), config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const y = seg(t, yieldAtSec, yieldAtSec + 0.6);
  const vTop = interpolate(y, [0, 1], [400, 170]);
  const vScale = interpolate(y, [0, 1], [1, 0.62]);
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: 0, top: vTop, width: 1920, textAlign: 'center', opacity: inp, transform: `scale(${vScale * (0.8 + 0.2 * inp)})` }}>
        <span style={{ fontSize: 96, fontWeight: 800, color: C.text }}>{verdict}</span>
      </div>
      {reasons.slice(0, 2).map((r, i) => {
        const at = yieldAtSec + 0.35 + i * 0.22;
        const wipe = seg(t, at, at + 0.45);
        return (
          <div key={i} style={{ position: 'absolute', left: i === 0 ? 240 : 1010, top: 470, width: 670, height: 330, borderRadius: 20, background: C.surface, border: `1px solid ${C.hair}`, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`, padding: '44px 46px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 32, color: accent, fontWeight: 700 }}>原因 {i + 1}</div>
            <div style={{ fontSize: 44, color: C.text, marginTop: 18, lineHeight: 1.35 }}>{r}</div>
          </div>
        );
      })}
    </Stage>
  );
};
