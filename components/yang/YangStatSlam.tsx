/**
 * YangStatSlam — 数字狂跳开场（正版 T20o）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T20o-StatSlam.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S; defaults neutralized.
 *
 * Mechanics: one huge real number races from 0 to the target value (fast at first,
 * easing out to land exactly; the digit box is sized to the final value and right-aligned
 * so the string never jitters sideways). A caption fades in under it saying what the
 * number is; then the number group shrinks to 0.62 and moves up, keeping context, while
 * the episode's title capsule lands below.
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
const fit = (s: string, max: number, avail: number) => Math.min(max, avail / Math.max(1, textWidth(s, 1)));
function splitHighlight(text: string, hl: string): [string, string, string] {
  const i = hl ? text.indexOf(hl) : -1;
  if (i < 0) return [text, '', ''];
  return [text.slice(0, i), hl, text.slice(i + hl.length)];
}

export type YangStatSlamProps = YangHandoffProps & {
  value: number;
  decimals: number;
  unit: string;
  caption: string;
  title: string;
  highlight: string;
  cues?: number[];
};

export const yangStatSlamDefaults: YangStatSlamProps = {
  value: 50500,
  decimals: 0,
  unit: '',
  caption: '一个用来示意的数字',
  title: '本期主题在这里',
  highlight: '主题',
};

const fmt = (v: number, d: number) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export function YangStatSlam(props: Partial<YangStatSlamProps>) {
  const c = { ...yangStatSlamDefaults, ...props };
  const t = useT();
  const landAt = cueAt(c.cues, 0, 1.25);
  const titleAt = cueAt(c.cues, 1, landAt + 0.45);

  const count = p(t, 0.08, landAt);
  const v = count >= 1 ? c.value : c.value * count;
  const final = fmt(c.value, c.decimals) + c.unit;
  const now = fmt(v, c.decimals) + c.unit;

  const NS = fit(final, 330, 1500);
  const numW = textWidth(final, NS) * 1.06;
  const capS = fit(c.caption, 56, 1400);
  const up = q(t, titleAt - 0.1, titleAt + 0.45);
  const groupY = mix(400, 250, up);
  const groupScale = mix(1, 0.62, up);
  const land = clamp((t - landAt) / 0.2);

  const size = fit(c.title, 120, 1500);
  const PH = size * 1.7, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt + 0.25, titleAt + 0.65);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{ position: 'absolute', left: 0, width: 1920, top: groupY, transform: `scale(${groupScale})`, transformOrigin: '960px 0px', opacity: p(t, 0, 0.15) }}>
          <div style={{
            position: 'absolute', left: 960 - numW / 2, width: numW, top: -NS * 0.58, textAlign: 'right',
            ...textBase(NS, 900), color: S.ink, fontVariantNumeric: 'tabular-nums',
            transform: `scale(${1 + 0.035 * (1 - land) * (t >= landAt ? 1 : 0)})`, transformOrigin: '50% 50%',
          }}>{now}</div>
        </div>
        <div style={{
          position: 'absolute', left: 0, width: 1920, top: groupY + NS * 0.66 * groupScale + mix(34, 18, up), textAlign: 'center', ...textBase(capS, 500), color: S.muted,
          opacity: p(t, landAt - 0.15, landAt + 0.25),
        }}>{c.caption}</div>
        {pill > 0 && (
          <div style={{
            position: 'absolute', left: 960 - PW / 2, top: 600, width: PW, height: PH, borderRadius: PH / 2,
            background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: clamp(pill * 4), transform: `translateY(${(1 - pill) * 50}px) scale(${mix(1.1, 1, pill)})`,
          }}>
            <span style={{ ...textBase(size, 400), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
          </div>
        )}
      </Handoff>
    </Frame>
  );
}
