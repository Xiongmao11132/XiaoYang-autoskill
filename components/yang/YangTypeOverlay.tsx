// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/f383bd215d85/src/X050TypographyRepair.tsx (X050)
// 用途：错误与 Token 词覆盖虚化界面：界面先虚化退后，大词逐个砸盖到界面上（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangTypeOverlayProps = {
  words: string[];
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangTypeOverlay: React.FC<YangTypeOverlayProps> = ({
  words, startSec = 0.3, gapSec = 0.5, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const spots = [
    { x: 400, y: 330, r: -4 }, { x: 1180, y: 300, r: 3 }, { x: 700, y: 560, r: -2 },
    { x: 1250, y: 640, r: 4 }, { x: 350, y: 680, r: 2 }, { x: 900, y: 800, r: -3 },
  ];
  const blurIn = seg(t, startSec, startSec + 0.5);
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: 260, top: 140, width: 1400, height: 800, borderRadius: 24, background: C.surface, border: `1px solid ${C.hair}`, filter: `blur(${10 * blurIn}px) brightness(${1 - 0.3 * blurIn})`, padding: '60px 70px', boxSizing: 'border-box' }}>
        {[0.9, 0.7, 0.8, 0.5, 0.65].map((w, i) => (
          <div key={i} style={{ height: 34, width: `${w * 100}%`, borderRadius: 8, background: C.panel, marginBottom: 44 }} />
        ))}
        <div style={{ display: 'flex', gap: 30 }}>
          {[0, 1, 2].map((i) => (<div key={i} style={{ width: 380, height: 240, borderRadius: 16, background: C.panel }} />))}
        </div>
      </div>
      {words.map((w, i) => {
        const at = startSec + 0.6 + i * gapSec;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 11, stiffness: 210, mass: 0.9 } });
        const s = spots[i % spots.length];
        return (
          <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, fontSize: 92, fontWeight: 800, color: i % 2 === 0 ? C.text : accent, opacity: p, transform: `rotate(${s.r}deg) scale(${0.6 + 0.4 * p})`, textShadow: '0 16px 44px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>{w}</div>
        );
      })}
    </Stage>
  );
};
