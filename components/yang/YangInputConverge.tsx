// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/5673609cc79a/groups/r/legacy/src/EncoderV3.tsx (L81-R006)
// 用途：多种输入汇聚为统一入口：输入片沿弧线把光点送入右侧入口胶囊，入口逐次点亮（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangInputConvergeProps = {
  inputs: string[];
  entryLabel: string;
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangInputConverge: React.FC<YangInputConvergeProps> = ({
  inputs, entryLabel, startSec = 0.3, gapSec = 0.5, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ix = 240, iw = 380, ih = 96, igap = 36;
  const totalH = inputs.length * ih + (inputs.length - 1) * igap;
  const iy0 = (1080 - totalH) / 2;
  const ex = 1330, ey = 540;
  const pathOf = (i: number) => {
    const sy = iy0 + i * (ih + igap) + ih / 2;
    return { d: `M ${ix + iw} ${sy} C ${ix + iw + 260} ${sy}, ${ex - 260} ${ey}, ${ex} ${ey}`, sy };
  };
  const arrived = inputs.filter((_, i) => t > startSec + 0.5 + i * gapSec + 0.8).length;
  return (
    <Stage background={background}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {inputs.map((_, i) => {
          const { d } = pathOf(i);
          const draw = seg(t, startSec + 0.4 + i * gapSec, startSec + 0.9 + i * gapSec);
          const dotP = seg(t, startSec + 0.5 + i * gapSec, startSec + 1.3 + i * gapSec);
          const sy = iy0 + i * (ih + igap) + ih / 2;
          const dx = interpolate(dotP, [0, 1], [ix + iw, ex]);
          const dy = interpolate(dotP, [0, 1], [sy, ey], { easing: Easing.bezier(0.4, 0, 0.6, 1) });
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={C.panel} strokeWidth={4} strokeDasharray={1100} strokeDashoffset={1100 * (1 - draw)} />
              {dotP > 0 && dotP < 1 && <circle cx={dx} cy={dy} r={13} fill={accent} />}
            </g>
          );
        })}
      </svg>
      {inputs.map((inp, i) => {
        const at = startSec + i * gapSec;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 16, stiffness: 150 } });
        return (
          <div key={i} style={{ position: 'absolute', left: ix, top: iy0 + i * (ih + igap), width: iw, height: ih, borderRadius: 999, background: C.surface, border: `1px solid ${C.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
            <span style={{ fontSize: 38, color: C.text }}>{inp}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: ex, top: ey - 70, width: 380, height: 140, borderRadius: 999, background: arrived > 0 ? accent : C.panel, color: arrived > 0 ? C.dark : C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 700, transform: `translateX(-50%) scale(${1 + 0.05 * seg(t, startSec + inputs.length * gapSec + 0.6, startSec + inputs.length * gapSec + 0.9)})`, boxShadow: arrived > 0 ? '0 0 70px rgba(200,162,74,0.4)' : 'none' }}>
        {entryLabel}{arrived > 0 ? ` · ${arrived}` : ''}
      </div>
    </Stage>
  );
};
