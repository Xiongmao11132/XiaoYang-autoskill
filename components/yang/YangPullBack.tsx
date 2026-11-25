/**
 * YangPullBack — 细节拉远开场（正版 T20i）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T20i-PullBack.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S.
 * The original's default screenshot is NOT integrated — pass your own via `src` (with its pixel
 * size and the focus point); an empty string renders a neutral placeholder page.
 *
 * Mechanics: the first frame is a magnified detail of a real page (e.g. a star count) —
 * the audience first asks "what is this number". The detail keeps a gentle 3% push, then
 * the camera pulls back in one quintic move (log-interpolated zoom) to the full page; the
 * camera center is clamped inside the screenshot so no outside blank ever shows. The title
 * capsule lands on the page's bottom edge.
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
const quintic = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * v * (v * (6 * v - 15) + 10); };
const cueAt = (cues: number[] | undefined, i: number, fb: number) => (cues && cues[i] !== undefined ? cues[i] : fb);
const isW = (ch: string) => /[一-鿿＀-￯]/.test(ch);
function textWidth(text: string, size: number) { let w = 0; for (const ch of text) w += isW(ch) ? 0.94 : 0.56; return w * size; }
const abs = (b: Box): React.CSSProperties => ({ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h });
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
function Media({ src, box, radius = S.radius, style }: { src: string; box: Box; radius?: number; style?: React.CSSProperties }) {
  if (!src) {
    return (
      <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', background: 'linear-gradient(160deg, #eef1f5 0%, #d7dde6 60%, #bfc9d6 100%)', ...style }}>
        <div style={{ position: 'absolute', left: '6%', top: '8%', width: '46%', height: '7%', borderRadius: 12, background: 'rgba(90,100,115,0.35)' }} />
        <div style={{ position: 'absolute', left: '6%', top: '22%', width: '78%', height: '4.5%', borderRadius: 9, background: 'rgba(90,100,115,0.22)' }} />
        <div style={{ position: 'absolute', left: '6%', top: '31%', width: '70%', height: '4.5%', borderRadius: 9, background: 'rgba(90,100,115,0.22)' }} />
        <div style={{ position: 'absolute', right: '6%', top: '58%', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ ...textBase(72, 900), color: S.accent }}>★ 50.5k</span>
        </div>
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
const zoomMix = (a: number, b: number, e: number) => Math.exp(mix(Math.log(a), Math.log(b), clamp(e)));

export type YangPullBackProps = YangHandoffProps & {
  src: string;
  srcW: number; srcH: number;
  focus: { x: number; y: number };
  zoomFrom: number;
  title: string;
  highlight: string;
  cues?: number[];
};

export const yangPullBackDefaults: YangPullBackProps = {
  src: '',
  srcW: 1920, srcH: 1080,
  focus: { x: 1620, y: 700 },
  zoomFrom: 3.4,
  title: '先看这个数字',
  highlight: '数字',
};

export function YangPullBack(props: Partial<YangPullBackProps>) {
  const c = { ...yangPullBackDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.55);
  const titleAt = cueAt(c.cues, 1, at + 1.15);

  const W = 1200, H = W * c.srcH / c.srcW;
  const box = { x: 960 - W / 2, y: Math.max(125, 500 - H / 2), w: W, h: H };
  const k = W / c.srcW;
  const fx0 = box.x + c.focus.x * k, fy0 = box.y + c.focus.y * k;

  const e = quintic(t, at, at + 1.05);
  const z = zoomMix(c.zoomFrom * mix(1, 1.03, clamp(t / Math.max(0.01, at))), 1, e);
  const clampAxis = (v: number, lo: number, len: number, half: number) => (len >= half * 2 ? clamp(v, lo + half, lo + len - half) : lo + len / 2);
  const cx = clampAxis(mix(fx0, box.x + box.w / 2, e), box.x, box.w, 960 / z);
  const cy = clampAxis(mix(fy0, box.y + box.h / 2, e), box.y, box.h, 540 / z);
  const endCx = 960, endCy = box.y + box.h / 2;
  const sx = mix(960, endCx, e), sy = mix(540, endCy, e);
  const cam = `translate(${sx}px, ${sy}px) scale(${z}) translate(${-cx}px, ${-cy}px)`;

  const size = fit(c.title, 108, 1300);
  const PH = size * 1.62, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt, titleAt + 0.42);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);
  const radius = mix(0, S.radius, e);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{ position: 'absolute', inset: 0, transform: cam, transformOrigin: '0 0' }}>
          <Media src={c.src} box={box} radius={radius} style={{ boxShadow: e > 0.6 ? S.shadow : 'none' }} />
        </div>
        {pill > 0 && (
          <div style={{
            position: 'absolute', left: 960 - PW / 2, top: box.y + box.h - PH * 0.42, width: PW, height: PH, borderRadius: PH / 2,
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
