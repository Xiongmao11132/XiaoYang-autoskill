// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/0c0cc0dd7ce6/src/RebuiltBRepresentatives.tsx (L81-B019)
// 用途：三张图片卡转为能力分类：图片卡并列亮相后逐张翻面，变成分类标签卡落位（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangCardsToCategoriesProps = {
  media: string[];
  categories: string[];
  startSec?: number;
  gapSec?: number;
  morphAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangCardsToCategories: React.FC<YangCardsToCategoriesProps> = ({
  media, categories, startSec = 0.3, gapSec = 0.22, morphAtSec = 1.7, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const three = media.slice(0, 3);
  const cw = 480, ch = 560, gap = 46;
  const totalW = three.length * cw + (three.length - 1) * gap;
  const x0 = (1920 - totalW) / 2, y = (1080 - ch) / 2;
  return (
    <Stage background={background}>
      {three.map((m, i) => {
        const at = startSec + i * gapSec;
        const p = spring({ frame, fps, delay: Math.round(at * fps), config: { damping: 16, stiffness: 160 } });
        const flip = seg(t, morphAtSec + i * 0.16, morphAtSec + i * 0.16 + 0.45);
        const rotY = flip * 180;
        const showBack = flip > 0.5;
        return (
          <div key={i} style={{ position: 'absolute', left: x0 + i * (cw + gap), top: y, width: cw, height: ch, opacity: p, transform: `translateY(${(1 - p) * 60}px)`, perspective: 1200 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', border: `1px solid ${showBack ? accent : C.hair}`, transform: `rotateY(${rotY}deg)`, background: showBack ? C.surface : undefined, display: showBack ? 'flex' : undefined, alignItems: 'center', justifyContent: 'center' }}>
              {showBack ? (
                <div style={{ transform: 'rotateY(180deg)', textAlign: 'center', padding: '0 40px' }}>
                  <div style={{ fontSize: 30, color: accent, fontWeight: 700, letterSpacing: 3 }}>分类</div>
                  <div style={{ fontSize: 58, color: C.text, fontWeight: 700, marginTop: 16 }}>{categories[i] ?? ''}</div>
                </div>
              ) : (
                <MediaImg src={m || undefined} label={`图片 ${i + 1}`} style={{ width: '100%', height: '100%' }} />
              )}
            </div>
          </div>
        );
      })}
    </Stage>
  );
};
