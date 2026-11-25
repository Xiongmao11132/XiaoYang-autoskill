// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/51d38fffd57b/groups/b/src/RebuiltBChartStage.tsx (L81-B075)
// 用途：虚线圆角舞台从标题切入案例：虚线舞台框描画成形，题签压框角，案例画面在框内亮相（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangDashedStageProps = {
  title: string;
  src?: string;
  caption?: string;
  startSec?: number;
  accent?: string;
  background?: string;
};

export const YangDashedStage: React.FC<YangDashedStageProps> = ({
  title, src, caption, startSec = 0.3, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const sx = 210, sy = 170, sw = 1500, sh = 740;
  const per = 2 * (sw + sh);
  const draw = seg(t, startSec, startSec + 0.9);
  const inner = seg(t, startSec + 0.6, startSec + 1.1);
  const tagP = spring({ frame, fps, delay: Math.round((startSec + 0.5) * fps), config: { damping: 13, stiffness: 180 } });
  return (
    <Stage background={background}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <rect x={sx} y={sy} width={sw} height={sh} rx={28} fill="none" stroke={accent} strokeWidth={4} strokeDasharray={`26 18`} strokeDashoffset={-per * (1 - draw)} opacity={0.95} />
        <rect x={sx} y={sy} width={sw} height={sh} rx={28} fill="none" stroke={accent} strokeWidth={4} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} opacity={0.25} />
      </svg>
      <div style={{ position: 'absolute', left: sx + 60, top: sy - 40, background: accent, color: C.dark, borderRadius: 999, padding: '16px 44px', fontSize: 42, fontWeight: 700, opacity: tagP, transform: `scale(${0.7 + 0.3 * tagP})`, zIndex: 3 }}>{title}</div>
      <div style={{ position: 'absolute', left: sx + 46, top: sy + 46, width: sw - 92, height: sh - 92 - (caption ? 90 : 0), borderRadius: 20, overflow: 'hidden', opacity: inner, transform: `scale(${0.96 + 0.04 * inner})`, border: `1px solid ${C.hair}` }}>
        <MediaImg src={src} label="案例画面" style={{ width: '100%', height: '100%' }} />
      </div>
      {caption && <div style={{ position: 'absolute', left: sx + 46, top: sy + sh - 108, fontSize: 36, color: C.muted, opacity: inner }}>{caption}</div>}
    </Stage>
  );
};
