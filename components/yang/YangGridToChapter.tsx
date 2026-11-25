// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/f8e6405a4d33/src/calibration-a.tsx (N006)
// 用途：六格规则入口放大成章节并反转底色：六格入口排布，聚焦格放大到全幅、底色反转，章节题落定（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangGridToChapterProps = {
  cells: string[];
  focusIndex: number;
  chapterTitle: string;
  startSec?: number;
  zoomAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangGridToChapter: React.FC<YangGridToChapterProps> = ({
  cells, focusIndex, chapterTitle, startSec = 0.3, zoomAtSec = 1.7, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const six = cells.slice(0, 6);
  const cols = 3, cw = 470, ch = 300, gx = 36, gy = 32;
  const gridW = cols * cw + (cols - 1) * gx, gridH = 2 * ch + gy;
  const x0 = (1920 - gridW) / 2, y0 = (1080 - gridH) / 2;
  const zp = seg(t, zoomAtSec, zoomAtSec + 0.7);
  const fx = x0 + (focusIndex % cols) * (cw + gx), fy = y0 + Math.floor(focusIndex / cols) * (ch + gy);
  const zoomW = interpolate(zp, [0, 1], [cw, 1500]), zoomH = interpolate(zp, [0, 1], [ch, 700]);
  const zoomX = interpolate(zp, [0, 1], [fx, (1920 - 1500) / 2]), zoomY = interpolate(zp, [0, 1], [fy, (1080 - 700) / 2]);
  const titleP = spring({ frame, fps, delay: Math.round((zoomAtSec + 0.45) * fps), config: { damping: 13, stiffness: 170 } });
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', inset: 0, background: '#ECE8DF', opacity: zp }} />
      {six.map((c, i) => {
        if (i === focusIndex) return null;
        const at = startSec + i * 0.1;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 16, stiffness: 160 } });
        const x = x0 + (i % cols) * (cw + gx), y = y0 + Math.floor(i / cols) * (ch + gy);
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: cw, height: ch, borderRadius: 18, background: C.surface, border: `1px solid ${C.hair}`, opacity: p * (1 - zp), transform: `scale(${0.75 + 0.25 * p})`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 30px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: 42, color: C.text, textAlign: 'center' }}>{c}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: zoomX, top: zoomY, width: zoomW, height: zoomH, borderRadius: 22, background: zp > 0.5 ? '#17130A' : C.surface, border: `2px solid ${accent}`, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 40, color: zp > 0.5 ? '#ECE8DF' : C.text, opacity: 1 - zp }}>{six[focusIndex]}</div>
        <div style={{ fontSize: 84, fontWeight: 800, color: accent, opacity: titleP, transform: `translateY(${(1 - titleP) * 30}px)`, textAlign: 'center', padding: '0 60px' }}>{chapterTitle}</div>
      </div>
    </Stage>
  );
};
