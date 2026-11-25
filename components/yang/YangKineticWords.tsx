/**
 * YangKineticWords — 黑底快切开场（正版 T20j）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T20j-KineticWords.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S; defaults neutralized.
 *
 * Mechanics: on a full-screen black field, 2–4 keywords slam in one at a time — hard cuts,
 * each word alone on screen at a shared font size (the last word lands in light purple).
 * After the last word, the SAME black field shrinks into a single black capsule (corner
 * radius grows to h/2 as it contracts) and the theme sentence fades in inside it, white
 * canvas revealed around it.
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

export type YangKineticWordsProps = YangHandoffProps & {
  words: string[];
  title: string;
  highlight: string;
  cues?: number[];
};

export const yangKineticWordsDefaults: YangKineticWordsProps = {
  words: ['免费', '开源', '够用了'],
  title: '一组顺手的工具',
  highlight: '顺手',
};

export function YangKineticWords(props: Partial<YangKineticWordsProps>) {
  const c = { ...yangKineticWordsDefaults, ...props };
  const t = useT();
  const n = c.words.length;
  const wordAt = (i: number) => cueAt(c.cues, i, 0.08 + i * 0.46);
  const shrinkAt = cueAt(c.cues, n, wordAt(n - 1) + 0.6);

  let cur = -1;
  for (let i = 0; i < n; i++) if (t >= wordAt(i)) cur = i;

  const size = fit(c.title, 120, 1400);
  const PH = size * 1.7, PW = textWidth(c.title, size) + PH * 1.05;
  const s = q(t, shrinkAt, shrinkAt + 0.62);
  const w = mix(1920, PW, s), h = mix(1080, PH, s);
  const r = mix(0, PH / 2, clamp(s * 1.6));
  const box = { x: 960 - w / 2, y: 540 - h / 2 };
  const title = p(t, shrinkAt + 0.4, shrinkAt + 0.85);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{
          position: 'absolute', left: box.x, top: box.y, width: w, height: h, borderRadius: r, background: S.dark, overflow: 'hidden',
          boxShadow: s > 0.02 ? S.capsuleShadow : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {cur >= 0 && s <= 0.001 && (() => {
            const word = c.words[cur];
            const ws = Math.min(...c.words.map((wd) => fit(wd, 300, 1380)));
            const e = p(t, wordAt(cur), wordAt(cur) + 0.2);
            const last = cur === n - 1;
            return (
              <span key={cur} style={{
                ...textBase(ws, 400), color: last ? S.accentDark : '#fff',
                transform: `scale(${mix(1.28, 1, e)})`,
              }}>{word}</span>
            );
          })()}
          {title > 0 && (
            <span style={{
              ...textBase(size, 400), color: '#fff', position: 'absolute',
              opacity: title, transform: `translateY(${(1 - title) * 30}px)`,
            }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
          )}
        </div>
      </Handoff>
    </Frame>
  );
}
