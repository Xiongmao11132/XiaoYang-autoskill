/**
 * YangResultFirstHook2 — 成果先行开场·单张主图版（参数化正版 T20a2，T20a 的返修）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source file: fred-wave2-42-20261012/src/components/T20a2-ResultFirstHook.tsx (+ src/kit/{theme.ts,ui.tsx});
 * package publicly released 2026-10-27 on the original's visual library (fred-fu.com/visual-library).
 * Downloaded 2026-11-02 via the site's public asset route, SHA-256 verified against the original
 * member-package manifest (fa5ab7e7…97d63ef, 34,144,141 B) and imported with the original's
 * scripts/assets.py; archive kept at ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-source.zip.
 *
 * Integration notes: Sfx and Brand corner marks are NOT integrated (silent, no watermark);
 * fonts mapped to the library FONT (../src/theme); colors mapped to the library palette.
 * The original's default artwork (the author's own generated pieces) is NOT integrated — pass your own via
 * `media`; empty-string entries render neutral placeholder tiles so the wall mechanics stay
 * verifiable.
 * 与 YangResultFirstHook（T20a）的区别（即返修点）：主角是 media 里的一张单张完整作品
 * （heroIndex 指 media 下标，主角不再是拼版图）；钩子胶囊支持自动折两行——单行装不下时
 * 优先在标点后对半断行、保持大字，关键词高亮跨行定位；另补 Handoff 与 cues 两个控制口
 * （[0]=推近，[1]=胶囊落下）。墙面砸入、推近失焦的骨架与 T20a 相同。
 *
 * Layout: 1920×1080 logical stage, scaled by host width (Frame).
 */
import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { FONT } from '../src/theme';

const S = {
  bg: '#fff',
  ink: '#19191c',
  dark: '#19191c',
  muted: '#83838a',
  faint: '#b9b9bf',
  accent: '#8554E8',
  accentDark: '#D6BEFF',
};

export type Box = { x: number; y: number; w: number; h: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const p = (t: number, a: number, b: number) => easeOut(clamp01((t - a) / (b - a)));
const q = (t: number, a: number, b: number) => easeInOut(clamp01((t - a) / (b - a)));
const quinticRaw = (x: number) => { const v = clamp01(x); return v * v * v * (v * (6 * v - 15) + 10); };
export const quintic = (t: number, a: number, b: number) => quinticRaw((t - a) / (b - a));
export const cueAt = (cues: number[] | undefined, i: number, fallback: number) =>
  cues && cues[i] !== undefined ? cues[i] : fallback;

const isW = (ch: string) => /[一-鿿＀-￯]/.test(ch);
export function textWidth(text: string, size: number) {
  let w = 0;
  for (const ch of text) w += isW(ch) ? 0.94 : 0.56;
  return w * size;
}
const abs = (b: Box): React.CSSProperties => ({ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h });
const textBase = (size: number, weight = 500): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  lineHeight: 1.16,
  letterSpacing: 0,
  whiteSpace: 'nowrap',
});
export const between = (a: Box, b: Box, k: number): Box => ({
  x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k),
});
export function cameraTransform(cx: number, cy: number, zoom: number, k: number) {
  const z = mix(1, zoom, k);
  return `translate(${960 - 960 * z - (cx - 960) * 0.35 * k * z}px, ${540 - 540 * z - (cy - 540) * 0.35 * k * z}px) scale(${z})`;
}

function useT() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
}

function Frame({ children }: { children: React.ReactNode }) {
  const { width } = useVideoConfig();
  const scale = width / 1920;
  return (
    <AbsoluteFill style={{ backgroundColor: S.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
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
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, k * 1.6) * (1 - out), transform: `translateY(${ty}px)`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
      {children}
    </div>
  );
}

const TILE_GRADS = [
  'linear-gradient(135deg, #f3d9a4, #e8a87c)', 'linear-gradient(135deg, #b8d8f8, #7aa7e8)',
  'linear-gradient(135deg, #f6c6d8, #e88bb0)', 'linear-gradient(135deg, #c2ecd4, #74c69d)',
  'linear-gradient(135deg, #ddd6fe, #a78bfa)', 'linear-gradient(135deg, #fde68a, #f59e0b)',
  'linear-gradient(135deg, #bae6fd, #38bdf8)', 'linear-gradient(135deg, #fecaca, #f87171)',
  'linear-gradient(135deg, #d9f99d, #84cc16)', 'linear-gradient(135deg, #fbcfe8, #ec4899)',
  'linear-gradient(135deg, #c7d2fe, #6366f1)', 'linear-gradient(135deg, #99f6e4, #2dd4bf)',
];

function Media({ src, box, radius = 28, label, style }: {
  src: string; box: Box; radius?: number; label?: string; style?: React.CSSProperties;
}) {
  const { fps } = useVideoConfig();
  void fps;
  if (!src) {
    const seed = label ? [...label].reduce((a, ch) => a + ch.charCodeAt(0), 0) : 0;
    return (
      <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', background: TILE_GRADS[seed % TILE_GRADS.length], ...style }}>
        {label && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ ...textBase(Math.min(150, box.h * 0.42), 900), color: 'rgba(255,255,255,0.75)' }}>{label}</span>
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

export type YangResultFirstHook2Props = YangHandoffProps & {
  media: string[];      // public/ 下的图片或视频路径；墙面按顺序循环填满 12 格；空串 = 占位格
  heroIndex: number;    // media 中作为主角放大的那一张（用单张完整作品，不用拼版/三视图）
  hook: string;         // 钩子问题
  highlight: string;    // hook 中要染紫的关键词（找不到则整句白色）
  cues?: number[];      // [0]=镜头推向主作品，[1]=钩子胶囊落下；不传用默认 1.2 / 2.15
};

export const yangResultFirstHook2Defaults: YangResultFirstHook2Props = {
  media: ['', '', '', '', '', '', '', '', '', '', '', ''],
  heroIndex: 2,
  hook: '这一张图，一句话就能做出来？',
  highlight: '一句话',
};

const COLS = 4, ROWS = 3, GAP = 24;
const TW = 424, TH = 238.5;
const X0 = (1920 - (COLS * TW + (COLS - 1) * GAP)) / 2;
const Y0 = 176;
const HERO_SLOT = 6;
const HERO_TARGET: Box = { x: 160, y: 150, w: 1600, h: 900 };

function splitHook(hook: string, maxUnits: number): string[] {
  if (textWidth(hook, 1) <= maxUnits) return [hook];
  const chars = Array.from(hook), half = textWidth(hook, 1) / 2;
  let best = Math.ceil(chars.length / 2), score = Infinity, acc = 0;
  for (let i = 1; i < chars.length; i++) {
    acc += textWidth(chars[i - 1], 1);
    const prev = chars[i - 1];
    const sc = Math.abs(acc - half) + (/[，,、：:；;？?！!]/.test(prev) ? -5 : prev === ' ' ? -1 : 0);
    if (sc < score) { score = sc; best = i; }
  }
  return [chars.slice(0, best).join(''), chars.slice(best).join('')];
}
const slotBox = (k: number): Box => ({ x: X0 + (k % COLS) * (TW + GAP), y: Y0 + Math.floor(k / COLS) * (TH + GAP), w: TW, h: TH });

const RADIUS = 28;
const SHADOW = '0 24px 40px 0 rgba(0,0,0,0.2)';
const CAPSULE_SHADOW = '0 18px 36px 0 rgba(0,0,0,0.3)';

export function YangResultFirstHook2(props: Partial<YangResultFirstHook2Props>) {
  const c = { ...yangResultFirstHook2Defaults, ...props };
  const t = useT();
  const n = COLS * ROWS;
  const hero = ((c.heroIndex % c.media.length) + c.media.length) % c.media.length;
  const others = c.media.filter((_, i) => i !== hero);
  const pool = others.length ? others : c.media;
  const srcFor = (k: number) => (k === HERO_SLOT ? c.media[hero] : pool[(k < HERO_SLOT ? k : k - 1) % pool.length]);

  const order = (k: number) => (COLS - 1 - (k % COLS)) * ROWS + Math.floor(k / COLS);
  const enterAt = (k: number) => 0.02 + order(k) * (4 / 60);
  const enterK = (k: number) => p(t, enterAt(k), enterAt(k) + 0.42);

  const P0 = cueAt(c.cues, 0, 1.2), L0 = Math.max(P0 + 0.55, cueAt(c.cues, 1, 2.15));
  const push = quintic(t, P0, P0 + 0.65);
  const heroBox0 = slotBox(HERO_SLOT);
  const heroGrow = quintic(t, P0, P0 + 0.75);
  const hb = between(heroBox0, HERO_TARGET, heroGrow);
  const he = enterK(HERO_SLOT);
  const camera = cameraTransform(heroBox0.x + TW / 2, heroBox0.y + TH / 2, 1.45, push);

  const MAXW = 1440;
  const lines = splitHook(c.hook, MAXW / 92);
  const lineW = Math.max(1, ...lines.map((l) => textWidth(l, 1)));
  const size = Math.min(120, MAXW / lineW);
  const LH = size * 1.22;
  const padX = size * 0.62;
  const capW = lineW * size + padX * 2, capH = LH * lines.length + size * 0.4;
  const capR = Math.min(capH / 2, lines.length > 1 ? 64 : capH / 2);
  const capY = HERO_TARGET.y + HERO_TARGET.h - capH - 64;
  const land = p(t, L0, L0 + 0.45);
  const w = mix(Math.min(capH, capW), capW, land);
  const textIn = p(t, L0 + 0.15, L0 + 0.6);
  const hiAt = c.highlight ? c.hook.indexOf(c.highlight) : -1;
  const hiEnd = hiAt < 0 ? -1 : hiAt + c.highlight.length;
  let offset = 0;
  const lineSpans = lines.map((l) => {
    const start = c.hook.indexOf(l, offset); offset = start + l.length;
    const a = Math.max(0, Math.min(l.length, hiAt - start)), b = Math.max(0, Math.min(l.length, hiEnd - start));
    return hiAt < 0 ? [l, '', ''] : [l.slice(0, a), l.slice(a, b), l.slice(b)];
  });

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: camera, filter: `blur(${14 * push}px)` }}>
          {Array.from({ length: n }, (_, k) => {
            if (k === HERO_SLOT) return null;
            const e = enterK(k), b = slotBox(k);
            return <Media key={k} src={srcFor(k)} label={String(k + 1).padStart(2, '0')} box={{ ...b, x: b.x + (1 - e) * 340 }} radius={RADIUS}
              style={{ opacity: e, boxShadow: SHADOW }} />;
          })}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.42 * push }} />
        <Media src={srcFor(HERO_SLOT)} label={String(HERO_SLOT + 1).padStart(2, '0')} box={{ ...hb, x: hb.x + (1 - he) * 340 }} radius={RADIUS}
          style={{ opacity: he, boxShadow: heroGrow > 0 ? SHADOW : SHADOW, zIndex: 2 }} />
        {land > 0 && (
          <div style={{
            ...abs({ x: 960 - w / 2, y: capY + (1 - land) * 24, w, h: capH }), borderRadius: capR, background: S.ink,
            boxShadow: CAPSULE_SHADOW, overflow: 'hidden', zIndex: 3, opacity: Math.min(1, land * 3),
          }}>
            <div style={{
              position: 'absolute', left: (w - lineW * size) / 2, width: lineW * size, top: (capH - LH * lines.length) / 2,
              color: '#fff', opacity: textIn, transform: `translateY(${(1 - textIn) * 26}px)`, textAlign: 'center',
            }}>
              {lineSpans.map((sp, i) => (
                <div key={i} style={{ ...textBase(size, 900), lineHeight: `${LH}px` }}>
                  {sp[0]}<span style={{ color: S.accentDark }}>{sp[1]}</span>{sp[2]}
                </div>
              ))}
            </div>
          </div>
        )}
      </Handoff>
    </Frame>
  );
}

export { interpolate };
