// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/08077883af6e/src/RebuiltBPanels.tsx (L81-B046)
// 用途：全屏影视画面退成错位双窗口：全幅画面先后退，缩成左窗，第二窗自右下错位叠入（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangFullToDualProps = {
  srcA?: string;
  srcB?: string;
  startSec?: number;
  recedeAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangFullToDual: React.FC<YangFullToDualProps> = ({
  srcA, srcB, startSec = 0.3, recedeAtSec = 1.4, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const intro = seg(t, startSec, startSec + 0.4);
  const rp = seg(t, recedeAtSec, recedeAtSec + 0.75);
  const aW = interpolate(rp, [0, 1], [1920, 900]), aH = interpolate(rp, [0, 1], [1080, 520]);
  const aX = interpolate(rp, [0, 1], [0, 130]), aY = interpolate(rp, [0, 1], [0, 150]);
  const bP = spring({ frame, fps, delay: Math.round((recedeAtSec + 0.4) * fps), config: { damping: 15, stiffness: 160 } });
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: aX, top: aY, width: aW, height: aH, overflow: 'hidden', borderRadius: rp > 0.05 ? 18 : 0, border: rp > 0.05 ? `1px solid ${C.hair}` : 'none', opacity: intro, transform: `rotate(${-2 * rp}deg)`, zIndex: 1 }}>
        <MediaImg src={srcA} label="主画面" style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ position: 'absolute', left: 900, top: 430, width: 880, height: 510, borderRadius: 18, overflow: 'hidden', border: `2px solid ${accent}`, opacity: bP, transform: `translateY(${(1 - bP) * 80}px) rotate(${2 * bP}deg)`, boxShadow: '0 40px 100px rgba(0,0,0,0.55)', zIndex: 2 }}>
        <MediaImg src={srcB} label="第二画面" style={{ width: '100%', height: '100%' }} />
      </div>
    </Stage>
  );
};
