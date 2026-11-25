// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/f14691016c16/src/components/snap-prompt-send.tsx (V064)
// 用途：提示词输入与发送：输入框逐字打入提示词，发送键按下后提示词落进上方对话区，回复行随后淡入（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangPromptSendProps = {
  prompt: string;
  reply?: string;
  startSec?: number;
  typeSecPerChar?: number;
  accent?: string;
  background?: string;
};

export const YangPromptSend: React.FC<YangPromptSendProps> = ({
  prompt, reply, startSec = 0.3, typeSecPerChar = 0.055, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chars = Array.from(prompt);
  const typeStart = startSec + 0.5;
  const typeEnd = typeStart + chars.length * typeSecPerChar;
  const typed = Math.min(chars.length, Math.floor(seg(t, typeStart, typeEnd) * chars.length + 0.0001));
  const sendAt = typeEnd + 0.35;
  const press = seg(t, sendAt, sendAt + 0.12) * (1 - seg(t, sendAt + 0.12, sendAt + 0.3));
  const sent = seg(t, sendAt + 0.1, sendAt + 0.5);
  const winW = 1060, winX = (1920 - winW) / 2;
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: winX, top: 150, width: winW, height: 780, borderRadius: 28, background: '#0B0E12', border: `1px solid ${C.hair}`, boxShadow: '0 40px 100px rgba(0,0,0,0.5)', opacity: seg(t, startSec, startSec + 0.3) }}>
        <div style={{ position: 'absolute', right: 36, top: 48, maxWidth: 760, background: accent, color: C.dark, borderRadius: '20px 20px 6px 20px', padding: '22px 30px', fontSize: 40, opacity: sent, transform: `translateY(${(1 - sent) * 30}px)` }}>{prompt}</div>
        {reply && <div style={{ position: 'absolute', left: 36, top: 210, maxWidth: 800, background: C.panel, color: C.text, borderRadius: '20px 20px 20px 6px', padding: '22px 30px', fontSize: 38, opacity: seg(t, sendAt + 0.7, sendAt + 1.15) }}>{reply}</div>}
        <div style={{ position: 'absolute', left: 28, right: 28, bottom: 28, height: 108, borderRadius: 999, background: C.surface, border: `1px solid ${C.hair}`, display: 'flex', alignItems: 'center', padding: '0 14px 0 38px', boxSizing: 'border-box' }}>
          <span style={{ fontSize: 38, color: C.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {t < sendAt + 0.1 ? chars.slice(0, typed).join('') : ''}
            {t < sendAt && <span style={{ opacity: Math.sin(t * 7) > 0 ? 1 : 0.1, color: accent }}>|</span>}
            {t < typeStart && <span style={{ color: C.muted }}>输入提示词…</span>}
          </span>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: accent, color: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800, transform: `scale(${1 - 0.18 * press})`, boxShadow: press > 0.3 ? '0 0 44px rgba(200,162,74,0.55)' : 'none' }}>↑</div>
        </div>
      </div>
    </Stage>
  );
};
