// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/470b7b100b0c/groups/ctw/core/src/RebuiltGrid.tsx (L81-C002)
// 用途：从一个起点建立信息矩阵：中心点亮起，格子按距中心远近逐个向外弹出成矩阵（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangInfoMatrixProps = {
  cells: string[];
  title?: string;
  columns?: number;
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangInfoMatrix: React.FC<YangInfoMatrixProps> = ({
  cells, title, columns = 3, startSec = 0.3, gapSec = 0.11, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rows = Math.ceil(cells.length / columns);
  const cw = 430, ch = 190, gx = 36, gy = 30;
  const gridW = columns * cw + (columns - 1) * gx, gridH = rows * ch + (rows - 1) * gy;
  const x0 = (1920 - gridW) / 2, y0 = (1080 - gridH) / 2 + (title ? 50 : 0);
  const cc = (columns - 1) / 2, cr = (rows - 1) / 2;
  const order = cells.map((_, i) => Math.abs((i % columns) - cc) + Math.abs(Math.floor(i / columns) - cr));
  const maxO = Math.max(...order, 1);
  return (
    <Stage background={background}>
      {title && <div style={{ position: 'absolute', left: 0, top: y0 - 130, width: 1920, textAlign: 'center', fontSize: 50, color: C.text, fontWeight: 600, opacity: seg(t, startSec, startSec + 0.3) }}>{title}</div>}
      <div style={{ position: 'absolute', left: 1920 / 2 - 10, top: y0 + gridH / 2 - 10, width: 20, height: 20, borderRadius: '50%', background: accent, opacity: 1 - seg(t, startSec + 0.2, startSec + 0.7), transform: `scale(${1 + 2.2 * seg(t, startSec, startSec + 0.5)})` }} />
      {cells.map((c, i) => {
        const at = startSec + 0.25 + (order[i] / maxO) * gapSec * 4;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 15, stiffness: 170, mass: 0.8 } });
        const x = x0 + (i % columns) * (cw + gx), y = y0 + Math.floor(i / columns) * (ch + gy);
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: cw, height: ch, borderRadius: 18, background: C.surface, border: `1px solid ${order[i] === 0 ? accent : C.hair}`, opacity: p, transform: `scale(${0.6 + 0.4 * p})`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 26px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: 40, color: C.text, textAlign: 'center' }}>{c}</span>
          </div>
        );
      })}
    </Stage>
  );
};
