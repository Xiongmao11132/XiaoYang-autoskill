// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/ep109-selected-20261006（工程快照，composition: EP109-Selected-05） (109-05)
// 用途：三行重点与左向箭头逐行聚焦：箭头逐行跳位点名，当前行亮起放大、其余行压暗（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangArrowFocusListProps = {
  lines: string[];
  title?: string;
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangArrowFocusList: React.FC<YangArrowFocusListProps> = ({
  lines, title, startSec = 0.3, gapSec = 0.65, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rowW = 1080, rowH = 124, gap = 30;
  const totalH = lines.length * rowH + (lines.length - 1) * gap + (title ? 110 : 0);
  const top0 = (1080 - totalH) / 2 + (title ? 110 : 0);
  const focusFloat = clamp01((t - startSec - 0.3) / Math.max(0.01, (lines.length - 1) * gapSec)) * (lines.length - 1);
  const arrowY = top0 + focusFloat * (rowH + gap) + rowH / 2;
  return (
    <Stage background={background}>
      {title && <div style={{ position: 'absolute', left: (1920 - rowW) / 2 + 120, top: (1080 - totalH) / 2, fontSize: 50, color: C.text, fontWeight: 600, opacity: seg(t, startSec, startSec + 0.3) }}>{title}</div>}
      <div style={{ position: 'absolute', left: (1920 - rowW) / 2 - 40, top: arrowY, transform: 'translateY(-50%)', fontSize: 62, color: accent, opacity: seg(t, startSec + 0.2, startSec + 0.5), textShadow: '0 8px 26px rgba(0,0,0,0.5)' }}>◀</div>
      {lines.map((ln, i) => {
        const lit = seg(t, startSec + 0.3 + i * gapSec, startSec + 0.55 + i * gapSec);
        return (
          <div key={i} style={{ position: 'absolute', left: (1920 - rowW) / 2 + 120, top: top0 + i * (rowH + gap), width: rowW - 120, height: rowH, borderRadius: 16, background: C.surface, border: `1px solid ${lit > 0.7 ? accent : C.hair}`, opacity: 0.4 + 0.6 * lit, transform: `scale(${0.98 + 0.02 * lit})`, display: 'flex', alignItems: 'center', padding: '0 38px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: 46, color: lit > 0.7 ? C.text : C.muted }}>{ln}</span>
          </div>
        );
      })}
    </Stage>
  );
};
