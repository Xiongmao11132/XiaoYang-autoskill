/**
 * YangTextMask — 大字透画开场（正版 T20q）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T20q-TextMask.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S.
 * The original default artwork is NOT integrated — pass your own via `src`; an empty string
 * renders a neutral gradient artwork behind the mask.
 *
 * Mechanics: on a white canvas, 2–4 huge characters show a real artwork through their
 * glyph shapes (SVG mask — the characters ARE the window). The characters slowly grow;
 * then a circle reveal fills the whole screen with the artwork (the image itself eases
 * from 1.14 back to 1.0 so it never sits frozen), and the full frame finally contracts
 * into one large rounded window with the title capsule on its bottom edge.
 * Layout: 1920×1080 logical stage, scaled by host width (Frame).
 */
import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
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

export type YangTextMaskProps = YangHandoffProps & {
  word: string;
  src: string;
  ratio: number;
  title: string;
  highlight: string;
  cues?: number[];
};

export const yangTextMaskDefaults: YangTextMaskProps = {
  word: '透画',
  src: '',
  ratio: 1672 / 942,
  title: '字里藏着一张图',
  highlight: '一张图',
};

export function YangTextMask(props: Partial<YangTextMaskProps>) {
  const c = { ...yangTextMaskDefaults, ...props };
  const t = useT();
  const openAt = cueAt(c.cues, 0, 1.15);
  const shrinkAt = cueAt(c.cues, 1, openAt + 0.75);
  const id = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const ws = fit(c.word, 620, 1700);
  const inE = p(t, 0, 0.5);
  const grow = mix(mix(0.9, 1, inE), 1.55, q(t, openAt - 0.2, openAt + 0.55));
  const fill = q(t, openAt, openAt + 0.5);
  const drift = mix(1.14, 1.0, clamp(t / (shrinkAt + 0.6)));

  const shrink = q(t, shrinkAt, shrinkAt + 0.6);
  const WW = 1360, WH = WW / c.ratio;
  const win = { x: 960 - WW / 2, y: Math.max(145, 470 - WH / 2) };
  const sc = mix(1, WW / 1920, shrink);
  const tx = mix(0, win.x, shrink), ty = mix(0, win.y - (1080 * sc - WH) / 2, shrink);
  const radius = mix(0, S.radius / sc, shrink);

  const titleAt = shrinkAt + 0.45;
  const size = fit(c.title, 108, 1300);
  const PH = size * 1.62, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt, titleAt + 0.42);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0',
          transform: `translate(${tx}px, ${ty}px) scale(${sc})`, borderRadius: radius, overflow: 'hidden',
          boxShadow: shrink > 0.3 ? S.shadow : 'none',
        }}>
          <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
            <defs>
              <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
                <rect x={0} y={0} width={1920} height={1080} fill="#000" />
                <g transform={`translate(960 540) scale(${grow}) translate(-960 -540)`}>
                  <text x={960} y={540 + ws * 0.36} textAnchor="middle" fill="#fff"
                    style={{ ...textBase(ws, 400), lineHeight: 1 }}>{c.word}</text>
                </g>
                <circle cx={960} cy={540} r={fill * 1110} fill="#fff" />
              </mask>
              <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f6c6d8" />
                <stop offset="48%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <g mask={`url(#${id}-m)`}>
              {c.src
                ? <image href={staticFile(c.src)} x={0} y={0} width={1920} height={1080} preserveAspectRatio="xMidYMid slice"
                  transform={`translate(960 540) scale(${drift}) translate(-960 -540)`} />
                : <rect x={0} y={0} width={1920} height={1080} fill={`url(#${id}-g)`}
                  transform={`translate(960 540) scale(${drift}) translate(-960 -540)`} />}
            </g>
          </svg>
        </div>
        {pill > 0 && (
          <div style={{
            position: 'absolute', left: 960 - PW / 2, top: win.y + WH - PH * 0.42, width: PW, height: PH, borderRadius: PH / 2,
            background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: clamp(pill * 4), transform: `translateY(${(1 - pill) * 46}px) scale(${mix(1.1, 1, pill)})`,
          }}>
            <span style={{ ...textBase(size, 400), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
          </div>
        )}
      </Handoff>
    </Frame>
  );
}
