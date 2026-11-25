/**
 * YangDeckPull — 卡叠抽走章节过渡（正版 T12n）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T12n-DeckPull.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S; defaults neutralized.
 *
 * Mechanics: a stack of black chapter cards settles in from below (0.06s stagger, each
 * lower card offset right-down and slightly smaller; `depth` blank cards pad the bottom).
 * The top card — the previous chapter — is pulled out diagonally up-left with a 9°
 * rotation and fades; the card beneath (this chapter: big number, part label, title)
 * rises into its exact place on the same progress.
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
const CN = '一二三四五六七八九十';
const cnNum = (n: number) => (n <= 10 ? CN[n - 1] : n < 20 ? `十${CN[n - 11]}` : n < 100 ? `${CN[Math.floor(n / 10) - 1]}十${n % 10 ? CN[n % 10 - 1] : ''}` : String(n));
const partLabel = (index: number, label = '') => label || `第${index >= 1 ? cnNum(index) : index}部分`;
const pad2 = (n: number) => String(Math.max(0, Math.round(n))).padStart(2, '0');
const fit = (s: string, max: number, avail: number) => Math.min(max, avail / Math.max(1, textWidth(s, 1)));
function splitTitle(title: string, maxUnits: number): string[] {
  if (textWidth(title, 1) <= maxUnits) return [title];
  const chars = Array.from(title);
  const half = textWidth(title, 1) / 2;
  let best = Math.floor(chars.length / 2), bestScore = Infinity, acc = 0;
  for (let i = 1; i < chars.length; i++) {
    acc += textWidth(chars[i - 1], 1);
    const prev = chars[i - 1];
    const brk = /[，,、：:；; ]/.test(prev) ? -3 : /[的和与]/.test(prev) ? -1.5 : 0;
    const score = Math.abs(acc - half) + brk;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return [chars.slice(0, best).join('').trim(), chars.slice(best).join('').trim()];
}

export type YangDeckPullProps = YangHandoffProps & {
  index: number;
  prevTitle: string;
  title: string;
  label: string;
  depth: number;
  cues?: number[];
};

export const yangDeckPullDefaults: YangDeckPullProps = {
  index: 2,
  prevTitle: '上一章示例',
  title: '示例章节名',
  label: '',
  depth: 2,
};

const W = 1380, H = 620, NUM = 280, LAB = 54;

function Card({ index, label, title }: { index: number; label: string; title: string }) {
  const lines = splitTitle(title, 760 / 120);
  const size = Math.min(140, ...lines.map((l) => fit(l, 140, 760)));
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 110, gap: 80 }}>
      <span style={{ ...textBase(NUM, 900), lineHeight: 1, color: '#fff', fontVariantNumeric: 'tabular-nums', width: textWidth('00', NUM) * 1.04 }}>{pad2(index)}</span>
      <div>
        <div style={{ ...textBase(LAB, 600), color: S.accentDark, letterSpacing: 4, marginBottom: 18 }}>{label}</div>
        {lines.map((l, i) => <div key={i} style={{ ...textBase(size, 400), lineHeight: 1.1, color: '#fff' }}>{l}</div>)}
      </div>
    </div>
  );
}

export function YangDeckPull(props: Partial<YangDeckPullProps>) {
  const c = { ...yangDeckPullDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.72);
  const depth = Math.max(1, Math.min(3, Math.round(c.depth)));

  const settleIn = (k: number) => p(t, 0.04 * k, 0.42 + 0.04 * k);
  const pull = q(t, at, at + 0.52);
  const rise = p(t, at + 0.1, at + 0.62);

  const slot = (k: number) => ({ x: k * 34, y: k * 30, s: 1 - k * 0.035 });
  const x0 = 960 - W / 2, y0 = 540 - H / 2 - 30;

  const cards = [];
  for (let k = depth + 1; k >= 0; k--) {
    const into = settleIn(depth + 1 - k);
    const sl = k === 0 ? slot(0) : k === 1 ? { x: mix(slot(1).x, 0, rise), y: mix(slot(1).y, 0, rise), s: mix(slot(1).s, 1, rise) }
      : { x: mix(slot(k).x, slot(k - 1).x, rise), y: mix(slot(k).y, slot(k - 1).y, rise), s: mix(slot(k).s, slot(k - 1).s, rise) };
    let extra = '';
    let op = 1;
    if (k === 0) {
      extra = `translate(${-pull * 980}px, ${-pull * 900}px) rotate(${-pull * 9}deg)`;
      op = 1 - q(t, at + 0.36, at + 0.52);
      if (op <= 0.001) continue;
    }
    const body = k === 0 ? <Card index={c.index - 1} label={partLabel(c.index - 1)} title={c.prevTitle} />
      : k === 1 ? <Card index={c.index} label={partLabel(c.index, c.label)} title={c.title} /> : null;
    cards.push(
      <div key={k} style={{
        position: 'absolute', left: x0 + sl.x, top: y0 + sl.y, width: W, height: H, borderRadius: 36, background: k <= 1 ? S.dark : S.windowBody,
        boxShadow: S.capsuleShadow, overflow: 'hidden', transformOrigin: '50% 50%',
        opacity: op, transform: `${extra} translateY(${(1 - into) * 160}px) scale(${sl.s})`,
      }}>{body}</div>,
    );
  }

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{ position: 'absolute', inset: 0, opacity: p(t, 0, 0.2) }}>{cards}</div>
      </Handoff>
    </Frame>
  );
}
