/**
 * YangWindowStack — 窗口连弹开场（正版 T20h）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T20h-WindowStack.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S.
 * The original default screenshots (real GitHub pages from the original episode) are NOT integrated —
 * pass your own via `media`; empty-string entries render neutral placeholder windows.
 *
 * Mechanics: real page screenshots pop in one after another (0.13s apart, hero last, on
 * top) at scattered positions/rotations; then every non-hero window is swept out along
 * its direction away from center (outer ones first) while the hero glides to center,
 * straightens and grows; the title capsule lands across its bottom edge.
 * Layout: 1920×1080 logical stage, scaled by host width (Frame).
 */
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  bg: '#fff', ink: '#19191c', dark: '#19191c', muted: '#83838a', faint: '#b9b9bf',
  accent: '#8554E8', accentDark: '#D6BEFF', radius: 28,
  capsuleShadow: '0 18px 36px 0 rgba(0,0,0,0.3)', shadow: '0 24px 40px 0 rgba(0,0,0,0.2)',
  windowBody: '#212123',
};
type Box = { x: number; y: number; w: number; h: number };
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const p = (t: number, a: number, b: number) => easeOut(clamp((t - a) / (b - a)));
const q = (t: number, a: number, b: number) => easeInOut(clamp((t - a) / (b - a)));
const cueAt = (cues: number[] | undefined, i: number, fb: number) => (cues && cues[i] !== undefined ? cues[i] : fb);
const isW = (ch: string) => /[一-鿿＀-￯]/.test(ch);
function textWidth(text: string, size: number) { let w = 0; for (const ch of text) w += isW(ch) ? 0.94 : 0.56; return w * size; }
const abs = (b: Box): React.CSSProperties => ({ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h });
const textBase = (size: number, weight = 500): React.CSSProperties => ({
  fontFamily: FONT, fontSize: size, fontWeight: weight, lineHeight: 1.16, letterSpacing: 0, whiteSpace: 'nowrap',
});
const between = (a: Box, b: Box, k: number): Box => ({ x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k) });
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
const TILE_GRADS = [
  'linear-gradient(135deg, #f3d9a4, #e8a87c)', 'linear-gradient(135deg, #b8d8f8, #7aa7e8)',
  'linear-gradient(135deg, #f6c6d8, #e88bb0)', 'linear-gradient(135deg, #c2ecd4, #74c69d)',
  'linear-gradient(135deg, #ddd6fe, #a78bfa)', 'linear-gradient(135deg, #fde68a, #f59e0b)',
  'linear-gradient(135deg, #bae6fd, #38bdf8)',
];
function Media({ src, box, radius = S.radius, label, style }: { src: string; box: Box; radius?: number; label?: string; style?: React.CSSProperties }) {
  if (!src) {
    const seed = label ? [...label].reduce((a, ch) => a + ch.charCodeAt(0), 0) : 0;
    return (
      <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', background: TILE_GRADS[seed % TILE_GRADS.length], ...style }}>
        {label && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ ...textBase(Math.min(120, box.h * 0.3), 900), color: 'rgba(255,255,255,0.8)' }}>{label}</span>
          </div>
        )}
      </div>
    );
  }
  const image = /\.(png|jpe?g|webp)$/i.test(src);
  const inner: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return (
    <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', ...style }}>
      {image ? <Img src={staticFile(src)} style={inner} /> : <OffthreadVideo muted loop src={staticFile(src)} style={inner} />}
    </div>
  );
}
const fit = (s: string, max: number, avail: number) => Math.min(max, avail / Math.max(1, textWidth(s, 1)));
function splitHighlight(text: string, hl: string): [string, string, string] {
  const i = hl ? text.indexOf(hl) : -1;
  if (i < 0) return [text, '', ''];
  return [text.slice(0, i), hl, text.slice(i + hl.length)];
}

export type YangWindowStackProps = YangHandoffProps & {
  media: string[];
  ratio: number;
  heroIndex: number;
  title: string;
  highlight: string;
  cues?: number[];
};

export const yangWindowStackDefaults: YangWindowStackProps = {
  media: ['', '', '', '', ''],
  ratio: 2304 / 1520,
  heroIndex: 4,
  title: '先看这一组结果',
  highlight: '结果',
};

const SCATTER = [
  { x: 640, y: 420, r: -6 }, { x: 1290, y: 380, r: 5 }, { x: 760, y: 650, r: 4 }, { x: 1200, y: 680, r: -4 },
  { x: 960, y: 520, r: -2 }, { x: 560, y: 560, r: 3 }, { x: 1380, y: 560, r: -3 },
];

export function YangWindowStack(props: Partial<YangWindowStackProps>) {
  const c = { ...yangWindowStackDefaults, ...props };
  const t = useT();
  const n = c.media.length;
  const hero = Math.max(0, Math.min(n - 1, c.heroIndex));
  const gap = Math.min(0.13, 0.9 / Math.max(1, n));
  const order = [...c.media.keys()].filter((i) => i !== hero).concat(hero);
  const lastPop = 0.05 + (n - 1) * gap;
  const sweepAt = cueAt(c.cues, 0, lastPop + 0.55);
  const titleAt = cueAt(c.cues, 1, sweepAt + 0.42);

  const CW = 860, CH = CW / c.ratio;
  const sweep = q(t, sweepAt, sweepAt + 0.5);
  void sweep;
  const heroMove = q(t, sweepAt + 0.04, sweepAt + 0.66);

  const HW = 1200, HH = HW / c.ratio;
  const heroEnd: Box = { x: 960 - HW / 2, y: Math.max(125, 470 - HH / 2), w: HW, h: HH };

  const size = fit(c.title, 112, 1300);
  const PH = size * 1.62, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt, titleAt + 0.42);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        {order.map((mi, k) => {
          const at = 0.05 + k * gap;
          if (t < at) return null;
          const e = p(t, at, at + 0.34);
          const sc = SCATTER[k % SCATTER.length];
          const start: Box = { x: sc.x - CW / 2, y: sc.y - CH / 2, w: CW, h: CH };
          const isHero = mi === hero;
          let box = start, rot = sc.r * (isHero ? 1 - heroMove : 1), dx = 0, dy = 0, op = clamp(e * 2.5);
          if (isHero) box = between(start, heroEnd, heroMove);
          else {
            const dir = Math.sign(sc.x - 960) || (k % 2 ? 1 : -1);
            const s = q(t, sweepAt + Math.abs(sc.x - 960) / 9000, sweepAt + 0.42);
            dx = dir * s * 1500; dy = (sc.y - 540) * s * 1.2; rot += dir * s * 14; op *= 1 - clamp(s * 1.4 - 0.4);
            if (op <= 0.001) return null;
          }
          return (
            <div key={mi} style={{ position: 'absolute', inset: 0, opacity: op, zIndex: k, transform: `translate(${dx}px, ${dy + (1 - e) * 90}px)` }}>
              <Media src={c.media[mi]} label={String(mi + 1).padStart(2, '0')} box={box} radius={S.radius} style={{ boxShadow: S.shadow, transform: `rotate(${rot}deg) scale(${mix(0.82, 1, e)})` }} />
            </div>
          );
        })}
        {pill > 0 && (
          <div style={{
            position: 'absolute', left: 960 - PW / 2, top: heroEnd.y + heroEnd.h - PH * 0.45, width: PW, height: PH, borderRadius: PH / 2,
            background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
            opacity: clamp(pill * 4), transform: `translateY(${(1 - pill) * -50}px) scale(${mix(1.12, 1, pill)})`,
          }}>
            <span style={{ ...textBase(size, 400), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
          </div>
        )}
      </Handoff>
    </Frame>
  );
}
