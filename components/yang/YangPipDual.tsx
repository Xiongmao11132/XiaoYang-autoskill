// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/ep109-selected-20261006（工程快照，composition: EP109-Selected-04） (109-04)
// 用途：画中画扩展为双窗证据对照：主窗右下角的小窗长大成与主窗并列的对照窗，两窗落签（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangPipDualProps = {
  mainSrc?: string;
  pipSrc?: string;
  mainLabel: string;
  pipLabel: string;
  startSec?: number;
  expandAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangPipDual: React.FC<YangPipDualProps> = ({
  mainSrc, pipSrc, mainLabel, pipLabel, startSec = 0.3, expandAtSec = 1.3, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ex = seg(t, expandAtSec, expandAtSec + 0.7);
  const intro = seg(t, startSec, startSec + 0.4);
  const mainW = interpolate(ex, [0, 1], [1240, 830]), mainH = interpolate(ex, [0, 1], [700, 560]);
  const mainX = interpolate(ex, [0, 1], [(1920 - 1240) / 2, 120]), mainY = interpolate(ex, [0, 1], [(1080 - 700) / 2, (1080 - 560) / 2]);
  const pipW = interpolate(ex, [0, 1], [330, 830]), pipH = interpolate(ex, [0, 1], [200, 560]);
  const pipX = interpolate(ex, [0, 1], [(1920 - 1240) / 2 + 1240 - 330 - 26, 970]), pipY = interpolate(ex, [0, 1], [(1080 - 700) / 2 + 700 - 200 - 26, (1080 - 560) / 2]);
  const label = (txt: string, x: number, y: number, op: number) => (
    <div style={{ position: 'absolute', left: x, top: y, background: '#05070A', border: `1px solid ${C.hair}`, borderRadius: 999, padding: '10px 30px', fontSize: 32, color: C.text, opacity: op, zIndex: 4 }}>{txt}</div>
  );
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: mainX, top: mainY, width: mainW, height: mainH, borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.hair}`, opacity: intro }}>
        <MediaImg src={mainSrc} label={mainLabel} style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ position: 'absolute', left: pipX, top: pipY, width: pipW, height: pipH, borderRadius: 18, overflow: 'hidden', border: `2px solid ${accent}`, opacity: intro, boxShadow: '0 26px 60px rgba(0,0,0,0.5)', zIndex: 3 }}>
        <MediaImg src={pipSrc} label={pipLabel} style={{ width: '100%', height: '100%' }} />
      </div>
      {label(mainLabel, mainX + 24, mainY + 24, ex)}
      {label(pipLabel, pipX + 24, pipY + 24, ex)}
    </Stage>
  );
};
