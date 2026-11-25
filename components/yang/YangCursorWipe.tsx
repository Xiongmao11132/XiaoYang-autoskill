// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/expansion-selected-20261007/expansion-selected-20261007/src/NovelScenes.tsx (OP10)
// 用途：鼠标连续擦出主视频：光标沿横向波浪轨迹扫过，所到之处盖布揭开、画面露出（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangCursorWipeProps = {
  src?: string;
  startSec?: number;
  wipeSec?: number;
  accent?: string;
  background?: string;
};

export const YangCursorWipe: React.FC<YangCursorWipeProps> = ({
  src, startSec = 0.3, wipeSec = 1.7, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const winW = 1240, winH = 700, winX = (1920 - winW) / 2, winY = (1080 - winH) / 2;
  const wp = seg(t, startSec + 0.3, startSec + 0.3 + wipeSec);
  const cx = winX + wp * winW;
  const cy = winY + winH / 2 + Math.sin(wp * Math.PI * 3) * 120;
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: winX, top: winY, width: winW, height: winH, borderRadius: 18, background: C.surface, border: `1px solid ${C.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 40, color: C.muted }}>擦除盖布，露出画面 →</span>
      </div>
      <div style={{ position: 'absolute', left: winX, top: winY, width: winW, height: winH, borderRadius: 18, overflow: 'hidden', clipPath: `inset(0 ${(1 - wp) * 100}% 0 0)` }}>
        <MediaImg src={src} label="主视频" style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ position: 'absolute', left: winX, top: winY, width: winW, height: winH, borderRadius: 18, borderRight: wp > 0 && wp < 1 ? `4px solid ${accent}` : 'none', clipPath: `inset(0 ${(1 - wp) * 100}% 0 0)`, pointerEvents: 'none' }} />
      {wp < 1 && (
        <svg style={{ position: 'absolute', left: cx - 6, top: cy - 4, zIndex: 5, filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.5))' }} width="54" height="54" viewBox="0 0 24 24">
          <path d="M5 3 L19 12 L12.5 13.5 L15.5 20 L12.8 21.3 L9.8 14.8 L5.5 18 Z" fill="#FFFFFF" stroke="#17130A" strokeWidth="1.2" />
        </svg>
      )}
    </Stage>
  );
};
