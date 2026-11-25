// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/f14691016c16/src/components/talk-glass-code-walk.tsx; components/projects/e5d833cd6f39/src/DecisionFlow.tsx
// 用途：毛玻璃要点卡（A 类提炼件）——背景压暗虚化后，一张 backdrop-blur 毛玻璃卡浮起，标题＋要点逐条落定。注：参数化正版 T08i-FrostedFact 属 B 类待下载，本件是 A 类玻璃面板手法（glass-code-walk 的 blur(16px)+半透明深底、DecisionFlow 99-21 的背景虚化后居中提炼）的提炼，不冒充 T08i。
import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, clamp01 } from '../src/theme';

export type YangFrostedFactCardProps = {
  title: string;
  points: string[];
  /** 背景图（public 路径或 URL）；不传则用纯色背景 */
  backgroundSrc?: string;
  note?: string;
  /** 卡片开始浮起时刻（秒，组件本地时间） */
  atSec?: number;
  /** 每条要点间隔（秒） */
  pointGapSec?: number;
  accent?: string;
  background?: string;
  /** 玻璃底色（默认原版玻璃手法 rgba(10,10,10,0.6)） */
  glassColor?: string;
  blurPx?: number;
};

const isUrl = (s: string) => /^(https?:|data:|blob:)/.test(s);

export const YangFrostedFactCard: React.FC<YangFrostedFactCardProps> = ({
  title,
  points,
  backgroundSrc,
  note,
  atSec = 0.4,
  pointGapSec = 0.45,
  accent = C.brass,
  background = C.base,
  glassColor = 'rgba(10,10,10,0.6)',
  blurPx = 16,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const dimP = clamp01((t - atSec) / 0.7);
  const cardP = spring({ frame: frame - Math.round(atSec * fps), fps, config: { damping: 16, stiffness: 120, mass: 0.9 } });

  return (
    <AbsoluteFill style={{ background, fontFamily: FONT, overflow: 'hidden' }}>
      {backgroundSrc ? (
        <div style={{ position: 'absolute', inset: 0, filter: `blur(${blurPx * dimP}px) brightness(${1 - 0.35 * dimP})`, transform: 'scale(1.06)' }}>
          <Img src={isUrl(backgroundSrc) ? backgroundSrc : staticFile(backgroundSrc)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(1100px 640px at 50% 40%, #232B36 0%, ${background} 72%)`, filter: `brightness(${1 - 0.25 * dimP})` }} />
      )}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: 980,
        transform: `translate(-50%, -50%) translateY(${(1 - cardP) * 46}px) scale(${0.94 + 0.06 * cardP})`,
        opacity: cardP, background: glassColor, backdropFilter: `blur(${blurPx}px)`, WebkitBackdropFilter: `blur(${blurPx}px)`,
        borderRadius: 16, border: '1px solid rgba(255,255,255,.16)', boxShadow: '0 30px 80px rgba(0,0,0,.5)',
        padding: '54px 64px 46px', color: C.text,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ width: 14, height: 44, borderRadius: 4, background: accent, display: 'block' }} />
          <span style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.2 }}>{title}</span>
        </div>
        <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {points.map((pt, i) => {
            const ptAt = atSec + 0.35 + i * pointGapSec;
            const p = interpolate(t, [ptAt, ptAt + 0.35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'baseline', opacity: p, transform: `translateY(${(1 - p) * 18}px)`, fontSize: 36, lineHeight: 1.5 }}>
                <span style={{ color: accent, fontWeight: 800 }}>{i + 1}.</span>
                <span>{pt}</span>
              </div>
            );
          })}
        </div>
        {note ? <div style={{ marginTop: 36, fontSize: 26, color: C.muted }}>{note}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
