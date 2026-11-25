// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/19c745fe58ce/groups/b/src/RebuiltBRepresentatives.tsx (L81-B018)
// 用途：纵向胶囊清单逐项填入：胶囊逐个滑入，内部填充扫过、序号点亮（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangPillListFillProps = {
  items: string[];
  title?: string;
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangPillListFill: React.FC<YangPillListFillProps> = ({
  items, title, startSec = 0.3, gapSec = 0.42, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pillW = 980, pillH = 104, gap = 34;
  const totalH = items.length * pillH + (items.length - 1) * gap + (title ? 130 : 0);
  const top0 = (1080 - totalH) / 2 + (title ? 130 : 0);
  return (
    <Stage background={background}>
      {title && (
        <div style={{ position: 'absolute', left: (1920 - pillW) / 2, top: (1080 - totalH) / 2, fontSize: 52, color: C.text, fontWeight: 600, opacity: seg(t, startSec, startSec + 0.3) }}>{title}</div>
      )}
      {items.map((it, i) => {
        const at = startSec + i * gapSec;
        const inp = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 17, stiffness: 150, mass: 0.8 } });
        const fill = seg(t, at + 0.25, at + 0.75);
        return (
          <div key={i} style={{ position: 'absolute', left: (1920 - pillW) / 2, top: top0 + i * (pillH + gap), width: pillW, height: pillH, borderRadius: 999, background: C.surface, border: `1px solid ${C.hair}`, overflow: 'hidden', opacity: inp, transform: `translateX(${(1 - inp) * -70}px)` }}>
            <div style={{ position: 'absolute', inset: 0, width: `${fill * 100}%`, background: 'rgba(200,162,74,0.16)' }} />
            <div style={{ position: 'absolute', left: 18, top: (pillH - 62) / 2, width: 62, height: 62, borderRadius: '50%', background: fill > 0.95 ? accent : C.panel, color: fill > 0.95 ? C.dark : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700 }}>{i + 1}</div>
            <div style={{ position: 'absolute', left: 108, top: 0, height: pillH, display: 'flex', alignItems: 'center', fontSize: 42, color: C.text }}>{it}</div>
          </div>
        );
      })}
    </Stage>
  );
};
