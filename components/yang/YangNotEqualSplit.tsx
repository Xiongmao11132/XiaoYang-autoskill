// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/65b6174940b2/groups/b/src/RebuiltB065.tsx (L81-B065)
// 用途：用不等号拆开效果与产品概念：两概念自两侧滑入，中央圆徽弹出 ≠ 号（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangNotEqualSplitProps = {
  left: string;
  right: string;
  note?: string;
  startSec?: number;
  accent?: string;
  background?: string;
};

export const YangNotEqualSplit: React.FC<YangNotEqualSplitProps> = ({
  left, right, note, startSec = 0.3, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const lp = spring({ frame, fps, delay: Math.round(startSec * fps), config: { damping: 16, stiffness: 140 } });
  const rp = spring({ frame, fps, delay: Math.round((startSec + 0.15) * fps), config: { damping: 16, stiffness: 140 } });
  const bp = spring({ frame, fps, delay: Math.round((startSec + 0.55) * fps), config: { damping: 11, stiffness: 180, mass: 0.8 } });
  const label = (txt: string, p: number, dir: number) => (
    <div style={{ width: 620, textAlign: 'center', fontSize: 84, fontWeight: 700, color: C.text, opacity: p, transform: `translateX(${(1 - p) * dir * 180}px)` }}>{txt}</div>
  );
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: 0, top: 430, width: 1920, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60 }}>
        {label(left, lp, -1)}
        <div style={{ width: 190, height: 190, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${Math.max(0, bp)})`, boxShadow: '0 24px 60px rgba(0,0,0,0.5)', flexShrink: 0 }}>
          <svg viewBox="0 0 180 180" width="130" height="130"><g fill="none" stroke={C.dark} strokeWidth={13} strokeLinecap="round"><path d="M 43 72 L 137 72 M 43 108 L 137 108 M 112 44 L 68 136" /></g></svg>
        </div>
        {label(right, rp, 1)}
      </div>
      {note && <div style={{ position: 'absolute', left: 0, top: 720, width: 1920, textAlign: 'center', fontSize: 40, color: C.muted, opacity: seg(t, startSec + 0.9, startSec + 1.3) }}>{note}</div>}
    </Stage>
  );
};
