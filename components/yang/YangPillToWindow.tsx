/**
 * YangPillToWindow — 胶囊变窗开场（正版 T20m）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T20m-PillToWindow.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S.
 * The original's default recording is NOT integrated — pass your own via `src`; an empty string
 * renders a neutral placeholder inside the window.
 *
 * Mechanics: one continuous object throughout — a point grows into a black capsule
 * carrying the hook line; the text withdraws and the capsule itself stretches open into
 * a large playback window (corner radius easing from h/2 down to 28), the real footage
 * brightening inside it; finally the hook returns as a small capsule pressed onto the
 * window's bottom edge.
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
function Media({ src, box, radius = S.radius, start = 0 }: { src: string; box: Box; radius?: number; start?: number }) {
  const { fps } = useVideoConfig();
  if (!src) {
    return (
      <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', background: 'linear-gradient(150deg, #f6d8a8 0%, #e8a87c 55%, #c97b4e 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...textBase(54, 500), color: 'rgba(90,50,20,0.55)' }}>窗口画面</span>
        </div>
      </div>
    );
  }
  const image = /\.(png|jpe?g|webp)$/i.test(src);
  const inner: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return (
    <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden' }}>
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

export type YangPillToWindowProps = YangHandoffProps & {
  hook: string;
  highlight: string;
  src: string;
  ratio: number;
  start: number;
  cues?: number[];
};

export const yangPillToWindowDefaults: YangPillToWindowProps = {
  hook: '先看这句钩子',
  highlight: '钩子',
  src: '',
  ratio: 1440 / 1080,
  start: 1,
};

export function YangPillToWindow(props: Partial<YangPillToWindowProps>) {
  const c = { ...yangPillToWindowDefaults, ...props };
  const t = useT();
  const openAt = cueAt(c.cues, 0, 1.15);
  const backAt = cueAt(c.cues, 1, openAt + 0.9);
  const [a, hl, b] = splitHighlight(c.hook, c.highlight);

  const size = fit(c.hook, 120, 1400);
  const PH = size * 1.75, PW = textWidth(c.hook, size) + PH * 1.05;
  const dot = p(t, 0, 0.28);
  const spread = p(t, 0.18, 0.62);
  const pw0 = mix(PH * dot, PW, spread), ph0 = PH * dot;
  const textIn = p(t, 0.45, 0.8);

  const WH = Math.min(860, 1500 / c.ratio), WW = WH * c.ratio;
  const open = q(t, openAt, openAt + 0.7);
  const w = mix(pw0, WW, open), h = mix(ph0, WH, open);
  const cy = mix(540, 70 + WH / 2, open);
  const r = mix(ph0 / 2, S.radius, clamp(open * 1.3));
  const textOut = q(t, openAt - 0.05, openAt + 0.2);
  const media = p(t, openAt + 0.15, openAt + 0.6);

  const s2 = Math.min(84, size * 0.72);
  const P2H = s2 * 1.62, P2W = textWidth(c.hook, s2) + P2H * 1.05;
  const back = p(t, backAt, backAt + 0.45);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        {ph0 > 0.5 && (
          <div style={{
            position: 'absolute', left: 960 - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: r, overflow: 'hidden',
            background: S.dark, boxShadow: open > 0.5 ? S.shadow : S.capsuleShadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {media > 0 && (
              <div style={{ position: 'absolute', left: (w - WW) / 2, top: (h - WH) / 2, width: WW, height: WH, opacity: media }}>
                <Media src={c.src} start={c.start} box={{ x: 0, y: 0, w: WW, h: WH }} radius={0} />
              </div>
            )}
            {textOut < 1 && (
              <span style={{
                ...textBase(size, 400), color: '#fff', opacity: textIn * (1 - textOut),
                transform: `translateY(${(1 - textIn) * 26 - textOut * 40}px)`,
              }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
            )}
          </div>
        )}
        {back > 0 && (
          <div style={{
            position: 'absolute', left: 960 - P2W / 2, top: 70 + WH - P2H * 0.45, width: P2W, height: P2H, borderRadius: P2H / 2,
            background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: clamp(back * 4), transform: `translateY(${(1 - back) * 40}px) scale(${mix(1.1, 1, back)})`,
          }}>
            <span style={{ ...textBase(s2, 400), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
          </div>
        )}
      </Handoff>
    </Frame>
  );
}
