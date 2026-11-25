// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/793c2539ad42/groups/b/src/RebuiltBPills.tsx (L81-B038)
// 用途：三层黑色短句：宽黑条逐层从交替方向砸入堆叠，末行落 accent 下划线（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangStatementStackProps = {
  lines: string[];
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangStatementStack: React.FC<YangStatementStackProps> = ({
  lines, startSec = 0.3, gapSec = 0.5, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const barW = 1240, barH = 138, gap = 40;
  const totalH = lines.length * barH + (lines.length - 1) * gap;
  const top0 = (1080 - totalH) / 2;
  return (
    <Stage background={background}>
      {lines.map((ln, i) => {
        const at = startSec + i * gapSec;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 13, stiffness: 170, mass: 0.9 } });
        const fromLeft = i % 2 === 0;
        return (
          <div key={i} style={{ position: 'absolute', left: (1920 - barW) / 2 + (i - (lines.length - 1) / 2) * 36, top: top0 + i * (barH + gap), width: barW, height: barH, background: '#05070A', border: `1px solid ${C.hair}`, borderRadius: 18, opacity: p, transform: `translateX(${(1 - p) * (fromLeft ? -160 : 160)}px) scale(${0.9 + 0.1 * p})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>
            <span style={{ fontSize: 54, color: '#FFFFFF', letterSpacing: 1, borderBottom: i === lines.length - 1 ? `5px solid ${accent}` : '5px solid transparent', paddingBottom: 6 }}>{ln}</span>
          </div>
        );
      })}
    </Stage>
  );
};
