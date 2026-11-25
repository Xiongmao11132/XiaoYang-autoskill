// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/470b7b100b0c/groups/ctw/core/src/RebuiltC004.tsx (L81-C004)
// 用途：展开当前项再回到列表：聚焦项在列表中原地长高展开详情，其余项压暗，随后收回成原列表（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangExpandReturnProps = {
  items: string[];
  focusIndex: number;
  detail: string;
  startSec?: number;
  expandAtSec?: number;
  returnAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangExpandReturn: React.FC<YangExpandReturnProps> = ({
  items, focusIndex, detail, startSec = 0.3, expandAtSec = 1.1, returnAtSec = 3.4, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rowW = 1000, rowH = 96, gap = 22;
  const totalH = items.length * rowH + (items.length - 1) * gap;
  const top0 = (1080 - totalH) / 2 - 60;
  const ex = seg(t, expandAtSec, expandAtSec + 0.55) * (1 - seg(t, returnAtSec, returnAtSec + 0.55));
  const extraH = 190 * ex;
  return (
    <Stage background={background}>
      {items.map((it, i) => {
        const isF = i === focusIndex;
        const yOff = i > focusIndex ? extraH : 0;
        const p = spring({ frame, fps, delay: Math.round((startSec + i * 0.1) * fps), config: { damping: 17, stiffness: 160 } });
        return (
          <div key={i} style={{ position: 'absolute', left: (1920 - rowW) / 2, top: top0 + i * (rowH + gap) + yOff, width: rowW, height: rowH + (isF ? extraH : 0), borderRadius: 16, background: C.surface, border: `1px solid ${isF && ex > 0.3 ? accent : C.hair}`, opacity: p * (isF ? 1 : 1 - 0.45 * ex), overflow: 'hidden', transform: `translateX(${(1 - p) * -50}px)` }}>
            <div style={{ height: rowH, display: 'flex', alignItems: 'center', padding: '0 36px', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 40, color: isF ? accent : C.muted, fontWeight: 700, marginRight: 22 }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontSize: 42, color: C.text }}>{it}</span>
            </div>
            {isF && <div style={{ padding: '6px 36px 0 100px', fontSize: 36, color: C.muted, lineHeight: 1.45, opacity: ex }}>{detail}</div>}
          </div>
        );
      })}
    </Stage>
  );
};
