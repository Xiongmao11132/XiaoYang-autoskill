// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/9db3f6625112/src/BatchB.tsx (N011)
// 用途：单条影片带叠出三行反向流动的作品墙：一行胶片带先亮相，随后叠成三行、相邻行反向持续流动（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangFilmRowsProps = {
  media: string[];
  startSec?: number;
  rowsAtSec?: number;
  speedPxPerSec?: number;
  accent?: string;
  background?: string;
};

export const YangFilmRows: React.FC<YangFilmRowsProps> = ({
  media, startSec = 0.3, rowsAtSec = 1.1, speedPxPerSec = 70, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cardW = 430, cardH = 250, gapX = 24;
  const rowH = cardH + 56;
  const rp = seg(t, rowsAtSec, rowsAtSec + 0.6);
  const list = media.length ? [...media, ...media, ...media] : ['', '', '', '', '', ''];
  const loopW = Math.max(1, media.length) * (cardW + gapX);
  const row = (r: number) => {
    const dir = r % 2 === 0 ? 1 : -1;
    const y = 540 + (r - 1) * rowH * rp - cardH / 2;
    const off = ((t * speedPxPerSec * dir) % loopW + loopW) % loopW;
    return (
      <div key={r} style={{ position: 'absolute', left: 0, top: y, width: 1920, height: cardH + 36, opacity: r === 1 ? 1 : rp, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: gapX, transform: `translateX(${dir > 0 ? off - loopW : -off}px)`, width: 'max-content' }}>
          {list.map((m, i) => (
            <div key={i} style={{ width: cardW, height: cardH, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.hair}`, flexShrink: 0, position: 'relative' }}>
              <MediaImg src={m || undefined} label={`片段 ${(i % Math.max(1, media.length)) + 1}`} style={{ width: '100%', height: '100%' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: 6, display: 'flex', justifyContent: 'space-around' }}>{Array.from({ length: 8 }).map((_, j) => (<div key={j} style={{ width: 16, height: 9, borderRadius: 3, background: 'rgba(236,232,223,0.5)' }} />))}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <Stage background={background}>
      <div style={{ opacity: seg(t, startSec, startSec + 0.4) }}>{[0, 1, 2].map(row)}</div>
    </Stage>
  );
};
