// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T19c-ReactionCard.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：反应卡（正版 T19c）：结果画面先占满；一个角色形象从右下角探进来，结果画面随之轻轻一震、
// 往左让出一点，一条评论胶囊从两者之间落下。三步小转场，情绪件。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/quintic/springAt 与 Frame/Handoff/Media 已内嵌移植，逻辑与原版一致；
// character 必须由宿主经 props 传入（透明底图/片段）——原包默认的形象资产未集成、绝不内置，
// 空串时渲染中性圆形占位剪影；media 与 comment 均走 props，默认文案为中性示例。
// 舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
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

export type YangReactionCardProps = YangHandoffProps & {
  media: string;        // 结果画面（宿主相对路径）；空串 = 中性骨架卡
  character: string;    // 角色形象（透明底图/片段，宿主传入）；空串 = 中性圆形占位剪影
  comment: string;      // 评论胶囊文案
  cues?: number[];      // [0]=角色探入；[1]=评论落下
};

export const yangReactionCardDefaults: YangReactionCardProps = {
  media: '',
  character: '',
  comment: '这结果有点意外',
};

const CARD = { x: 130, y: 110, w: 1660, h: 860 };
const CHAR = { w: 460, h: 560 };

export const YangReactionCard: React.FC<Partial<YangReactionCardProps>> = (props) => {
  const c = { ...yangReactionCardDefaults, ...props };
  const t = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const peekAt = c.cues?.[0] ?? 0.8;
  const dropAt = c.cues?.[1] ?? peekAt + 0.55;

  const appear = p(t, 0, 0.4);
  const peek = springAt(t, peekAt, 0.9);
  const jolt = Math.sin(clamp((t - peekAt) / 0.4) * Math.PI) * (t > peekAt && t < peekAt + 0.4 ? 1 : 0);
  const shiftX = -120 * quintic(t, peekAt, peekAt + 0.6);
  const drop = springAt(t, dropAt, 0.75);
  const size = 54;
  const pillW = textWidth(c.comment, size) + size * 1.6;
  const pillH = size * 1.72;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: CARD.x + shiftX, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: S.radius,
        overflow: 'hidden', boxShadow: S.shadow, background: '#fff', opacity: appear,
        transform: `rotate(${jolt * 0.7}deg) scale(${1 - 0.012 * jolt})`,
      }}>
        <Media src={c.media} startFrom={frame / fps} style={{ position: 'absolute', inset: 0, width: CARD.w, height: CARD.h }} />
      </div>

      <div style={{
        position: 'absolute', left: 1920 - CHAR.w + 60 - 240 * peek, top: 1080 - CHAR.h + 190 - 130 * peek,
        width: CHAR.w, height: CHAR.h, opacity: clamp(peek * 1.8), transform: `rotate(${mix(7, 0, peek)}deg)`, zIndex: 20,
      }}>
        {c.character
          ? <Media src={c.character} startFrom={frame / fps} style={{ position: 'absolute', inset: 0, width: CHAR.w, height: CHAR.h, objectFit: 'contain' }} />
          : <div style={{ position: 'absolute', left: CHAR.w / 2 - 130, top: 60, width: 260, height: 260, borderRadius: 130, background: '#c9c9d1' }}>
              <div style={{ position: 'absolute', left: 65, top: 96, width: 26, height: 26, borderRadius: 13, background: '#8a8a93' }} />
              <div style={{ position: 'absolute', right: 65, top: 96, width: 26, height: 26, borderRadius: 13, background: '#8a8a93' }} />
              <div style={{ position: 'absolute', left: 85, top: 165, width: 90, height: 14, borderRadius: 7, background: '#8a8a93' }} />
            </div>}
      </div>

      {drop > 0.02 && <div style={{
        position: 'absolute', left: clamp(1920 - CHAR.w - pillW - 40, 80, 1840 - pillW), top: 1080 - CHAR.h - pillH + 60 + (1 - clamp(drop)) * -160,
        width: pillW, height: pillH, borderRadius: pillH / 2, background: S.dark, boxShadow: S.capsuleShadow,
        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clamp(drop * 1.6), zIndex: 30,
        transform: `scale(${mix(0.85, 1, clamp(drop))})`,
      }}>
        <span style={{ ...textBase(size, 700), color: '#fff' }}>{c.comment}</span>
      </div>}
    </Handoff>
  </Frame>;
};
