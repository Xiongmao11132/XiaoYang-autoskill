/**
 * YangPillCarousel — 胶囊轮播章节过渡（正版 T12r）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T12r-PillCarousel.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S; defaults neutralized.
 *
 * Mechanics: all of the episode's chapters sit in one row of black capsules, the previous
 * chapter centered. The row slides left by exactly one capsule (quintic, zero end
 * velocity); the incoming chapter stops at center and scales up ×1.5 with its number in
 * light purple while neighbours shrink and dim — the audience sees what came before and
 * what is still ahead.
 * Layout: 1920×1080 logical stage, scaled by host width (Frame).
 */
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  bg: '#fff', ink: '#19191c', dark: '#19191c', muted: '#83838a', faint: '#b9b9bf',
  accent: '#8554E8', accentDark: '#D6BEFF', radius: 28,
  capsuleShadow: '0 18px 36px 0 rgba(0,0,0,0.3)', shadow: '0 24px 40px 0 rgba(0,0,0,0.2)',
  windowBody: '#212123',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const p = (t: number, a: number, b: number) => easeOut(clamp((t - a) / (b - a)));
const q = (t: number, a: number, b: number) => easeInOut(clamp((t - a) / (b - a)));
const quintic = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * v * (v * (6 * v - 15) + 10); };
const cueAt = (cues: number[] | undefined, i: number, fb: number) => (cues && cues[i] !== undefined ? cues[i] : fb);
const isW = (ch: string) => /[一-鿿＀-￯]/.test(ch);
function textWidth(text: string, size: number) { let w = 0; for (const ch of text) w += isW(ch) ? 0.94 : 0.56; return w * size; }
const textBase = (size: number, weight = 500): React.CSSProperties => ({
  fontFamily: FONT, fontSize: size, fontWeight: weight, lineHeight: 1.16, letterSpacing: 0, whiteSpace: 'nowrap',
});
function useT() { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return f / fps; }
function Frame({ children }: { children: React.ReactNode }) {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: S.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${width / 1920})`, transformOrigin: '0 0' }}>
        {children}
      </div>
    </AbsoluteFill>
  );
}
export type YangHandoffProps = { enter?: number; exit?: number; exitAt?: number };
function Handoff({ enter = 0, exit = 0, exitAt = 0, children }: YangHandoffProps & { children: React.ReactNode }) {
  const t = useT();
  const k = enter > 0 ? q(t, 0, enter) : 1;
  const out = exit > 0 ? q(t, exitAt, exitAt + exit) : 0;
  const ty = (1 - k) * 46 - out * 46;
  const blur = (1 - k) * 8 + out * 8;
  return <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, k * 1.6) * (1 - out), transform: `translateY(${ty}px)`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>{children}</div>;
}
const pad2 = (n: number) => String(Math.max(0, Math.round(n))).padStart(2, '0');

export type YangPillCarouselProps = YangHandoffProps & {
  titles: string[];
  index: number;
  cues?: number[];
};

export const yangPillCarouselDefaults: YangPillCarouselProps = {
  titles: ['第一章示例', '第二章示例', '第三章示例', '第四章示例', '第五章示例'],
  index: 3,
};

const H = 150, FS = 72, NS = 60, GAP = 60, FOCUS = 1.5;

export function YangPillCarousel(props: Partial<YangPillCarouselProps>) {
  const c = { ...yangPillCarouselDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.6);
  const n = c.titles.length;
  const cur = Math.max(1, Math.min(n, c.index)) - 1;
  const prev = Math.max(0, cur - 1);

  const fs = c.titles.map((s) => Math.min(FS, 900 / Math.max(1, textWidth(s, 1))));
  const ws = c.titles.map((s, i) => H * 0.9 + textWidth(pad2(i + 1), NS) + 28 + textWidth(s, fs[i]));

  const enter = p(t, 0, 0.45);
  const slide = quintic(t, at, at + 0.75);
  const focusIdx = mix(prev, cur, slide);
  const scale = c.titles.map((_, i) => mix(0.82, FOCUS, clamp(1 - Math.abs(i - focusIdx))));
  const cx: number[] = [];
  let acc = 0;
  ws.forEach((w, i) => { cx.push(acc + (w * scale[i]) / 2); acc += w * scale[i] + GAP; });
  const lo = Math.floor(focusIdx), hi = Math.min(n - 1, lo + 1);
  const rowFocus = mix(cx[lo], cx[hi], focusIdx - lo);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        {c.titles.map((s, i) => {
          const k = clamp(1 - Math.abs(i - focusIdx));
          const sc = scale[i];
          const x = 960 + (cx[i] - rowFocus);
          const isCur = i === cur;
          const op = enter * mix(0.32, 1, k);
          return (
            <div key={i} style={{
              position: 'absolute', left: x - ws[i] / 2, top: 540 - H / 2, width: ws[i], height: H, borderRadius: H / 2,
              background: S.dark, boxShadow: S.capsuleShadow, opacity: op,
              transform: `translateY(${(1 - enter) * 50}px) scale(${sc})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28,
            }}>
              <span style={{ ...textBase(NS, 900), color: isCur ? S.accentDark : S.faint, fontVariantNumeric: 'tabular-nums' }}>{pad2(i + 1)}</span>
              <span style={{ ...textBase(fs[i], 400), color: '#fff' }}>{s}</span>
            </div>
          );
        })}
      </Handoff>
    </Frame>
  );
}
