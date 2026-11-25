// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/d314fffeed7f/src/index.tsx (L81-R027)
// 用途：两张竖图让出中间第三项：两图先并排居中，随后向两侧滑开，第三项自中间升起压轴（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangRevealThirdProps = {
  media: string[];
  labels?: string[];
  startSec?: number;
  revealAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangRevealThird: React.FC<YangRevealThirdProps> = ({
  media, labels, startSec = 0.3, revealAtSec = 1.3, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const w = 430, h = 640, y = (1080 - h) / 2;
  const intro = spring({ frame, fps, delay: Math.round(startSec * fps), config: { damping: 16, stiffness: 150 } });
  const rv = seg(t, revealAtSec, revealAtSec + 0.65);
  const sideX = (off: number) => 960 + off;
  const positions = [
    { x: sideX(interpolate(rv, [0, 1], [-225, -470])) - w / 2, p: intro, z: 1 },
    { x: sideX(interpolate(rv, [0, 1], [225, 470])) - w / 2, p: intro, z: 1 },
    { x: 960 - (w + 40) / 2, p: rv, z: 3 },
  ];
  const order = [0, 1, 2];
  return (
    <Stage background={background}>
      {order.map((i) => {
        const pos = positions[i];
        const isMid = i === 2;
        const ww = isMid ? w + 40 : w, hh = isMid ? h + 40 : h;
        return (
          <div key={i} style={{ position: 'absolute', left: isMid ? 960 - ww / 2 : pos.x, top: isMid ? (1080 - hh) / 2 : y, width: ww, height: hh, borderRadius: 18, overflow: 'hidden', border: `${isMid ? 3 : 1}px solid ${isMid ? accent : C.hair}`, opacity: pos.p, transform: `translateY(${isMid ? (1 - rv) * 90 : (1 - intro) * 50}px) scale(${isMid ? 0.85 + 0.15 * rv : 1})`, zIndex: pos.z, boxShadow: isMid ? '0 36px 90px rgba(0,0,0,0.55)' : 'none' }}>
            <MediaImg src={media[i] || undefined} label={labels?.[i] ?? `图片 ${i + 1}`} style={{ width: '100%', height: '100%' }} />
          </div>
        );
      })}
    </Stage>
  );
};
