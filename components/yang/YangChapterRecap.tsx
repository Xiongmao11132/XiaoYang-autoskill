// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T12g-ChapterRecap.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：章节回顾（正版 T12g）：一列章节名（2–10 章）竖排；一枚黑胶囊滑块从第一章往下扫，
// 扫过的章节被划掉、变灰，滑块停在当前章上把它点亮成黑胶囊白字（可带一个高亮词变紫）。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/quintic/springAt/textWidth 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；
// 默认章节已换中性示例。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  capsuleShadow: '30px 22px 25px #0005',
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

export type YangChapter = { title: string; hi?: string };
export type YangChapterRecapProps = YangHandoffProps & {
  chapters: YangChapter[];   // 2–10 章
  current: number;           // 当前章下标（滑块停在这里）
  cues?: number[];           // [0]=滑块开始下扫
};

export const yangChapterRecapDefaults: YangChapterRecapProps = {
  chapters: [
    { title: '先说清楚问题' },
    { title: '它怎么解决' },
    { title: '实际效果如何', hi: '实际效果' },
    { title: '适合谁用' },
  ],
  current: 2,
};

export const YangChapterRecap: React.FC<Partial<YangChapterRecapProps>> = (props) => {
  const c = { ...yangChapterRecapDefaults, ...props };
  const chapters = (c.chapters.length >= 2 ? c.chapters : yangChapterRecapDefaults.chapters).slice(0, 10);
  const n = chapters.length;
  const current = clamp(Math.round(c.current), 0, n - 1);
  const t = useT();
  const sweepAt = c.cues?.[0] ?? 0.5;

  const ROW = Math.min(118, 880 / n);
  const SIZE = Math.min(64, ROW * 0.52);
  const totalH = ROW * n;
  const Y0 = 540 - totalH / 2;
  const X = 300;
  const widths = chapters.map((ch) => textWidth(ch.title, SIZE));
  const maxW = Math.max(...widths);
  const PILL_H = SIZE * 1.72;
  const PILL_W = maxW + SIZE * 1.6 + 40;

  const sweep = quintic(t, sweepAt, sweepAt + 0.35 + current * 0.32);
  const sliderY = mix(Y0 + ROW / 2, Y0 + ROW * current + ROW / 2, sweep);
  const land = springAt(t, sweepAt + 0.35 + current * 0.32, 0.7);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: X - 30, top: sliderY - PILL_H / 2, width: PILL_W * clamp(sweep * 3), height: PILL_H,
        borderRadius: PILL_H / 2, background: S.dark, boxShadow: S.capsuleShadow, opacity: clamp(sweep * 3),
        transform: `scale(${mix(1, 1.04, land)})`, transformOrigin: '0 50%', zIndex: 1,
      }} />
      {chapters.map((ch, i) => {
        const y = Y0 + ROW * i + ROW / 2;
        const passed = sweep >= (current === 0 ? 2 : i / current) && i < current;
        const isCurrent = i === current && sweep >= 1;
        const appear = p(t, 0.1 + i * 0.07, 0.4 + i * 0.07);
        const strike = passed ? p(t, sweepAt + 0.35 + i * 0.32, sweepAt + 0.55 + i * 0.32) : 0;
        const baseColor = isCurrent ? '#fff' : passed ? S.faint : S.ink;
        const hiParts = ch.hi && ch.title.includes(ch.hi) ? ch.title.split(ch.hi) : null;
        return <div key={i} style={{
          position: 'absolute', left: X + SIZE * 0.8, top: y - SIZE * 0.58, height: SIZE * 1.16, zIndex: 2,
          display: 'flex', alignItems: 'center', opacity: appear, transform: `translateY(${(1 - appear) * 14}px)`,
        }}>
          <span style={{ ...textBase(SIZE, isCurrent ? 900 : 700), color: baseColor, position: 'relative' }}>
            {hiParts && isCurrent ? <>{hiParts[0]}<span style={{ color: S.accentDark }}>{ch.hi}</span>{hiParts[1]}</> : ch.title}
            {strike > 0 && <span style={{
              position: 'absolute', left: -6, top: '52%', width: `calc(${(textWidth(ch.title, SIZE) + 12)}px * ${strike})`, height: Math.max(4, SIZE * 0.07),
              background: S.faint, borderRadius: 4,
            }} />}
          </span>
        </div>;
      })}
    </Handoff>
  </Frame>;
};
