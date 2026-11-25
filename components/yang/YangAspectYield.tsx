// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/f8967e2dd9b6/src/index.tsx (L81-R038)
// 用途：横屏缩小让位给竖屏，再交接下个窗口：横窗先居中，随后缩到左侧，竖窗自右升起并列（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangAspectYieldProps = {
  wideSrc?: string;
  tallSrc?: string;
  wideLabel?: string;
  tallLabel?: string;
  startSec?: number;
  yieldAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangAspectYield: React.FC<YangAspectYieldProps> = ({
  wideSrc, tallSrc, wideLabel = '横屏', tallLabel = '竖屏', startSec = 0.3, yieldAtSec = 1.4, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const intro = seg(t, startSec, startSec + 0.4);
  const yp = seg(t, yieldAtSec, yieldAtSec + 0.7);
  const wideW = interpolate(yp, [0, 1], [1160, 900]), wideH = interpolate(yp, [0, 1], [652, 506]);
  const wideX = interpolate(yp, [0, 1], [(1920 - 1160) / 2, 150]), wideY = (1080 - wideH) / 2;
  const tallW = 470, tallH = 720;
  const tallP = spring({ frame, fps, delay: Math.round((yieldAtSec + 0.25) * fps), config: { damping: 15, stiffness: 160 } });
  const tag = (txt: string, x: number, y: number, op: number) => (
    <div style={{ position: 'absolute', left: x, top: y, background: '#05070A', border: `1px solid ${C.hair}`, borderRadius: 999, padding: '8px 26px', fontSize: 30, color: C.text, opacity: op, zIndex: 4 }}>{txt}</div>
  );
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: wideX, top: wideY, width: wideW, height: wideH, borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.hair}`, opacity: intro }}>
        <MediaImg src={wideSrc} label={wideLabel} style={{ width: '100%', height: '100%' }} />
      </div>
      {tag(wideLabel, wideX + 22, wideY + 20, intro)}
      <div style={{ position: 'absolute', left: 1170, top: (1080 - tallH) / 2, width: tallW, height: tallH, borderRadius: 18, overflow: 'hidden', border: `2px solid ${accent}`, opacity: tallP, transform: `translateY(${(1 - tallP) * 90}px)`, boxShadow: '0 36px 90px rgba(0,0,0,0.5)' }}>
        <MediaImg src={tallSrc} label={tallLabel} style={{ width: '100%', height: '100%' }} />
      </div>
      {tag(tallLabel, 1192, (1080 - tallH) / 2 + 20, tallP)}
    </Stage>
  );
};
