// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/65b6174940b2/groups/b/src/RebuiltB064.tsx (L81-B064)
// 用途：需求关键词从模糊目录中突出：整表先虚化，目标行去虚、放大并亮出 accent 边标（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangBlurListFocusProps = {
  items: string[];
  focusIndex: number;
  startSec?: number;
  focusAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangBlurListFocus: React.FC<YangBlurListFocusProps> = ({
  items, focusIndex, startSec = 0.3, focusAtSec = 1.1, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rowW = 1040, rowH = 96, gap = 22;
  const totalH = items.length * rowH + (items.length - 1) * gap;
  const top0 = (1080 - totalH) / 2;
  const fp = seg(t, focusAtSec, focusAtSec + 0.5);
  const intro = seg(t, startSec, startSec + 0.4);
  return (
    <Stage background={background}>
      {items.map((it, i) => {
        const isF = i === focusIndex;
        const blur = isF ? 3 * (1 - fp) : 3 + 3 * fp;
        const op = (isF ? 0.55 + 0.45 * fp : 0.55 - 0.2 * fp) * intro;
        return (
          <div key={i} style={{ position: 'absolute', left: (1920 - rowW) / 2, top: top0 + i * (rowH + gap), width: rowW, height: rowH, borderRadius: 16, background: C.surface, border: `1px solid ${isF && fp > 0.5 ? accent : C.hair}`, filter: `blur(${blur}px)`, opacity: op, transform: `scale(${isF ? 1 + 0.05 * fp : 1})`, display: 'flex', alignItems: 'center', padding: '0 40px', boxSizing: 'border-box', zIndex: isF ? 2 : 1 }}>
            {isF && <div style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 8, borderRadius: 4, background: accent, opacity: fp }} />}
            <span style={{ fontSize: 42, color: isF ? C.text : C.muted }}>{it}</span>
          </div>
        );
      })}
    </Stage>
  );
};
