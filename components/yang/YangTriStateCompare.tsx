// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/344dbac0fb0f/src/RebuiltBTypeFailure.tsx (L81-B074)
// 用途：失败现象用三种图片状态对比：同题三态画面依次落位，状态签逐个点亮、箭头串起演变（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangTriStateCompareProps = {
  media: string[];
  labels: string[];
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangTriStateCompare: React.FC<YangTriStateCompareProps> = ({
  media, labels, startSec = 0.3, gapSec = 0.55, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const three = media.slice(0, 3);
  const pw = 520, ph = 560, gap = 90;
  const totalW = three.length * pw + (three.length - 1) * gap;
  const x0 = (1920 - totalW) / 2, y = 220;
  return (
    <Stage background={background}>
      {three.map((m, i) => {
        const at = startSec + i * gapSec;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 15, stiffness: 160 } });
        return (
          <div key={i} style={{ position: 'absolute', left: x0 + i * (pw + gap), top: y, width: pw, opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
            <div style={{ width: pw, height: ph, borderRadius: 18, overflow: 'hidden', border: `2px solid ${i === three.length - 1 ? accent : C.hair}` }}>
              <MediaImg src={m || undefined} label={labels[i] ?? `状态 ${i + 1}`} style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
              <span style={{ background: i === three.length - 1 ? accent : C.panel, color: i === three.length - 1 ? C.dark : C.text, borderRadius: 999, padding: '12px 34px', fontSize: 36, fontWeight: 600 }}>{labels[i] ?? `状态 ${i + 1}`}</span>
            </div>
          </div>
        );
      })}
      {[0, 1].map((i) => {
        const at = startSec + (i + 1) * gapSec - 0.2;
        return <div key={i} style={{ position: 'absolute', left: x0 + pw + i * (pw + gap) + 14, top: y + ph / 2 - 30, fontSize: 56, color: accent, opacity: seg(t, at, at + 0.3) }}>→</div>;
      })}
    </Stage>
  );
};
