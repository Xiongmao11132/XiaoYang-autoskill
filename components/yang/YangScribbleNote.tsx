// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/f14691016c16/src/components/talk-scribble-annotation.tsx (V097)
// 用途：手绘笔迹标注：截图全幅亮相，手绘椭圆绕目标区域描画成形，批注文字带小箭头随后落出（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangScribbleNoteProps = {
  src?: string;
  note: string;
  region: { x: number; y: number; w: number; h: number };
  startSec?: number;
  drawAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangScribbleNote: React.FC<YangScribbleNoteProps> = ({
  src, note, region, startSec = 0.3, drawAtSec = 0.9, accent = '#E4572E', background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const imgW = 1360, imgH = 800, imgX = (1920 - imgW) / 2, imgY = (1080 - imgH) / 2;
  const draw = seg(t, drawAtSec, drawAtSec + 0.7);
  const rx = region.x * (imgW / 1920), ry = region.y * (imgH / 1080), rw = region.w * (imgW / 1920), rh = region.h * (imgH / 1080);
  const cx = imgX + rx + rw / 2, cy = imgY + ry + rh / 2;
  const noteP = spring({ frame, fps, delay: Math.round((drawAtSec + 0.55) * fps), config: { damping: 13, stiffness: 180 } });
  const noteX = Math.min(1560, cx + rw / 2 + 90), noteY = Math.max(90, cy - rh / 2 - 130);
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: imgX, top: imgY, width: imgW, height: imgH, borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.hair}`, opacity: seg(t, startSec, startSec + 0.35) }}>
        <MediaImg src={src} label="待标注截图" style={{ width: '100%', height: '100%' }} />
      </div>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <ellipse cx={cx} cy={cy} rx={rw / 2 + 16} ry={rh / 2 + 14} fill="none" stroke={accent} strokeWidth={7} strokeLinecap="round" strokeDasharray={1600} strokeDashoffset={1600 * (1 - draw)} transform={`rotate(-2 ${cx} ${cy})`} />
        <ellipse cx={cx + 5} cy={cy + 4} rx={rw / 2 + 22} ry={rh / 2 + 19} fill="none" stroke={accent} strokeWidth={3} opacity={0.55 * draw} strokeDasharray={1700} strokeDashoffset={1700 * (1 - draw)} transform={`rotate(-1 ${cx} ${cy})`} />
        {draw > 0.8 && <path d={`M ${cx + rw / 2 + 30} ${cy - rh / 2 - 16} L ${noteX + 10} ${noteY + 66}`} stroke={accent} strokeWidth={5} fill="none" strokeLinecap="round" opacity={noteP} />}
      </svg>
      <div style={{ position: 'absolute', left: noteX, top: noteY, fontSize: 46, fontWeight: 700, color: accent, opacity: noteP, transform: `rotate(-2deg) scale(${0.7 + 0.3 * noteP})`, textShadow: '0 10px 30px rgba(0,0,0,0.55)', whiteSpace: 'nowrap' }}>{note}</div>
    </Stage>
  );
};
