// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T12c-CaseTurn.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：案例翻面进场（正版 T12c）：先只有一行总述在中央，讲到某个案例，它先缩小贴到案例卡左上角，
// 案例卡随即绕左边缘向里翻进来，案例名胶囊再从下方落到卡片左下角。三件只有两次运动。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/quintic/springAt/textWidth 与 Frame/Handoff/Media/Pill 已内嵌移植，逻辑与原版一致；
// media 走 props（宿主相对路径，Media 播放），原包默认的原版案例图已置空——空串时渲染中性骨架卡；
// 默认文案已换中性示例。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  radius: 24, capsuleShadow: '30px 22px 25px #0005', shadow: '0 16px 25px 0 rgba(0,0,0,0.1333)',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, v: number) => a + (b - a) * v;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const quintic = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * v * (v * (v * 6 - 15) + 10); };
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900): React.CSSProperties => ({
  fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
function Frame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const { width } = useVideoConfig();
  return <AbsoluteFill style={{
    background: dark ? S.dark : '#fff', overflow: 'hidden', fontFamily: FONT,
    fontWeight: 500, fontSynthesis: 'none', color: dark ? '#fff' : S.ink,
  }}>
    <div style={{ position: 'absolute', width: 1920, height: 1080, transform: `scale(${width / 1920})`, transformOrigin: '0 0', overflow: 'hidden' }}>
      {children}
    </div>
  </AbsoluteFill>;
}
export type YangEnter = 'cut' | 'fade' | 'rise' | 'grow';
export type YangExit = 'none' | 'recede' | 'fade' | 'cut' | 'slide-left' | 'slide-up';
export type YangHandoffProps = { enter?: YangEnter; exit?: YangExit; exitAt?: number };
function Handoff({ enter = 'cut', exit = 'none', enterAt = 0, enterDur = 0.45, exitAt, exitDur = 0.5, children }: {
  enter?: YangEnter; exit?: YangExit; enterAt?: number; enterDur?: number; exitAt?: number; exitDur?: number; children: React.ReactNode;
}) {
  const t = useT();
  const { durationInFrames, fps } = useVideoConfig();
  const at = exitAt ?? durationInFrames / fps - exitDur;
  const v = enter === 'cut' ? 1 : Math.max(0, Math.min(1, (t - enterAt) / enterDur));
  const e = 1 - Math.pow(1 - v, 3);
  const x = exit === 'none' ? 0 : exit === 'cut' ? (t >= at ? 1 : 0) : Math.max(0, Math.min(1, (t - at) / exitDur));
  const xs = x * x * (3 - 2 * x);
  let opacity = enter === 'cut' ? 1 : e;
  let transform = '';
  let filter = '';
  if (enter === 'rise') transform += `translateY(${(1 - e) * 40}px) `;
  if (enter === 'grow') transform += `scale(${mix(0.94, 1, e)}) `;
  if (exit === 'recede') { transform += `scale(${mix(1, 0.92, xs)}) `; filter = `blur(${xs * 14}px)`; opacity *= 1 - xs; }
  if (exit === 'fade' || exit === 'cut') opacity *= 1 - xs;
  if (exit === 'slide-left') transform += `translateX(${-xs * 1100}px) `;
  if (exit === 'slide-up') transform += `translateY(${-xs * 700}px) `;
  if (exit === 'slide-left' || exit === 'slide-up') opacity *= 1 - xs * 0.9;
  return <div style={{ position: 'absolute', inset: 0, opacity, transform: transform || undefined, filter: filter || undefined, transformOrigin: '960px 540px' }}>{children}</div>;
}
function Media({ src, style, startFrom = 0 }: { src: string; style?: React.CSSProperties; startFrom?: number }) {
  const { fps } = useVideoConfig();
  if (!src) {
    return <div style={{ background: 'linear-gradient(135deg,#e8e8ec,#cfcfd6)', ...style }}>
      <div style={{ position: 'absolute', left: '8%', top: '12%', width: '30%', height: '8%', borderRadius: 8, background: 'rgba(25,25,28,0.14)' }} />
      <div style={{ position: 'absolute', left: '8%', top: '24%', width: '48%', height: '5%', borderRadius: 6, background: 'rgba(25,25,28,0.09)' }} />
      <div style={{ position: 'absolute', right: '8%', bottom: '10%', width: '14%', height: '18%', borderRadius: 10, background: 'rgba(133,84,232,0.4)' }} />
    </div>;
  }
  const ext = src.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'].includes(ext);
  if (isImg) return <Img src={staticFile(src)} style={{ objectFit: 'cover', ...style }} />;
  return <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(startFrom * fps)} style={{ objectFit: 'cover', ...style }} />;
}
function Pill({ x, y, size = 46, weight = 900, dark = true, shadow = true, children, style }: {
  x: number; y: number; size?: number; weight?: number; dark?: boolean; shadow?: boolean; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return <div style={{
    position: 'absolute', left: x, top: y, height: size * 1.72, padding: `0 ${size * 0.72}px`, borderRadius: size,
    background: dark ? S.dark : '#fff', color: dark ? '#fff' : S.ink, boxShadow: shadow ? (dark ? S.capsuleShadow : S.shadow) : undefined,
    display: 'flex', alignItems: 'center', ...textBase(size, weight), ...style,
  }}>{children}</div>;
}

export type YangCaseTurnProps = YangHandoffProps & {
  lead: React.ReactNode;                // 先念的那句总述（可传 JSX，含高亮段）
  title: React.ReactNode;               // 案例标题（卡片底部胶囊）
  media: string;                        // 案例图/片段（宿主相对路径）；空串 = 中性骨架卡
  cues?: number[];                      // [0]=lead 缩小贴角、卡开始翻入；[1]=title 落下
};

export const yangCaseTurnDefaults: YangCaseTurnProps = {
  lead: <>举个<b style={{ color: S.accent }}>最典型的例子</b></>,
  title: '某个真实案例',
  media: '',
};

type LeadPart = { text: string; accent?: boolean };
const plainText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(plainText).join('');
  if (React.isValidElement(node)) return plainText((node.props as { children?: React.ReactNode }).children);
  return '';
};

export const YangCaseTurn: React.FC<Partial<YangCaseTurnProps>> = (props) => {
  const c = { ...yangCaseTurnDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useT();
  const turnAt = c.cues?.[0] ?? 0.85;
  const titleAt = c.cues?.[1] ?? turnAt + 1.05;

  const CARD = { x: 250, y: 150, w: 1420, h: 830 };
  const leadText = plainText(c.lead);
  const BIG = 118, SMALL = 62;
  const bigW = textWidth(leadText, BIG) + BIG * 1.5;
  const smallW = textWidth(leadText, SMALL) + SMALL * 1.5;
  const dock = springAt(t, turnAt, 1.0);
  const pillX = mix(960 - bigW / 2, CARD.x + 36, dock);
  const pillY = mix(540 - (BIG * 1.72) / 2, CARD.y + 36, dock);

  const flip = quintic(t, turnAt + 0.28, turnAt + 1.35);
  const title = p(t, titleAt, titleAt + 0.45);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, perspective: 1900 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: S.radius, overflow: 'hidden', background: '#fff', boxShadow: S.shadow,
          transform: `rotateY(${mix(-71, 0, flip)}deg)`, transformOrigin: '0% 50%', opacity: clamp(flip * 2.2),
        }}>
          <Media src={c.media} startFrom={frame / fps} style={{ position: 'absolute', inset: 0, width: CARD.w, height: CARD.h }} />
          <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: (1 - flip) * 0.22 }} />
        </div>
      </div>

      <div style={{ position: 'absolute', left: pillX, top: pillY, zIndex: 20 }}>
        <div style={{
          height: mix(BIG, SMALL, dock) * 1.72, padding: `0 ${mix(BIG, SMALL, dock) * 0.75}px`, borderRadius: mix(BIG, SMALL, dock),
          background: S.dark, color: '#fff', boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', overflow: 'hidden',
          width: mix(bigW, smallW, dock),
        }}>
          <span style={{ ...textBase(mix(BIG, SMALL, dock), 900) }}>{c.lead}</span>
        </div>
      </div>

      {title > 0 && <Pill x={CARD.x + 36} y={CARD.y + CARD.h - 46 * 1.72 - 36} size={46} style={{ opacity: title, transform: `translateY(${(1 - title) * 26}px)`, zIndex: 20 }}>
        {c.title}
      </Pill>}
    </Handoff>
  </Frame>;
};
