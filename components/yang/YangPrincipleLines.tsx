// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T01c-PrincipleLines.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：原则口诀（正版 T01c）：每句原则装在一枚黑胶囊里，从右侧滑入、撞到同一条左边界停住（轻微回弹）；
// 全部到齐后整组「锁定」：胶囊收拢、补齐成同一宽度，每句的关键词同时点紫。
// 与近名件区别：YangPhaseCapsules（正版 T12d）是阶段胶囊建立后聚焦一枚；YangConditionCapsule（正版 T01e）是单枚胶囊补条件；
// 本件是「逐句撞齐左边界 → 整组收拢成等宽口诀块」，不是重复集成。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/springAt/cueAt/textWidth 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；
// 原包默认示例已换中性示例。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
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
const q = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * (3 - 2 * v); };
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
const cueAt = (cues: readonly number[] | undefined, i: number, fb: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fb;
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

export type YangPrincipleLinesProps = YangHandoffProps & {
  lines: string[];        // 2–4 句原则
  highlights: string[];   // 每句里染紫的词（深底 #D6BEFF），与 lines 一一对应，可留空
  cues?: number[];        // [0..n-1]=第 i 句滑入，[n]=整组锁定
};

export const yangPrincipleLinesDefaults: YangPrincipleLinesProps = {
  lines: ['先说结论，再讲原因', '一次只讲一件事', '数字要带出处'],
  highlights: ['结论', '一件事', '出处'],
};

export const YangPrincipleLines: React.FC<Partial<YangPrincipleLinesProps>> = (props) => {
  const c = { ...yangPrincipleLinesDefaults, ...props };
  const t = useT();
  const lines = c.lines.slice(0, 4);
  const n = Math.max(1, lines.length);

  const maxUnits = Math.max(1, ...lines.map((l) => textWidth(l, 1)));
  const size = Math.min(150, 1380 / maxUnits, 800 / (n * 1.78 + (n - 1) * 0.3));
  const pillH = size * 1.78;
  const padL = size * 0.62, padR = size * 0.72;
  const gap0 = size * 0.34, gap1 = size * 0.16;
  const widths = lines.map((l) => textWidth(l, size) + padL + padR);
  const maxW = Math.max(...widths);
  const left = 960 - maxW / 2;

  const at = lines.map((_, i) => cueAt(c.cues, i, 0.12 + i * 0.8));
  const lockAt = cueAt(c.cues, n, at[n - 1] + 0.85);
  const lock = q(t, lockAt, lockAt + 0.4);
  const lockColor = p(t, lockAt + 0.1, lockAt + 0.45);
  const gap = mix(gap0, gap1, lock);
  const totalH = n * pillH + (n - 1) * gap;
  const top = 540 - totalH / 2 + 10;

  const accent = (k: number) => `rgb(${Math.round(mix(255, 0xd6, k))}, ${Math.round(mix(255, 0xbe, k))}, ${Math.round(mix(255, 0xff, k))})`;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {lines.map((l, i) => {
        const s = springAt(t, at[i], 0.62);
        const vis = clamp((t - at[i]) / 0.12);
        if (vis <= 0) return null;
        const x = left + (1 - s) * 760;
        const w = mix(widths[i], maxW, lock);
        const y = top + i * (pillH + gap);
        const hl = c.highlights[i] ?? '';
        const k = hl ? l.indexOf(hl) : -1;
        return <div key={i} style={{
          position: 'absolute', left: x, top: y, width: w, height: pillH, borderRadius: pillH / 2,
          background: S.dark, boxShadow: S.capsuleShadow, opacity: vis, display: 'flex', alignItems: 'center',
        }}>
          <span style={{ ...textBase(size, 400), color: '#fff', marginLeft: padL }}>
            {k < 0 ? l : <>{l.slice(0, k)}<span style={{ color: accent(lockColor) }}>{hl}</span>{l.slice(k + hl.length)}</>}
          </span>
        </div>;
      })}
    </Handoff>
  </Frame>;
};
