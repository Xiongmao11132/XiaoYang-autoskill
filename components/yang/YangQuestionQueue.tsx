// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/f383bd215d85/src/calibration-a.tsx (N002)
// 用途：当前问题写出后斜退进历史队列：问题卡打出后倾斜后退、叠进身后的历史问题队列，新卡位淡入（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangQuestionQueueProps = {
  current: string;
  history: string[];
  startSec?: number;
  retireAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangQuestionQueue: React.FC<YangQuestionQueueProps> = ({
  current, history, startSec = 0.3, retireAtSec = 1.9, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cardW = 880, cardH = 240;
  const typeP = seg(t, startSec + 0.35, startSec + 0.35 + current.length * 0.05);
  const shown = Math.round(typeP * current.length);
  const rp = seg(t, retireAtSec, retireAtSec + 0.7);
  const hist = history.slice(0, 3);
  return (
    <Stage background={background}>
      {hist.map((h, i) => {
        const depth = hist.length - i;
        const joined = seg(t, retireAtSec + 0.62, retireAtSec + 0.85) > 0.5 && i === hist.length - 1;
        return (
          <div key={i} style={{ position: 'absolute', left: 1180 + depth * 26, top: 240 + i * 190, width: 600, height: 150, borderRadius: 16, background: C.surface, border: `1px solid ${C.hair}`, opacity: 0.45 + 0.2 * i, transform: `rotate(${-2 + i * 1.6}deg)`, padding: '24px 30px', boxSizing: 'border-box', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 32, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden' }}>{joined ? current : h}</span>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: interpolate(rp, [0, 1], [520, 1206]), top: interpolate(rp, [0, 1], [420, 240 + (hist.length - 1) * 190 + 6]), width: interpolate(rp, [0, 1], [cardW, 600]), height: interpolate(rp, [0, 1], [cardH, 150]), borderRadius: 20, background: '#0B0E12', border: `2px solid ${accent}`, transform: `rotate(${rp * -2}deg) scale(${1 - 0.1 * rp})`, opacity: 1 - seg(t, retireAtSec + 0.5, retireAtSec + 0.78), padding: '34px 40px', boxSizing: 'border-box', boxShadow: '0 34px 90px rgba(0,0,0,0.5)', zIndex: 4 }}>
        <div style={{ opacity: 1 - seg(t, retireAtSec + 0.25, retireAtSec + 0.55) }}>
          <div style={{ fontSize: 28, color: accent, fontWeight: 700, letterSpacing: 3 }}>当前问题</div>
          <div style={{ fontSize: 46, color: C.text, marginTop: 14, whiteSpace: 'nowrap' }}>{current.slice(0, shown)}{t < retireAtSec && <span style={{ opacity: Math.sin(t * 7) > 0 ? 1 : 0.1 }}>|</span>}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 520, top: 420, width: 620, height: cardH, borderRadius: 20, border: `2px dashed ${C.panel}`, opacity: seg(t, retireAtSec + 0.5, retireAtSec + 1.0), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 36, color: C.muted }}>下一个问题…</span>
      </div>
    </Stage>
  );
};
