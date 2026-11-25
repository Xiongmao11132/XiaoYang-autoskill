// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/334719f93900/groups/b/src/RebuiltB042.tsx (L81-B042)
// 用途：三项业务词错位阶梯排列：词逐个落到逐级升高的台阶上，台阶线随之延伸（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangStairWordsProps = {
  words: string[];
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangStairWords: React.FC<YangStairWordsProps> = ({
  words, startSec = 0.3, gapSec = 0.5, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const n = words.length;
  const stepW = 420, stepH = 150;
  const x0 = (1920 - n * stepW) / 2, baseY = 800;
  return (
    <Stage background={background}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {words.map((_, i) => {
          const at = startSec + i * gapSec;
          const draw = seg(t, at + 0.15, at + 0.55);
          const x = x0 + i * stepW, y = baseY - i * stepH;
          return (
            <g key={i}>
              <line x1={x} y1={y} x2={x + stepW * draw} y2={y} stroke={accent} strokeWidth={5} />
              {i > 0 && <line x1={x} y1={y + stepH} x2={x} y2={y + stepH - stepH * draw} stroke={accent} strokeWidth={5} opacity={0.6} />}
            </g>
          );
        })}
      </svg>
      {words.map((w, i) => {
        const at = startSec + i * gapSec;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 14, stiffness: 160, mass: 0.85 } });
        const x = x0 + i * stepW + stepW / 2, y = baseY - i * stepH;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y - 118, transform: `translate(-50%, ${(1 - p) * -90}px) scale(${0.8 + 0.2 * p})`, opacity: p, fontSize: 76, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            {w}
          </div>
        );
      })}
    </Stage>
  );
};
