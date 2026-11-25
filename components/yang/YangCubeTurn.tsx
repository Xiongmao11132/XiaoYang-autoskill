/**
 * YangCubeTurn — 方块翻转章节过渡（正版 T12m）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T12m-CubeTurn.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S; defaults neutralized.
 *
 * Mechanics: one long black bar (kit capsule language) carries the previous chapter —
 * number dimmed + title — and rolls upward a full face like a prism (rotateX around the
 * bar's center axis, translateZ = H/2): the face turning away darkens, the new face
 * (this chapter, number in light purple) brightens as it lands. Mid-turn the bar lifts
 * 6% closer and its shadow narrows with the visible face height. No bounce.
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
const pad2 = (n: number) => String(Math.max(0, Math.round(n))).padStart(2, '0');
const fit = (s: string, max: number, avail: number) => Math.min(max, avail / Math.max(1, textWidth(s, 1)));

export type YangCubeTurnProps = YangHandoffProps & {
  index: number;
  prevTitle: string;
  title: string;
  cues?: number[];
};

export const yangCubeTurnDefaults: YangCubeTurnProps = {
  index: 4,
  prevTitle: '上一章示例',
  title: '示例章节名',
};

const H = 250, NUM = 128, PAD = 96, GAP = 54;

function Face({ num, title, size, w, numColor }: { num: string; title: string; size: number; w: number; numColor: string }) {
  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, width: w, height: H, background: S.dark, borderRadius: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: GAP, backfaceVisibility: 'hidden',
    }}>
      <span style={{ ...textBase(NUM, 900), lineHeight: 1, color: numColor, fontVariantNumeric: 'tabular-nums' }}>{num}</span>
      <span style={{ ...textBase(size, 400), lineHeight: 1, color: '#fff' }}>{title}</span>
    </div>
  );
}

export function YangCubeTurn(props: Partial<YangCubeTurnProps>) {
  const c = { ...yangCubeTurnDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.62);

  const avail = 1720 - PAD * 2 - GAP - textWidth('00', NUM);
  const sPrev = fit(c.prevTitle, 132, avail), sNow = fit(c.title, 132, avail);
  const wOf = (title: string, s: number) => PAD * 2 + textWidth('00', NUM) + GAP + textWidth(title, s);
  const W = Math.min(1720, Math.max(980, wOf(c.prevTitle, sPrev), wOf(c.title, sNow)));

  const enter = p(t, 0, 0.42);
  const turn = q(t, at, at + 0.62);
  const ang = 90 * turn;
  const lift = Math.sin(turn * Math.PI) * 0.06;
  const shadeOld = clamp(turn * 1.4), shadeNew = clamp((1 - turn) * 1.4);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{
          position: 'absolute', left: 960 - W / 2, top: 540 - H / 2, width: W, height: H, perspective: 2400,
          opacity: enter, transform: `translateY(${(1 - enter) * 60}px) scale(${1 + lift})`,
        }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 30, boxShadow: S.capsuleShadow, transform: `scaleY(${mix(1, 0.72, Math.sin(turn * Math.PI))})` }} />
          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateZ(${-H / 2}px) rotateX(${ang}deg)` }}>
            <div style={{ position: 'absolute', inset: 0, transform: `translateZ(${H / 2}px)`, backfaceVisibility: 'hidden' }}>
              <Face num={pad2(c.index - 1)} title={c.prevTitle} size={sPrev} w={W} numColor={S.faint} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 30, background: '#000', opacity: shadeOld * 0.55 }} />
            </div>
            <div style={{ position: 'absolute', inset: 0, transform: `rotateX(-90deg) translateZ(${H / 2}px)`, backfaceVisibility: 'hidden' }}>
              <Face num={pad2(c.index)} title={c.title} size={sNow} w={W} numColor={S.accentDark} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 30, background: '#000', opacity: shadeNew * 0.55 }} />
            </div>
          </div>
        </div>
      </Handoff>
    </Frame>
  );
}
