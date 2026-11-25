// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/63e8a4c716d7/groups/b/src/RebuiltB002.tsx (L81-B002)
// 用途：黑色胶囊展开并强调关键词：黑胶囊自中心展开成形，句中关键词逐字点亮（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangCapsuleKeywordProps = {
  text: string;
  keyword: string;
  startSec?: number;
  accent?: string;
  background?: string;
  capsuleColor?: string;
  textColor?: string;
  fontSize?: number;
};

export const YangCapsuleKeyword: React.FC<YangCapsuleKeywordProps> = ({
  text, keyword, startSec = 0.3, accent = C.brass, background = C.base,
  capsuleColor = '#05070A', textColor = '#FFFFFF', fontSize = 64,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const open = spring({ frame, fps, delay: Math.round(startSec * fps), config: { damping: 16, stiffness: 130, mass: 0.9 } });
  const ki = text.indexOf(keyword);
  const chars = Array.from(text);
  const kwStart = ki < 0 ? chars.length : Array.from(text.slice(0, ki)).length;
  const kwLen = Array.from(keyword).length;
  const lightBase = startSec + 0.55;
  return (
    <Stage background={background}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) scaleX(${0.08 + 0.92 * open}) scaleY(${0.6 + 0.4 * open})`, opacity: open, background: capsuleColor, border: `1px solid ${C.hair}`, borderRadius: 999, padding: '44px 72px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize, color: textColor, letterSpacing: 1 }}>
          {chars.map((ch, i) => {
            const inKw = i >= kwStart && i < kwStart + kwLen;
            const lp = inKw ? seg(t, lightBase + (i - kwStart) * 0.07, lightBase + (i - kwStart) * 0.07 + 0.18) : 0;
            return (
              <span key={i} style={inKw ? { color: lp > 0.4 ? accent : textColor, background: `rgba(200,162,74,${0.28 * lp})`, borderRadius: 8, padding: '0 2px', transition: 'none' } : undefined}>
                {ch}
              </span>
            );
          })}
        </span>
      </div>
    </Stage>
  );
};
