// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/expansion-selected-20261007/expansion-selected-20261007/src/NovelScenes.tsx (EX05)
// 用途：错误顺序重排成动作关系：卡片先以乱序亮相（红序号），随后各自滑到正确位置、序号转正（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangReorderStepsProps = {
  items: string[];
  /** 初始乱序：第 k 个位置上放 items[wrongOrder[k]] */
  wrongOrder: number[];
  startSec?: number;
  fixAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangReorderSteps: React.FC<YangReorderStepsProps> = ({
  items, wrongOrder, startSec = 0.3, fixAtSec = 1.9, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const n = items.length;
  const cardW = 400, cardH = 300, gap = 36;
  const totalW = n * cardW + (n - 1) * gap;
  const x0 = (1920 - totalW) / 2, y = 390;
  const slotOf = (itemIdx: number) => items.indexOf(items[itemIdx]);
  const wrongPosOf = (itemIdx: number) => wrongOrder.indexOf(itemIdx);
  const fix = seg(t, fixAtSec, fixAtSec + 0.75);
  return (
    <Stage background={background}>
      {items.map((it, itemIdx) => {
        const at = startSec + wrongPosOf(itemIdx) * 0.14;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 16, stiffness: 160 } });
        const fromX = x0 + wrongPosOf(itemIdx) * (cardW + gap);
        const toX = x0 + slotOf(itemIdx) * (cardW + gap);
        const x = interpolate(fix, [0, 1], [fromX, toX]);
        const wrong = wrongPosOf(itemIdx) !== slotOf(itemIdx);
        return (
          <div key={itemIdx} style={{ position: 'absolute', left: x, top: y + (1 - p) * 70, width: cardW, height: cardH, borderRadius: 20, background: C.surface, border: `1px solid ${fix > 0.9 || !wrong ? accent : '#B0503C'}`, opacity: p, padding: '30px 32px', boxSizing: 'border-box', zIndex: fix > 0 && wrong ? 3 : 1 }}>
            <div style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: '50%', background: fix > 0.5 || !wrong ? accent : '#B0503C', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800 }}>{slotOf(itemIdx) + 1}</div>
            <div style={{ fontSize: 44, color: C.text, marginTop: 26, lineHeight: 1.3 }}>{it}</div>
            {wrong && fix < 0.5 && <div style={{ position: 'absolute', right: 26, top: 30, fontSize: 30, color: '#B0503C' }}>乱序</div>}
            {fix >= 0.5 && <div style={{ position: 'absolute', right: 26, top: 26, fontSize: 34, color: accent }}>✓</div>}
          </div>
        );
      })}
    </Stage>
  );
};
