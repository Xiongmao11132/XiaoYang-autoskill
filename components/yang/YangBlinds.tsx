/**
 * YangBlinds — 百叶黑条章节过渡（正版 T12p）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T12p-Blinds.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S; defaults neutralized.
 *
 * Mechanics: 4–8 black bars wipe in from the right, staggered top-to-bottom (wipe curve,
 * 0.5s each, 0.055s apart); every bar carries its own slice of the chapter text (number +
 * label + title), so the words assemble exactly as the bars complete the screen. With
 * `outAt` set, the bars later leave to the left in the same stagger, handing off to the
 * next segment.
 * Layout: 1920×1080 logical stage, scaled by host width (Frame).
 */
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  bg: '#fff', ink: '#19191c', dark: '#19191c', muted: '#83838a', faint: '#b9b9bf',
  accent: '#8554E8', accentDark: '#D6BEFF', radius: 28,
  capsuleShadow: '0 18px 36px 0 rgba(0,0,0,0.3)', shadow: '0 24px 40px 0 rgba(0,0,0,0.2)',
  windowBody: '#212123',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const q = (t: number, a: number, b: number) => easeInOut(clamp((t - a) / (b - a)));
const wipe = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
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

export type YangBlindsProps = YangHandoffProps & {
  index: number;
  label: string;
  title: string;
  bars: number;
  outAt?: number;
  cues?: number[];
};

export const yangBlindsDefaults: YangBlindsProps = {
  index: 5,
  label: '',
  title: '示例章节名',
  bars: 6,
};

const NUM = 240, LAB = 56;

export function YangBlinds(props: Partial<YangBlindsProps>) {
  const c = { ...yangBlindsDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.05);
  const n = Math.max(4, Math.min(8, Math.round(c.bars)));
  const bh = 1080 / n;
  const num = pad2(c.index), label = partLabel(c.index, c.label);

  const tSize = fit(c.title, 150, 1700 - textWidth(num, NUM) - 90);
  const numW = textWidth(num, NUM) * 1.04;
  const groupW = numW + 90 + textWidth(c.title, tSize);
  const gx = 960 - groupW / 2;
  const blockH = LAB * 1.16 + 20 + tSize * 1.12;

  const content = (
    <>
      <div style={{ ...textBase(NUM, 900), lineHeight: 1, position: 'absolute', left: gx, top: 540 - NUM * 0.5, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{num}</div>
      <div style={{ position: 'absolute', left: gx + numW + 90, top: 540 - blockH / 2 }}>
        <div style={{ ...textBase(LAB, 600), color: S.accentDark, letterSpacing: 4 }}>{label}</div>
        <div style={{ ...textBase(tSize, 400), lineHeight: 1.12, color: '#fff', marginTop: 20 }}>{c.title}</div>
      </div>
    </>
  );

  const barX = (i: number) => {
    const inn = wipe(t, at + i * 0.055, at + i * 0.055 + 0.5);
    const out = c.outAt !== undefined ? wipe(t, c.outAt + i * 0.05, c.outAt + i * 0.05 + 0.45) : 0;
    const x = (1 - inn) * 1980 - out * 1980;
    return Math.abs(x) < 1.5 ? 0 : x;
  };

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        {Array.from({ length: n }, (_, i) => {
          const x = barX(i);
          if (x >= 1920 || x <= -1920) return null;
          return (
            <div key={i} style={{ position: 'absolute', left: -2, top: i * bh, width: 1924, height: Math.ceil(bh) + 1, overflow: 'hidden', transform: `translateX(${x}px)`, background: S.dark }}>
              <div style={{ position: 'absolute', left: 2, top: -i * bh, width: 1920, height: 1080 }}>{content}</div>
            </div>
          );
        })}
      </Handoff>
    </Frame>
  );
}

export { mix };
