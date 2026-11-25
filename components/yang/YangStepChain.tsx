// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/30b3c05aa839/src/BatchC.tsx (N027 分支 → src/calibration-c/ChalkBoard.tsx)
// 用途：步骤串起（N027 提炼）——流程线一站站连起步骤、到行尾绕回下一行，连续建立多排步骤（黑板/深底版式，步骤数组外部传入）。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, clamp01 } from '../src/theme';

export type YangStepChainProps = {
  steps: string[];
  title?: string;
  /** 每步建立间隔（秒） */
  perStepSec?: number;
  startSec?: number;
  accent?: string;
  background?: string;
  boardColor?: string;
  textColor?: string;
  /** 每行步数（原版 3 / 3 / 2 的蛇形排布） */
  columns?: number;
};

const seg = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: Easing.bezier(0.22, 0.8, 0.2, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export const YangStepChain: React.FC<YangStepChainProps> = ({
  steps,
  title,
  perStepSec = 0.55,
  startSec = 0.3,
  accent = C.brass,
  background = '#FFFFFF',
  boardColor = '#202525',
  textColor = '#FFFFFF',
  columns = 3,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;

  // 1920×1080 设计坐标（沿原版黑板几何：板 168,124 1596×850；节点三列）
  const board = { x: 168, y: 124, w: 1596, h: 850 };
  const nodeW = 340, nodeH = 108;
  const colX = [336, 843, 1314];
  const rowY = [375, 574, 780];
  const rows = Math.ceil(steps.length / columns);
  const posOf = (i: number) => {
    const r = Math.floor(i / columns), c = i % columns;
    const inRow = Math.min(columns, steps.length - r * columns);
    // 末行不足列数时按原版居中偏移（第三行 2 步位于 529 / 1013）
    const xOff = inRow < columns ? (columns - inRow) * 96 : 0;
    return { x: (colX[c] ?? 336) + xOff, y: rowY[Math.min(r, rowY.length - 1)] ?? 780, cx: (colX[c] ?? 336) + xOff + nodeW / 2, cy: (rowY[Math.min(r, rowY.length - 1)] ?? 780) + 55 };
  };
  // 连接线：行内向右；行尾绕回下一行首（原版大弧线）
  const linkPath = (i: number) => {
    const a = posOf(i), b = posOf(i + 1);
    const sameRow = Math.floor(i / columns) === Math.floor((i + 1) / columns);
    if (sameRow) {
      const y = a.cy - 20;
      return `M ${a.x + nodeW + 8} ${y} Q ${(a.x + nodeW + b.x) / 2} ${y - 2} ${b.x - 10} ${y} M ${b.x - 32} ${y - 17} L ${b.x - 10} ${y} L ${b.x - 32} ${y + 18}`;
    }
    return `M ${a.x + nodeW + 28} ${a.cy - 16} C ${a.x + nodeW + 82} ${a.cy - 4} ${a.x + nodeW + 76} ${a.cy + 58} ${a.x + nodeW - 44} ${a.cy + 78} C ${a.x + 40} ${b.cy - 62} ${b.x - 160} ${b.cy - 56} ${b.x - 118} ${b.cy - 28} C ${b.x - 92} ${b.cy - 6} ${b.x - 46} ${b.cy + 2} ${b.x - 18} ${b.cy} M ${b.x - 44} ${b.cy - 21} L ${b.x - 18} ${b.cy} L ${b.x - 45} ${b.cy + 22}`;
  };

  return (
    <AbsoluteFill style={{ background, fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${width / 1920}, ${height / 1080})`, transformOrigin: 'top left' }}>
        <div style={{ position: 'absolute', left: board.x, top: board.y, width: board.w, height: board.h, borderRadius: 26, background: boardColor, boxShadow: '0 18px 32px rgba(0,0,0,.35), inset 0 0 17px rgba(191,196,196,.4)', overflow: 'hidden', border: '1px solid rgba(198,204,204,.33)' }}>
          <div style={{ position: 'relative', height: 77, background: 'rgba(13,17,17,.72)', display: 'flex', gap: 20, paddingLeft: 47, paddingTop: 28, boxSizing: 'border-box' }}>
            {[accent, '#D8D8D8', '#919191'].map((color, i) => (<i key={i} style={{ width: 21, height: 21, borderRadius: '50%', background: color }} />))}
          </div>
        </div>
        {title ? (
          <div style={{ position: 'absolute', left: 0, top: 194, width: 1920, textAlign: 'center', fontSize: 84, lineHeight: 1.2, color: textColor }}>{title}</div>
        ) : null}
        <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
          {steps.slice(0, -1).map((_, i) => {
            const drawAt = startSec + (i + 1) * perStepSec - perStepSec * 0.55;
            const p = seg(t, drawAt, drawAt + perStepSec * 0.55);
            return (
              <path key={i} d={linkPath(i)} fill="none" stroke={textColor} strokeWidth={i % columns === columns - 1 ? 9 : 6.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.92} />
            );
          })}
        </svg>
        {steps.map((s, i) => {
          const at = startSec + i * perStepSec;
          const p = seg(t, at, at + 0.3);
          const { x, y } = posOf(i);
          return (
            <div key={i} style={{ position: 'absolute', left: x, top: y, width: nodeW, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
              <div style={{ fontSize: 76, lineHeight: 1.2, letterSpacing: -2, color: textColor, whiteSpace: 'nowrap', fontWeight: 500 }}>{s}</div>
              <div style={{ marginTop: 6, fontSize: 26, color: accent, letterSpacing: 3 }}>{`STEP ${i + 1}`}</div>
            </div>
          );
        })}
        {rows > 3 ? <div style={{ position: 'absolute', left: board.x, top: board.y + board.h + 12, fontSize: 24, color: C.muted }}>注：版式按三行设计，步骤超过 {columns * 3} 个时请拆段使用。</div> : null}
        <div style={{ opacity: clamp01(1) }} />
      </div>
    </AbsoluteFill>
  );
};
