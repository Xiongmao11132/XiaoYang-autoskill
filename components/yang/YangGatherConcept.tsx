// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/20ed20e4f9f3/groups/ctw/core/src/RebuiltT09.tsx (L81-T09)
// 用途：多对象聚拢并归为一个概念：散布的条目圆片向中心聚拢，融合成一枚概念胶囊（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangGatherConceptProps = {
  items: string[];
  concept: string;
  startSec?: number;
  gatherAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangGatherConcept: React.FC<YangGatherConceptProps> = ({
  items, concept, startSec = 0.3, gatherAtSec = 1.6, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const spots = [
    { x: 330, y: 240 }, { x: 1330, y: 220 }, { x: 260, y: 700 }, { x: 1380, y: 690 }, { x: 830, y: 130 },
  ];
  const gp = seg(t, gatherAtSec, gatherAtSec + 0.7);
  const cp = spring({ frame, fps, delay: Math.round((gatherAtSec + 0.45) * fps), config: { damping: 12, stiffness: 170 } });
  return (
    <Stage background={background}>
      {items.slice(0, 5).map((it, i) => {
        const at = startSec + i * 0.14;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 16, stiffness: 160 } });
        const s = spots[i % spots.length];
        const x = interpolate(gp, [0, 1], [s.x, 960]), y = interpolate(gp, [0, 1], [s.y, 540]);
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${(0.6 + 0.4 * p) * (1 - 0.4 * gp)})`, opacity: p * (1 - gp * 0.9), background: C.surface, border: `1px solid ${C.hair}`, borderRadius: 999, padding: '24px 44px', whiteSpace: 'nowrap', boxShadow: '0 22px 50px rgba(0,0,0,0.4)' }}>
            <span style={{ fontSize: 42, color: C.text }}>{it}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * cp})`, opacity: cp, background: accent, borderRadius: 999, padding: '40px 90px', boxShadow: '0 36px 90px rgba(0,0,0,0.55)', whiteSpace: 'nowrap', zIndex: 4 }}>
        <span style={{ fontSize: 60, fontWeight: 800, color: C.dark }}>{concept}</span>
      </div>
    </Stage>
  );
};
