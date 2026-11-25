// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/d2cd2cc84551/src/RebuiltN005.tsx (N005)
// 用途：三项能力从底部向上逐项核验：条目自下逐个升入落位，每项落定后右侧对勾徽章砸章（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangCheckRiseProps = {
  items: string[];
  title?: string;
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangCheckRise: React.FC<YangCheckRiseProps> = ({
  items, title, startSec = 0.3, gapSec = 0.55, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rowW = 1020, rowH = 116, gap = 30;
  const totalH = items.length * rowH + (items.length - 1) * gap + (title ? 120 : 0);
  const top0 = (1080 - totalH) / 2 + (title ? 120 : 0);
  return (
    <Stage background={background}>
      {title && <div style={{ position: 'absolute', left: (1920 - rowW) / 2, top: (1080 - totalH) / 2, fontSize: 50, color: C.text, fontWeight: 600, opacity: seg(t, startSec, startSec + 0.3) }}>{title}</div>}
      {items.map((it, i) => {
        const at = startSec + i * gapSec;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 16, stiffness: 150 } });
        const stamp = spring({ frame, fps, delay: Math.round((at + 0.38) * fps), config: { damping: 10, stiffness: 220, mass: 0.7 } });
        return (
          <div key={i} style={{ position: 'absolute', left: (1920 - rowW) / 2, top: top0 + i * (rowH + gap), width: rowW, height: rowH, borderRadius: 18, background: C.surface, border: `1px solid ${C.hair}`, opacity: p, transform: `translateY(${(1 - p) * 180}px)`, display: 'flex', alignItems: 'center', padding: '0 40px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: 44, color: C.text, flex: 1 }}>{it}</span>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: accent, color: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 800, transform: `scale(${Math.max(0, stamp)}) rotate(${(1 - stamp) * -30}deg)` }}>✓</div>
          </div>
        );
      })}
    </Stage>
  );
};
