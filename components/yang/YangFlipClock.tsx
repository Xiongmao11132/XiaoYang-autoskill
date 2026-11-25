/**
 * YangFlipClock — 翻页序号章节过渡（正版 T12k）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T12k-FlipClock.tsx (+ kit + _shared);
 * package publicly released 2026-10-28 on the original author's visual library (fred-fu.com/visual-library).
 * Downloaded 2026-11-02 via the site's public asset route, SHA-256 verified against the FredTalk
 * member-package manifest (c8fb6f0b…fb2970c, 34,053,880 B), imported with scripts/assets.py;
 * archive: ~/workspace/tools/FredTalk/downloads-b/fred-chapter-transitions-20-source.zip.
 * 本批（T12k–T12t、T20h–T20q）20 件同包同源，各文件头不再重复下载细节。
 * Integration notes: Sfx/Brand NOT integrated (silent, no watermark); fonts → library FONT;
 * colors → local S palette (original house style); defaults neutralized.
 *
 * Mechanics: on a dark stage, two white flip-clock cards flip from the previous chapter
 * number to this chapter's (upper half folds down, lower half falls in, with brightness
 * shading and the clock's center seam); the whole stack then lifts and the part label +
 * chapter title reveal below with a line-mask rise.
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
function Frame({ dark = false, children }: { dark?: boolean; children: React.ReactNode }) {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: dark ? S.dark : S.bg, overflow: 'hidden' }}>
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

export type YangFlipClockProps = YangHandoffProps & {
  index: number;
  from?: number;
  label: string;
  title: string;
  cues?: number[];
};

export const yangFlipClockDefaults: YangFlipClockProps = {
  index: 2,
  label: '',
  title: '示例章节名',
};

const CW = 270, CH = 380, GAP = 26, DIGIT = 330;

function Half({ d, part, style }: { d: string; part: 'top' | 'bottom'; style?: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute', left: 0, top: part === 'top' ? 0 : CH / 2, width: CW, height: CH / 2, overflow: 'hidden',
      background: '#fff', borderRadius: part === 'top' ? `${S.radius}px ${S.radius}px 0 0` : `0 0 ${S.radius}px ${S.radius}px`,
      backfaceVisibility: 'hidden', ...style,
    }}>
      <div style={{ position: 'absolute', left: 0, top: part === 'top' ? 0 : -CH / 2, width: CW, height: CH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ ...textBase(DIGIT, 900), lineHeight: 1, color: S.ink, fontVariantNumeric: 'tabular-nums' }}>{d}</span>
      </div>
    </div>
  );
}

function FlipCard({ from, to, flip }: { from: string; to: string; flip: number }) {
  const a = clamp(flip * 2), b = clamp(flip * 2 - 1);
  const same = from === to;
  return (
    <div style={{ position: 'relative', width: CW, height: CH, borderRadius: S.radius, boxShadow: '30px 22px 25px #0009' }}>
      <Half d={to} part="top" />
      <Half d={same || b >= 1 ? to : from} part="bottom" />
      {!same && a < 1 && <Half d={from} part="top" style={{ transformOrigin: '50% 100%', transform: `perspective(1400px) rotateX(${-90 * a}deg)`, zIndex: 2, filter: `brightness(${mix(1, 0.72, a)})` }} />}
      {!same && b > 0 && b < 1 && <Half d={to} part="bottom" style={{ transformOrigin: '50% 0%', transform: `perspective(1400px) rotateX(${90 * (1 - b)}deg)`, zIndex: 2, filter: `brightness(${mix(0.72, 1, b)})` }} />}
      <div style={{ position: 'absolute', left: 0, right: 0, top: CH / 2 - 2, height: 4, background: S.dark, zIndex: 3 }} />
    </div>
  );
}

export function YangFlipClock(props: Partial<YangFlipClockProps>) {
  const c = { ...yangFlipClockDefaults, ...props };
  const t = useT();
  const label = partLabel(c.index, c.label);
  const fromS = pad2(c.from ?? c.index - 1), toS = pad2(c.index);

  const flipAt = cueAt(c.cues, 0, 0.5);
  const titleAt = cueAt(c.cues, 1, flipAt + 0.62);

  const cardsIn = p(t, 0, 0.42);
  const flip = q(t, flipAt, flipAt + 0.56);
  const lift = p(t, titleAt - 0.08, titleAt + 0.5);

  const tSize = fit(c.title, 150, 1640);
  const LAB = 52;
  const stackH = CH + 64 + LAB * 1.16 + 16 + tSize * 1.12;
  const topEnd = (1080 - stackH) / 2;
  const cardsTop = mix(540 - CH / 2, topEnd, lift);
  const textTop = topEnd + CH + 64;
  const lab = p(t, titleAt, titleAt + 0.4);
  const ti = p(t, titleAt + 0.08, titleAt + 0.56);

  return (
    <Frame dark>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{ position: 'absolute', left: 960 - (CW * 2 + GAP) / 2, top: cardsTop, display: 'flex', gap: GAP, opacity: cardsIn, transform: `translateY(${(1 - cardsIn) * 70}px)` }}>
          {[0, 1].map((i) => <FlipCard key={i} from={fromS[i]} to={toS[i]} flip={flip} />)}
        </div>
        <div style={{ ...textBase(LAB, 600), position: 'absolute', left: 0, right: 0, top: textTop, textAlign: 'center', color: S.accentDark, letterSpacing: 4, opacity: lab, transform: `translateY(${(1 - lab) * 18}px)` }}>{label}</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: textTop + LAB * 1.16 + 16, height: tSize * 1.12, overflow: 'hidden', textAlign: 'center' }}>
          <div style={{ ...textBase(tSize, 400), lineHeight: 1.12, color: '#fff', transform: `translateY(${(1 - ti) * tSize * 1.12}px)` }}>{c.title}</div>
        </div>
      </Handoff>
    </Frame>
  );
}
