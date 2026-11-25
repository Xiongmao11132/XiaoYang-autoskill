// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/d864313852a2/groups/r/legacy/src/CountV3.tsx (L81-R005)
// 用途：数字展开为分类分支：大数字砸入后收成小片，分支线向下展开到分类片（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangNumberBranchesProps = {
  value: string;
  unit?: string;
  branches: string[];
  startSec?: number;
  branchAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangNumberBranches: React.FC<YangNumberBranchesProps> = ({
  value, unit, branches, startSec = 0.3, branchAtSec = 1.3, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const slam = spring({ frame, fps, delay: Math.round(startSec * fps), config: { damping: 12, stiffness: 170, mass: 1 } });
  const shrink = seg(t, branchAtSec, branchAtSec + 0.6);
  const numScale = (0.7 + 0.3 * slam) * (1 - 0.52 * shrink);
  const numY = 400 - 190 * shrink;
  const bw = 400, bh = 108, gap = 30;
  const totalW = branches.length * bw + (branches.length - 1) * gap;
  const bx0 = (1920 - totalW) / 2, by = 700;
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: 0, top: numY, width: 1920, textAlign: 'center', opacity: slam, transform: `scale(${numScale})` }}>
        <span style={{ fontSize: 210, fontWeight: 800, color: accent, letterSpacing: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 54, color: C.text, marginLeft: 14 }}>{unit}</span>}
      </div>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {branches.map((_, i) => {
          const cx = bx0 + i * (bw + gap) + bw / 2;
          const draw = seg(t, branchAtSec + 0.25 + i * 0.1, branchAtSec + 0.7 + i * 0.1);
          return <path key={i} d={`M 960 ${numY + 150} C 960 ${numY + 300}, ${cx} ${by - 160}, ${cx} ${by}`} fill="none" stroke={C.panel} strokeWidth={4} strokeDasharray={700} strokeDashoffset={700 * (1 - draw)} />;
        })}
      </svg>
      {branches.map((b, i) => {
        const at = branchAtSec + 0.55 + i * 0.1;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 15, stiffness: 160 } });
        return (
          <div key={i} style={{ position: 'absolute', left: bx0 + i * (bw + gap), top: by, width: bw, height: bh, borderRadius: 16, background: C.surface, border: `1px solid ${C.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
            <span style={{ fontSize: 40, color: C.text }}>{b}</span>
          </div>
        );
      })}
    </Stage>
  );
};
