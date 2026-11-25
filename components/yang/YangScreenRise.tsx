/**
 * YangScreenRise — 屏幕立起开场（正版 T20k）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T20k-ScreenRise.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S.
 * The original default recording is NOT integrated — pass your own via `src`; an empty string
 * renders a neutral placeholder screen.
 *
 * Mechanics: a screen playing a real recording lies almost flat at the bottom of the
 * frame (rotateX 82° around its bottom edge, darkened, shadow barely cast); it rises and
 * stands upright in one quintic motion — no bounce — brightening as it comes up, its
 * shadow settling beneath it. The media clock runs continuously from frame one. Once it
 * stands, the title capsule lands across its bottom edge.
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
function Media({ src, box, radius = S.radius, start = 0, style }: { src: string; box: Box; radius?: number; start?: number; style?: React.CSSProperties }) {
  const { fps } = useVideoConfig();
  if (!src) {
    return (
      <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', background: 'linear-gradient(150deg, #dfe7f2 0%, #aebfd8 55%, #7d94b5 100%)', ...style }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...textBase(54, 500), color: 'rgba(50,64,84,0.6)' }}>录屏画面</span>
        </div>
      </div>
    );
  }
  const image = /\.(png|jpe?g|webp)$/i.test(src);
  const inner: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return (
    <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', ...style }}>
      {image ? <Img src={staticFile(src)} style={inner} /> : <OffthreadVideo muted src={staticFile(src)} startFrom={Math.round(start * fps)} style={inner} />}
    </div>
  );
}
const fit = (s: string, max: number, avail: number) => Math.min(max, avail / Math.max(1, textWidth(s, 1)));
function splitHighlight(text: string, hl: string): [string, string, string] {
  const i = hl ? text.indexOf(hl) : -1;
  if (i < 0) return [text, '', ''];
  return [text.slice(0, i), hl, text.slice(i + hl.length)];
}

export type YangScreenRiseProps = YangHandoffProps & {
  src: string;
  ratio: number;
  start: number;
  title: string;
  highlight: string;
  cues?: number[];
};

export const yangScreenRiseDefaults: YangScreenRiseProps = {
  src: '',
  ratio: 1440 / 1080,
  start: 1,
  title: '先把画面看清楚',
  highlight: '看清楚',
};

export function YangScreenRise(props: Partial<YangScreenRiseProps>) {
  const c = { ...yangScreenRiseDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.2);
  const titleAt = cueAt(c.cues, 1, at + 1.2);

  const H = Math.min(820, 1300 / c.ratio), W = H * c.ratio;
  const box = { x: 960 - W / 2, y: 70, w: W, h: H };

  const appear = p(t, 0, 0.3);
  const rise = quintic(t, at, at + 1.0);
  const ang = mix(82, 0, rise);
  const lift = mix(150, 0, rise);
  const shadowK = clamp(rise * 1.2);

  const size = fit(c.title, 108, 1300);
  const PH = size * 1.62, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt, titleAt + 0.42);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{ position: 'absolute', inset: 0, perspective: 1900, perspectiveOrigin: `960px ${box.y + box.h}px` }}>
          <div style={{
            position: 'absolute', left: box.x, top: box.y + lift, width: W, height: H, transformOrigin: '50% 100%',
            transform: `rotateX(${ang}deg)`, opacity: appear,
          }}>
            <Media src={c.src} start={c.start} box={{ x: 0, y: 0, w: W, h: H }} radius={S.radius} style={{
              boxShadow: `0 ${mix(4, 16, shadowK)}px ${mix(8, 25, shadowK)}px 0 rgba(0,0,0,${mix(0.05, 0.1333, shadowK).toFixed(3)})`,
            }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: S.radius, background: '#000', opacity: (1 - rise) * 0.35 }} />
          </div>
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
