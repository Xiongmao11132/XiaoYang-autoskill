// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/7210437846d3/src/R6LateMotion.tsx (107-04)
// 用途：三项能力按口播建立，汇聚长胶囊：三枚短胶囊逐个建立后向中心滑动合并成长胶囊亮出结论（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangTripleConvergeProps = {
  items: string[];
  result: string;
  startSec?: number;
  gapSec?: number;
  mergeAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangTripleConverge: React.FC<YangTripleConvergeProps> = ({
  items, result, startSec = 0.3, gapSec = 0.4, mergeAtSec = 2.0, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const three = items.slice(0, 3);
  const chipW = 380, chipH = 120, gap = 60;
  const totalW = three.length * chipW + (three.length - 1) * gap;
  const x0 = (1920 - totalW) / 2;
  const mg = seg(t, mergeAtSec, mergeAtSec + 0.65);
  return (
    <Stage background={background}>
      {three.map((it, i) => {
        const at = startSec + i * gapSec;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 15, stiffness: 160 } });
        const cx = x0 + i * (chipW + gap) + chipW / 2;
        const tx = interpolate(mg, [0, 1], [cx, 960]);
        return (
          <div key={i} style={{ position: 'absolute', left: tx - chipW / 2, top: 480, width: chipW, height: chipH, borderRadius: 999, background: C.surface, border: `1px solid ${C.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: p * (1 - mg), transform: `translateY(${(1 - p) * 60}px) scale(${1 - 0.25 * mg})` }}>
            <span style={{ fontSize: 42, color: C.text }}>{it}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: '50%', top: 480, transform: `translateX(-50%) scaleX(${0.3 + 0.7 * mg}) scale(${0.85 + 0.15 * mg})`, opacity: mg, background: accent, borderRadius: 999, padding: '34px 84px', whiteSpace: 'nowrap', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
        <span style={{ fontSize: 52, fontWeight: 700, color: C.dark }}>{result}</span>
      </div>
    </Stage>
  );
};
