// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/ceaeefeb914d/groups/r/faithful/src/Clip036.tsx (L81-R036)
// 用途：三枚竖胶囊合为横向窗口：三枚竖胶囊并立后逐个横转、对齐拼成一扇横向窗口，窗口内亮出画面（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangPillsToWindowProps = {
  pills: string[];
  src?: string;
  startSec?: number;
  mergeAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangPillsToWindow: React.FC<YangPillsToWindowProps> = ({
  pills, src, startSec = 0.3, mergeAtSec = 1.6, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const three = pills.slice(0, 3);
  const pw = 250, ph = 560, gap = 44;
  const totalW = three.length * pw + (three.length - 1) * gap;
  const x0 = (1920 - totalW) / 2, y = (1080 - ph) / 2;
  const mp = seg(t, mergeAtSec, mergeAtSec + 0.7);
  const winW = 1180, winH = 620;
  return (
    <Stage background={background}>
      {three.map((pl, i) => {
        const at = startSec + i * 0.18;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 16, stiffness: 160 } });
        return (
          <div key={i} style={{ position: 'absolute', left: x0 + i * (pw + gap), top: y, width: pw, height: ph, borderRadius: 999, background: C.surface, border: `1px solid ${C.hair}`, opacity: p * (1 - mp), transform: `translateY(${(1 - p) * 70}px) rotate(${mp * 90}deg) scale(${1 - 0.3 * mp})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 42, color: C.text, writingMode: 'vertical-rl', letterSpacing: 6 }}>{pl}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: (1920 - winW) / 2, top: (1080 - winH) / 2, width: winW, height: winH, borderRadius: 22, overflow: 'hidden', border: `2px solid ${accent}`, opacity: mp, transform: `scale(${0.8 + 0.2 * mp})`, boxShadow: '0 40px 100px rgba(0,0,0,0.55)' }}>
        <MediaImg src={src} label="合并窗口" style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex' }}>
          {three.map((pl, i) => (<div key={i} style={{ flex: 1, textAlign: 'center', background: 'rgba(5,7,10,0.72)', color: C.text, fontSize: 32, padding: '14px 0' }}>{pl}</div>))}
        </div>
      </div>
    </Stage>
  );
};
