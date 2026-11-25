// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/9db3f6625112/src/BatchC.tsx; components/projects/9db3f6625112/src/calibration-c/N030SearchRepair.tsx (N030)
// 用途：搜索框缩成查询路标，两路结果展开：查询词打入后搜索框收成路标，双列结果在下方展开（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangSearchBranchProps = {
  query: string;
  leftTitle: string;
  rightTitle: string;
  leftItems: string[];
  rightItems: string[];
  startSec?: number;
  accent?: string;
  background?: string;
};

export const YangSearchBranch: React.FC<YangSearchBranchProps> = ({
  query, leftTitle, rightTitle, leftItems, rightItems, startSec = 0.3, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const typeP = seg(t, startSec + 0.3, startSec + 0.3 + query.length * 0.09);
  const shown = Math.round(typeP * query.length);
  const morph = seg(t, startSec + 1.5, startSec + 2.1);
  const barW = interpolate(morph, [0, 1], [860, 430]);
  const barY = interpolate(morph, [0, 1], [300, 120]);
  const colW = 700, itemH = 84, gap = 22;
  const renderCol = (title: string, items: string[], x: number, delay: number) => (
    <div style={{ position: 'absolute', left: x, top: 330, width: colW, opacity: seg(t, startSec + 1.9 + delay, startSec + 2.3 + delay) }}>
      <div style={{ fontSize: 42, color: accent, fontWeight: 700, marginBottom: 26 }}>{title}</div>
      {items.map((it, i) => {
        const p = spring({ frame, fps, delay: Math.round((startSec + 2.0 + delay + i * 0.14) * fps), config: { damping: 16, stiffness: 160 } });
        return (
          <div key={i} style={{ width: colW, height: itemH, marginBottom: gap, borderRadius: 14, background: C.surface, border: `1px solid ${C.hair}`, display: 'flex', alignItems: 'center', padding: '0 30px', boxSizing: 'border-box', opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
            <span style={{ fontSize: 36, color: C.text }}>{it}</span>
          </div>
        );
      })}
    </div>
  );
  return (
    <Stage background={background}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <path d="M 960 260 C 960 330, 480 300, 440 330" fill="none" stroke={C.panel} strokeWidth={4} opacity={morph} />
        <path d="M 960 260 C 960 330, 1440 300, 1480 330" fill="none" stroke={C.panel} strokeWidth={4} opacity={morph} />
      </svg>
      <div style={{ position: 'absolute', left: (1920 - barW) / 2, top: barY, width: barW, height: 104, borderRadius: 999, background: '#FFFFFF', display: 'flex', alignItems: 'center', padding: '0 40px', boxSizing: 'border-box', boxShadow: '0 24px 60px rgba(0,0,0,0.45)', opacity: seg(t, startSec, startSec + 0.3) }}>
        <span style={{ fontSize: 36, marginRight: 16 }}>🔍</span>
        <span style={{ fontSize: 42, color: '#17130A', whiteSpace: 'nowrap', overflow: 'hidden' }}>{query.slice(0, shown)}<span style={{ opacity: Math.sin(t * 6) > 0 ? 1 : 0 }}>|</span></span>
      </div>
      {renderCol(leftTitle, leftItems, 190, 0)}
      {renderCol(rightTitle, rightItems, 1030, 0.15)}
    </Stage>
  );
};
