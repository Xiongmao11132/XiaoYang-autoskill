// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/9db3f6625112/src/BatchC.tsx (X040)
// 用途：图片视频成片三步串联：三步载体卡逐个落位，箭头依次画出串成链，末卡落 accent 环（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangMediaChainProps = {
  steps: { label: string; src?: string }[];
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangMediaChain: React.FC<YangMediaChainProps> = ({
  steps, startSec = 0.3, gapSec = 0.6, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const three = steps.slice(0, 3);
  const cw = 470, ch = 330, gap = 130;
  const totalW = three.length * cw + (three.length - 1) * gap;
  const x0 = (1920 - totalW) / 2, y = 330;
  return (
    <Stage background={background}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {three.slice(0, -1).map((_, i) => {
          const at = startSec + (i + 1) * gapSec - 0.25;
          const draw = seg(t, at, at + 0.35);
          const x1 = x0 + (i + 1) * cw + i * gap, x2 = x1 + gap;
          return <line key={i} x1={x1 + 8} y1={y + ch / 2} x2={x1 + 8 + (x2 - x1 - 16) * draw} y2={y + ch / 2} stroke={accent} strokeWidth={6} strokeLinecap="round" />;
        })}
      </svg>
      {three.map((s, i) => {
        const at = startSec + i * gapSec;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 15, stiffness: 165 } });
        const last = i === three.length - 1;
        return (
          <div key={i} style={{ position: 'absolute', left: x0 + i * (cw + gap), top: y, width: cw, opacity: p, transform: `translateY(${(1 - p) * 56}px)` }}>
            <div style={{ width: cw, height: ch, borderRadius: 18, overflow: 'hidden', border: `${last ? 3 : 1}px solid ${last ? accent : C.hair}`, boxShadow: last ? '0 30px 80px rgba(0,0,0,0.5)' : 'none' }}>
              <MediaImg src={s.src} label={s.label} style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ width: 48, height: 48, borderRadius: '50%', background: last ? accent : C.panel, color: last ? C.dark : C.text, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800 }}>{i + 1}</span>
              <span style={{ fontSize: 38, color: C.text }}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </Stage>
  );
};
