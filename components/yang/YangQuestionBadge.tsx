// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/f8e6405a4d33/src/RebuiltN032.tsx (N032)
// 用途：条件问号变成答案徽章：问号圆盘脉冲后翻转成答案徽章，问题句在上方落定（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangQuestionBadgeProps = {
  question: string;
  answer: string;
  startSec?: number;
  morphAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangQuestionBadge: React.FC<YangQuestionBadgeProps> = ({
  question, answer, startSec = 0.3, morphAtSec = 1.4, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const intro = spring({ frame, fps, delay: Math.round(startSec * fps), config: { damping: 14, stiffness: 160 } });
  const pulse = 1 + 0.045 * Math.sin(t * 5);
  const mp = seg(t, morphAtSec, morphAtSec + 0.55);
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: 0, top: 250, width: 1920, textAlign: 'center', fontSize: 58, color: C.text, opacity: seg(t, startSec + 0.2, startSec + 0.6) }}>{question}</div>
      <div style={{ position: 'absolute', left: '50%', top: 560, width: 300, height: 300, borderRadius: '50%', background: C.surface, border: `2px solid ${C.hair}`, transform: `translate(-50%,-50%) scale(${intro * pulse * (1 - mp)}) rotate(${mp * 90}deg)`, opacity: 1 - mp, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 170, fontWeight: 800, color: accent }}>?</span>
      </div>
      <div style={{ position: 'absolute', left: '50%', top: 560, transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * eob(mp)})`, opacity: mp, background: accent, borderRadius: 999, padding: '40px 76px', boxShadow: '0 34px 90px rgba(0,0,0,0.55)', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 64, fontWeight: 800, color: C.dark }}>✓ {answer}</span>
      </div>
    </Stage>
  );
};
