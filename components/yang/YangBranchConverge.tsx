// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/2c1373611323/groups/ctw/core/src/RebuiltC005.tsx (L81-C005)
// 用途：分支树收束为输入输出流程：分支逐个展开成树，随后收束成「输入 → 输出」横向流程（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangBranchConvergeProps = {
  rootLabel: string;
  branches: string[];
  inputLabel?: string;
  outputLabel: string;
  startSec?: number;
  convergeAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangBranchConverge: React.FC<YangBranchConvergeProps> = ({
  rootLabel, branches, inputLabel = '输入', outputLabel, startSec = 0.3, convergeAtSec = 2.2, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rootX = 300, rootY = 540;
  const bx = 1080, bw = 460, bh = 110, bgap = 44;
  const totalH = branches.length * bh + (branches.length - 1) * bgap;
  const by0 = 540 - totalH / 2;
  const cv = seg(t, convergeAtSec, convergeAtSec + 0.7);
  const chip = (txt: string, x: number, y: number, w: number, h: number, solid: boolean, op: number, extra?: React.CSSProperties) => (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 16, background: solid ? accent : C.surface, border: `1px solid ${solid ? accent : C.hair}`, color: solid ? C.dark : C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: solid ? 700 : 400, opacity: op, ...extra }}>{txt}</div>
  );
  return (
    <Stage background={background}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, opacity: 1 - cv }}>
        {branches.map((_, i) => {
          const by = by0 + i * (bh + bgap) + bh / 2;
          const draw = seg(t, startSec + 0.3 + i * 0.18, startSec + 0.75 + i * 0.18);
          return <path key={i} d={`M ${rootX + 130} ${rootY} C ${rootX + 330} ${rootY}, ${bx - 200} ${by}, ${bx} ${by}`} fill="none" stroke={C.panel} strokeWidth={4} strokeDasharray={900} strokeDashoffset={900 * (1 - draw)} />;
        })}
      </svg>
      <div style={{ opacity: 1 - cv }}>
        {chip(rootLabel, rootX - 130, rootY - 55, 260, 110, true, seg(t, startSec, startSec + 0.3))}
        {branches.map((b, i) => {
          const at = startSec + 0.55 + i * 0.18;
          const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 16, stiffness: 150 } });
          return chip(b, bx, by0 + i * (bh + bgap), bw, bh, false, p, { transform: `translateX(${(1 - p) * 60}px)` });
        })}
      </div>
      <div style={{ opacity: cv }}>
        {chip(inputLabel, 330, 485, 300, 110, false, 1)}
        <div style={{ position: 'absolute', left: 660, top: 528, fontSize: 44, color: accent, opacity: cv }}>→</div>
        {chip(rootLabel, 730, 485, 460, 110, false, 1)}
        <div style={{ position: 'absolute', left: 1220, top: 528, fontSize: 44, color: accent, opacity: cv }}>→</div>
        {chip(outputLabel, 1290, 485, 300, 110, true, 1)}
      </div>
    </Stage>
  );
};
