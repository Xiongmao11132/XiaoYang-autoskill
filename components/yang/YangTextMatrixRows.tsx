// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/5fa89bc8e570/originals/style-runtime/src/v13-reviewed-fixes/V13Sample.tsx (C017)
// 用途：黑白文字矩阵逐行建立：黑白交替的文字行逐行滑入，行内词依次落定（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangTextMatrixRowsProps = {
  rows: string[][];
  startSec?: number;
  rowGapSec?: number;
  accent?: string;
  background?: string;
};

export const YangTextMatrixRows: React.FC<YangTextMatrixRowsProps> = ({
  rows, startSec = 0.3, rowGapSec = 0.38, accent = C.brass, background = '#FFFFFF',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rowW = 1420, rowH = 118, gap = 26;
  const totalH = rows.length * rowH + (rows.length - 1) * gap;
  const top0 = (1080 - totalH) / 2;
  return (
    <Stage background={background}>
      {rows.map((words, ri) => {
        const dark = ri % 2 === 0;
        const at = startSec + ri * rowGapSec;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 17, stiffness: 150 } });
        return (
          <div key={ri} style={{ position: 'absolute', left: (1920 - rowW) / 2, top: top0 + ri * (rowH + gap), width: rowW, height: rowH, borderRadius: 14, background: dark ? '#101418' : '#ECE8DF', opacity: p, transform: `translateX(${(1 - p) * (ri % 2 === 0 ? -80 : 80)}px)`, display: 'flex', alignItems: 'center', padding: '0 44px', gap: 36, boxSizing: 'border-box', boxShadow: '0 16px 40px rgba(15,18,22,0.18)' }}>
            {words.map((w, wi) => {
              const wp = seg(t, at + 0.15 + wi * 0.09, at + 0.35 + wi * 0.09);
              return <span key={wi} style={{ fontSize: 46, fontWeight: wi === 0 ? 700 : 400, color: dark ? (wi === 0 ? accent : '#ECE8DF') : '#17130A', opacity: wp, transform: `translateY(${(1 - wp) * 16}px)`, display: 'inline-block' }}>{w}</span>;
            })}
          </div>
        );
      })}
    </Stage>
  );
};
