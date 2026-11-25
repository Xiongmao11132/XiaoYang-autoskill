// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/expansion-selected-20261007/expansion-selected-20261007/src/OpeningScenes.tsx (OP02)
// 用途：双侧门片揭开新视频：两扇门片自中心向两侧滑开，门后画面亮相、题签落下（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangDoorRevealProps = {
  src?: string;
  title?: string;
  startSec?: number;
  openAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangDoorReveal: React.FC<YangDoorRevealProps> = ({
  src, title, startSec = 0.3, openAtSec = 0.8, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const op = seg(t, openAtSec, openAtSec + 0.85);
  const winW = 1240, winH = 700, winX = (1920 - winW) / 2, winY = (1080 - winH) / 2;
  const door = (side: number) => (
    <div style={{ position: 'absolute', top: winY, width: winW / 2 + 4, height: winH, left: side === 0 ? winX : winX + winW / 2 - 4, background: 'linear-gradient(180deg,#1B222C,#12161D)', border: `1px solid ${C.hair}`, transform: `translateX(${side === 0 ? -op * (winW / 2 + 30) : op * (winW / 2 + 30)}px)`, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: side === 0 ? 'flex-end' : 'flex-start' }}>
      <div style={{ width: 14, height: 110, borderRadius: 7, background: accent, margin: side === 0 ? '0 26px 0 0' : '0 0 0 26px', opacity: 0.9 }} />
    </div>
  );
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: winX, top: winY, width: winW, height: winH, borderRadius: 6, overflow: 'hidden', opacity: seg(t, startSec, startSec + 0.3) }}>
        <MediaImg src={src} label="新画面" style={{ width: '100%', height: '100%' }} />
      </div>
      {door(0)}{door(1)}
      {title && <div style={{ position: 'absolute', left: '50%', top: winY + winH + 44, transform: `translateX(-50%) translateY(${(1 - seg(t, openAtSec + 0.5, openAtSec + 0.9)) * 24}px)`, opacity: seg(t, openAtSec + 0.5, openAtSec + 0.9), background: '#05070A', border: `1px solid ${C.hair}`, borderRadius: 999, padding: '14px 44px', fontSize: 38, color: C.text }}>{title}</div>}
    </Stage>
  );
};
