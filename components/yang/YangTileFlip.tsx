/**
 * YangTileFlip — 方块翻出开场（正版 T20p）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T20p-TileFlip.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S.
 * The original default artwork is NOT integrated — pass your own via `src`; an empty string
 * renders a neutral gradient artwork so the tile mechanics stay verifiable.
 *
 * Mechanics: a field of black tiles flips over domino-style along the diagonal (each
 * tile rotateY 180°, staggered by diagonal distance, ~0.9s for the whole field); every
 * tile's back is its slice of one real artwork. When all have flipped, the gaps close,
 * the corner radius and shadow arrive, and the field is one complete picture; the title
 * capsule lands on its bottom edge.
 * Layout: 1920×1080 logical stage, scaled by host width (Frame).
 */
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
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

export type YangTileFlipProps = YangHandoffProps & {
  src: string;
  ratio: number;
  cols: number;
  title: string;
  highlight: string;
  cues?: number[];
};

export const yangTileFlipDefaults: YangTileFlipProps = {
  src: '',
  ratio: 1672 / 942,
  cols: 9,
  title: '逐块翻出整张图',
  highlight: '整张图',
};

export function YangTileFlip(props: Partial<YangTileFlipProps>) {
  const c = { ...yangTileFlipDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.3);

  const W = 1400, H = W / c.ratio;
  const box = { x: 960 - W / 2, y: Math.max(145, 470 - H / 2), w: W, h: H };
  const cols = Math.max(4, Math.min(14, Math.round(c.cols)));
  const rows = Math.max(3, Math.round(cols / c.ratio));
  const tw = W / cols, th = H / rows;

  const per = 0.42;
  const stagger = 0.9 / (cols + rows - 2);
  const doneAt = at + 0.9 + per;
  const merge = q(t, doneAt, doneAt + 0.4);
  const gapPx = mix(6, 0, merge);
  const titleAt = cueAt(c.cues, 1, doneAt + 0.3);

  const size = fit(c.title, 108, 1300);
  const PH = size * 1.62, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt, titleAt + 0.42);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);
  const appear = p(t, 0, 0.3);

  const tiles = [];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const st = at + (r + k) * stagger;
    const f = q(t, st, st + per);
    const ang = 180 * f;
    const x = k * tw, y = r * th;
    const face: React.CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', overflow: 'hidden', borderRadius: mix(8, 0, merge) };
    tiles.push(
      <div key={`${r}-${k}`} style={{
        position: 'absolute', left: x + gapPx / 2, top: y + gapPx / 2, width: tw - gapPx, height: th - gapPx,
        transformStyle: 'preserve-3d', transform: `perspective(1400px) rotateY(${ang}deg) scale(${1 + 0.08 * Math.sin(f * Math.PI)})`,
        zIndex: Math.round(Math.sin(f * Math.PI) * 10),
      }}>
        <div style={{ ...face, background: S.dark }} />
        <div style={{ ...face, transform: 'rotateY(180deg)' }}>
          {c.src
            ? <Img src={staticFile(c.src)} style={{ position: 'absolute', left: -x - gapPx / 2, top: -y - gapPx / 2, width: W, height: H, maxWidth: 'none' }} />
            : <div style={{ position: 'absolute', left: -x - gapPx / 2, top: -y - gapPx / 2, width: W, height: H, background: 'linear-gradient(140deg, #f6c6d8 0%, #a78bfa 48%, #38bdf8 100%)' }} />}
        </div>
      </div>,
    );
  }

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{
          position: 'absolute', left: box.x, top: box.y, width: W, height: H, borderRadius: S.radius * merge,
          boxShadow: merge > 0 ? S.shadow : 'none', opacity: appear, transform: `scale(${mix(0.96, 1, appear)})`,
        }}>{tiles}</div>
        {pill > 0 && (
          <div style={{
            position: 'absolute', left: 960 - PW / 2, top: box.y + box.h - PH * 0.42, width: PW, height: PH, borderRadius: PH / 2,
            background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
            opacity: clamp(pill * 4), transform: `translateY(${(1 - pill) * 46}px) scale(${mix(1.1, 1, pill)})`,
          }}>
            <span style={{ ...textBase(size, 400), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
          </div>
        )}
      </Handoff>
    </Frame>
  );
}
