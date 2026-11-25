// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/bf89393afeeb/src/R6MidMotion.tsx (107-03)
// 用途：同尺度版本窗，箭头建立比较：两扇同尺寸窗自两侧落位，中间箭头画出，差异签在新版窗下逐个弹出（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangVersionCompareProps = {
  leftSrc?: string;
  rightSrc?: string;
  leftLabel: string;
  rightLabel: string;
  diffs?: string[];
  startSec?: number;
  accent?: string;
  background?: string;
};

export const YangVersionCompare: React.FC<YangVersionCompareProps> = ({
  leftSrc, rightSrc, leftLabel, rightLabel, diffs = [], startSec = 0.3, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const winW = 720, winH = 480, winY = 190;
  const lp = spring({ frame, fps, delay: Math.round(startSec * fps), config: { damping: 16, stiffness: 150 } });
  const rp = spring({ frame, fps, delay: Math.round((startSec + 0.2) * fps), config: { damping: 16, stiffness: 150 } });
  const arrow = seg(t, startSec + 0.8, startSec + 1.25);
  const win = (src: string | undefined, label: string, x: number, p: number, solid: boolean) => (
    <div style={{ position: 'absolute', left: x, top: winY, width: winW, opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
      <div style={{ width: winW, height: winH, borderRadius: 18, overflow: 'hidden', border: `2px solid ${solid ? accent : C.hair}` }}>
        <MediaImg src={src} label={label} style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ marginTop: 20, textAlign: 'center' }}><span style={{ background: solid ? accent : C.panel, color: solid ? C.dark : C.text, borderRadius: 999, padding: '10px 32px', fontSize: 34, fontWeight: 600 }}>{label}</span></div>
    </div>
  );
  return (
    <Stage background={background}>
      {win(leftSrc, leftLabel, 130, lp, false)}
      {win(rightSrc, rightLabel, 1070, rp, true)}
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <line x1={880} y1={winY + winH / 2} x2={880 + 160 * arrow} y2={winY + winH / 2} stroke={accent} strokeWidth={7} strokeLinecap="round" />
        {arrow > 0.85 && <path d={`M 1018 ${winY + winH / 2 - 18} L 1046 ${winY + winH / 2} L 1018 ${winY + winH / 2 + 18}`} fill="none" stroke={accent} strokeWidth={7} strokeLinecap="round" />}
      </svg>
      <div style={{ position: 'absolute', left: 0, top: winY + winH + 130, width: 1920, display: 'flex', justifyContent: 'center', gap: 22 }}>
        {diffs.map((d, i) => {
          const p = spring({ frame, fps, delay: Math.round((startSec + 1.3 + i * 0.18) * fps), config: { damping: 14, stiffness: 180 } });
          return <span key={i} style={{ background: C.surface, border: `1px solid ${accent}`, color: C.text, borderRadius: 999, padding: '12px 30px', fontSize: 34, opacity: p, transform: `scale(${0.7 + 0.3 * p})` }}>{d}</span>;
        })}
      </div>
    </Stage>
  );
};
