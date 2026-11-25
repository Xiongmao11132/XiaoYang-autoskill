// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/f1c33e46b21b/src/talk/talk-chat-message-flow.tsx (V072)
// 用途：聊天消息推进：对话窗内气泡逐条落入，对方消息先出打字点再成泡，画面随新消息上推（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangChatFlowProps = {
  messages: { from: 'me' | 'them'; text: string }[];
  title?: string;
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangChatFlow: React.FC<YangChatFlowProps> = ({
  messages, title = '对话', startSec = 0.3, gapSec = 0.62, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const winW = 780, winH = 880, winX = (1920 - winW) / 2, winY = (1080 - winH) / 2;
  const shownCount = messages.filter((_, i) => t > startSec + i * gapSec).length;
  const rowH = 118;
  const contentH = shownCount * rowH;
  const shift = Math.max(0, contentH - (winH - 190));
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: winX, top: winY, width: winW, height: winH, borderRadius: 30, background: '#0B0E12', border: `1px solid ${C.hair}`, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', opacity: seg(t, startSec, startSec + 0.3) }}>
        <div style={{ height: 92, background: C.surface, display: 'flex', alignItems: 'center', padding: '0 34px', fontSize: 36, color: C.text, fontWeight: 600 }}>{title}</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 92, bottom: 0, transform: `translateY(${-shift}px)` }}>
          {messages.map((m, i) => {
            const at = startSec + i * gapSec;
            const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 16, stiffness: 180 } });
            const typing = m.from === 'them' && t > at - 0.3 && t <= at;
            const me = m.from === 'me';
            return (
              <div key={i} style={{ height: rowH, display: 'flex', alignItems: 'center', justifyContent: me ? 'flex-end' : 'flex-start', padding: '0 30px', boxSizing: 'border-box' }}>
                {typing ? (
                  <div style={{ background: C.panel, borderRadius: '22px 22px 22px 6px', padding: '20px 26px', display: 'flex', gap: 8 }}>
                    {[0, 1, 2].map((d) => (<div key={d} style={{ width: 13, height: 13, borderRadius: '50%', background: C.text, opacity: 0.35 + 0.65 * Math.abs(Math.sin(t * 7 - d * 0.7)) }} />))}
                  </div>
                ) : (
                  <div style={{ maxWidth: 560, background: me ? accent : C.panel, color: me ? C.dark : C.text, borderRadius: me ? '22px 22px 6px 22px' : '22px 22px 22px 6px', padding: '20px 28px', fontSize: 38, opacity: p, transform: `translateY(${(1 - p) * 26}px) scale(${0.9 + 0.1 * p})` }}>{m.text}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
};
