// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/0924c67d9d78/src/Comparison.tsx (E14)
// 用途：多组图片对比、局部特写与完整提示词：对比组逐组建立，每组前后图并置、后图带局部放大镜、组下注脚完整落出（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangCompareGroupsProps = {
  groups: { label: string; before?: string; after?: string; note?: string }[];
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangCompareGroups: React.FC<YangCompareGroupsProps> = ({
  groups, startSec = 0.3, gapSec = 0.9, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const gw = 800, gh = 400, colGap = 60;
  const totalW = groups.length * gw + (groups.length - 1) * colGap;
  const x0 = (1920 - totalW) / 2, y = 240;
  return (
    <Stage background={background}>
      {groups.map((g, gi) => {
        const at = startSec + gi * gapSec;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 16, stiffness: 155 } });
        const zoomP = seg(t, at + 0.55, at + 0.95);
        const x = x0 + gi * (gw + colGap);
        return (
          <div key={gi} style={{ position: 'absolute', left: x, top: y, width: gw, opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
            <div style={{ fontSize: 40, color: C.text, fontWeight: 600, marginBottom: 22 }}>{g.label}</div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ width: (gw - 24) / 2, height: gh, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.hair}`, position: 'relative' }}>
                <MediaImg src={g.before} label="对比前" style={{ width: '100%', height: '100%' }} />
                <span style={{ position: 'absolute', left: 16, top: 14, background: 'rgba(5,7,10,0.75)', color: '#fff', borderRadius: 999, padding: '6px 20px', fontSize: 28 }}>前</span>
              </div>
              <div style={{ width: (gw - 24) / 2, height: gh, borderRadius: 16, overflow: 'hidden', border: `2px solid ${accent}`, position: 'relative' }}>
                <MediaImg src={g.after} label="对比后" style={{ width: '100%', height: '100%' }} />
                <span style={{ position: 'absolute', left: 16, top: 14, background: accent, color: C.dark, borderRadius: 999, padding: '6px 20px', fontSize: 28, fontWeight: 700 }}>后</span>
                <div style={{ position: 'absolute', right: 18, bottom: 18, width: 150, height: 150, borderRadius: '50%', border: `3px solid ${accent}`, overflow: 'hidden', opacity: zoomP, transform: `scale(${0.6 + 0.4 * zoomP})`, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
                  {g.after ? <Img src={srcOf(g.after)} style={{ width: '220%', height: '220%', objectFit: 'cover', transform: 'translate(-30%,-30%)' }} /> : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#2A3340,#171C23)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 24 }}>特写</div>}
                </div>
              </div>
            </div>
            {g.note && <div style={{ marginTop: 24, fontSize: 34, color: C.muted, lineHeight: 1.4, opacity: seg(t, at + 0.4, at + 0.8) }}>{g.note}</div>}
          </div>
        );
      })}
    </Stage>
  );
};
