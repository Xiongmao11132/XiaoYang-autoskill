// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/expansion-selected-20261007/expansion-selected-20261007/src/HandoffScenes.tsx (HD02)
// 用途：旧片留位新片接管：旧画面先占主位，随后新画面滑入接管主位，旧画面缩到角落留位（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangSlotHandoffProps = {
  oldSrc?: string;
  newSrc?: string;
  oldLabel?: string;
  newLabel?: string;
  startSec?: number;
  handoffAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangSlotHandoff: React.FC<YangSlotHandoffProps> = ({
  oldSrc, newSrc, oldLabel = '上一段', newLabel = '接下来', startSec = 0.3, handoffAtSec = 1.5, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const hp = seg(t, handoffAtSec, handoffAtSec + 0.7);
  const intro = seg(t, startSec, startSec + 0.4);
  const mainW = 1180, mainH = 664, mainX = (1920 - mainW) / 2, mainY = (1080 - mainH) / 2;
  const oldW = interpolate(hp, [0, 1], [mainW, 400]), oldH = interpolate(hp, [0, 1], [mainH, 226]);
  const oldX = interpolate(hp, [0, 1], [mainX, 90]), oldY = interpolate(hp, [0, 1], [mainY, 1080 - 226 - 60]);
  const newX = interpolate(hp, [0, 1], [1920 + 60, mainX]);
  const tag = (txt: string, x: number, y: number, op: number, solid: boolean) => (
    <div style={{ position: 'absolute', left: x, top: y, background: solid ? accent : '#05070A', color: solid ? C.dark : C.text, border: `1px solid ${C.hair}`, borderRadius: 999, padding: '8px 26px', fontSize: 30, fontWeight: solid ? 700 : 400, opacity: op, zIndex: 5 }}>{txt}</div>
  );
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: newX, top: mainY, width: mainW, height: mainH, borderRadius: 18, overflow: 'hidden', border: `2px solid ${accent}`, opacity: intro, zIndex: 2 }}>
        <MediaImg src={newSrc} label={newLabel} style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ position: 'absolute', left: oldX, top: oldY, width: oldW, height: oldH, borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.hair}`, opacity: intro, zIndex: 3 }}>
        <MediaImg src={oldSrc} label={oldLabel} style={{ width: '100%', height: '100%' }} />
      </div>
      {tag(oldLabel, oldX + 20, oldY + 18, intro, false)}
      {tag(newLabel, mainX + 24, mainY + 22, hp, true)}
    </Stage>
  );
};
