// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T11c-FourClips.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：多片段分屏（正版 T11c）：2 个片段并排成立，前两个先安稳站住，讲究的是后面几个——
// 第三个从下方滑入、第四个从侧面滑入，位置早就留好了；每段可带一枚底部小胶囊说明。2–6 段自动排版
// （一排 / 两列 / 三列），不硬凑间隔动画。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/quintic/textWidth 与 Frame/Handoff/Media/Surface 已内嵌移植，逻辑与原版一致；
// clips 走 props（宿主相对路径，Media 播放），原包默认的原版片段已置空——空串时渲染中性骨架卡。
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
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900): React.CSSProperties => ({
  fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
type Box = { x: number; y: number; w: number; h: number };
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
      <div style={{ position: 'absolute', left: '10%', top: '14%', width: '34%', height: '9%', borderRadius: 8, background: 'rgba(25,25,28,0.14)' }} />
      <div style={{ position: 'absolute', left: '10%', top: '28%', width: '52%', height: '6%', borderRadius: 6, background: 'rgba(25,25,28,0.09)' }} />
      <div style={{ position: 'absolute', right: '10%', bottom: '12%', width: '16%', height: '16%', borderRadius: 10, background: 'rgba(133,84,232,0.4)' }} />
    </div>;
  }
  const ext = src.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'].includes(ext);
  if (isImg) return <Img src={staticFile(src)} style={{ objectFit: 'cover', ...style }} />;
  return <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(startFrom * fps)} style={{ objectFit: 'cover', ...style }} />;
}
function Surface({ style, children }: { style: React.CSSProperties & Box; children?: React.ReactNode }) {
  const { x, y, w, h } = style;
  return <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: S.radius, background: '#fff', boxShadow: S.shadow, overflow: 'hidden' }}>{children}</div>;
}

export type YangFourClipsProps = YangHandoffProps & {
  clips: { src: string; caption?: string }[];  // 2–6 段；src 空串 = 中性骨架卡
  startAt?: number[];                          // 每段片段从第几秒开始播
};

export const yangFourClipsDefaults: YangFourClipsProps = {
  clips: [{ src: '', caption: '第一步' }, { src: '', caption: '第二步' }, { src: '', caption: '第三步' }, { src: '', caption: '第四步' }],
};

export const YangFourClips: React.FC<Partial<YangFourClipsProps>> = (props) => {
  const c = { ...yangFourClipsDefaults, ...props };
  const clips = (c.clips.length >= 2 ? c.clips : yangFourClipsDefaults.clips).slice(0, 6);
  const t = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = clips.length;
  const cols = n <= 2 ? n : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const GAP = 34;
  const AW = 1700, AH = 880;
  const cw = (AW - GAP * (cols - 1)) / cols;
  const ch = (AH - GAP * (rows - 1)) / rows;
  const X0 = 960 - AW / 2, Y0 = 540 - AH / 2;
  const cells: Box[] = clips.map((_, i) => {
    const r = Math.floor(i / cols), col = i % cols;
    const inRow = Math.min(cols, n - r * cols);
    const rowW = cw * inRow + GAP * (inRow - 1);
    return { x: 960 - rowW / 2 + col * (cw + GAP), y: Y0 + r * (ch + GAP), w: cw, h: ch };
  });

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {clips.map((clip, i) => {
        const b = cells[i];
        const at = i < 2 ? 0.15 + i * 0.12 : 0.75 + (i - 2) * 0.3;
        const v = quintic(t, at, at + 0.55);
        const fromX = i < 2 ? 0 : (i % cols === cols - 1 ? (b.w + GAP) * 0.9 : 0);
        const fromY = i < 2 ? 0 : (i % cols !== cols - 1 ? (b.h + GAP) * 0.9 : 0);
        const x = b.x + fromX * (1 - v), y = b.y + fromY * (1 - v) + (i < 2 ? (1 - v) * 30 : 0);
        const scale = i < 2 ? mix(0.94, 1, v) : 1;
        const cap = p(t, at + 0.4, at + 0.7);
        const capSize = 40;
        const capW = clip.caption ? textWidth(clip.caption, capSize) + 72 : 0;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: b.w, height: b.h, opacity: clamp(v * 1.4), transform: `scale(${scale})`, transformOrigin: '50% 50%' }}>
          <Surface style={{ x: 0, y: 0, w: b.w, h: b.h }}>
            <Media src={clip.src} startFrom={(c.startAt?.[i] ?? 0) + frame / fps} style={{ position: 'absolute', inset: 0, width: b.w, height: b.h }} />
          </Surface>
          {clip.caption && cap > 0 && <div style={{
            position: 'absolute', left: (b.w - capW) / 2, bottom: 26, width: capW, height: capSize * 1.72, borderRadius: capSize,
            background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: cap, transform: `translateY(${(1 - cap) * 12}px)`,
          }}>
            <span style={{ ...textBase(capSize, 700), color: '#fff' }}>{clip.caption}</span>
          </div>}
        </div>;
      })}
    </Handoff>
  </Frame>;
};
