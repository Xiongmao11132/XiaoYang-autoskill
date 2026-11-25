/**
 * YangZoomThrough — 穿过序号章节过渡（正版 T12o）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T12o-ZoomThrough.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S; defaults neutralized.
 *
 * Mechanics: a giant black chapter number settles in (part label above). On cue the camera
 * pushes — log-interpolated (zoomMix) so the speed feels uniform — straight through the
 * counter of the digit "0" (or the gap between digits when there is no 0). Waiting inside
 * the counter, at world scale 1/22, is this chapter's black capsule (number + title); at
 * full push it is exactly 1:1. One continuous world, no cut.
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
function Pill({ box, style, children }: { box: Box; style?: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <div style={{
      ...abs(box), borderRadius: Math.min(box.w, box.h) / 2, background: S.dark, boxShadow: S.capsuleShadow,
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>{children}</div>
  );
}
const CN = '一二三四五六七八九十';
const cnNum = (n: number) => (n <= 10 ? CN[n - 1] : n < 20 ? `十${CN[n - 11]}` : n < 100 ? `${CN[Math.floor(n / 10) - 1]}十${n % 10 ? CN[n % 10 - 1] : ''}` : String(n));
const partLabel = (index: number, label = '') => label || `第${index >= 1 ? cnNum(index) : index}部分`;
const pad2 = (n: number) => String(Math.max(0, Math.round(n))).padStart(2, '0');
const fit = (s: string, max: number, avail: number) => Math.min(max, avail / Math.max(1, textWidth(s, 1)));
const zoomMix = (a: number, b: number, e: number) => Math.exp(mix(Math.log(a), Math.log(b), clamp(e)));

export type YangZoomThroughProps = YangHandoffProps & {
  index: number;
  label: string;
  title: string;
  cues?: number[];
};

export const yangZoomThroughDefaults: YangZoomThroughProps = {
  index: 2,
  label: '',
  title: '示例章节名',
};

const NUM = 640, DW = NUM * 0.66, ZEND = 22;
const GLYPH_CY = 0.5;

export function YangZoomThrough(props: Partial<YangZoomThroughProps>) {
  const c = { ...yangZoomThroughDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.78);
  const num = pad2(c.index);
  const label = partLabel(c.index, c.label);

  const digits = Array.from(num);
  const groupW = DW * digits.length;
  const top = 540 - NUM / 2 + 40;
  const zi = digits.indexOf('0');
  const hx = zi >= 0 ? 960 - groupW / 2 + DW * (zi + 0.5) : 960;
  const hy = top + NUM * GLYPH_CY;

  const numIn = p(t, 0, 0.42);
  const labIn = p(t, 0.18, 0.55);
  const e = quintic(t, at, at + 0.95);
  const z = zoomMix(1, ZEND, e);
  const sx = mix(hx, 960, e), sy = mix(hy, 540, e);
  const cam = `translate(${sx}px, ${sy}px) scale(${z}) translate(${-hx}px, ${-hy}px)`;

  const PH = 230, size = fit(c.title, 132, 1260), NS = 104;
  const PW = Math.max(760, textWidth(num, NS) + 44 + textWidth(c.title, size) + PH * 0.9);
  const pillIn = p(t, at + 0.35, at + 0.7);
  const labOut = p(t, at, at + 0.3);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{ position: 'absolute', inset: 0, transform: cam, transformOrigin: '0 0' }}>
          <div style={{
            ...textBase(54, 600), position: 'absolute', left: 0, width: 1920, top: top - 70, textAlign: 'center', color: S.accent, letterSpacing: 4,
            opacity: labIn * (1 - labOut), transform: `translateY(${(1 - labIn) * 16}px)`,
          }}>{label}</div>
          <div style={{
            position: 'absolute', left: 960 - groupW / 2, top, display: 'flex', opacity: numIn,
            transform: `scale(${mix(0.86, 1, numIn)})`, transformOrigin: `${groupW / 2}px ${NUM / 2}px`,
          }}>
            {digits.map((d, i) => (
              <div key={i} style={{ width: DW, height: NUM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ ...textBase(NUM, 900), lineHeight: 1, color: S.ink }}>{d}</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', left: hx, top: hy, transform: `scale(${1 / ZEND})`, transformOrigin: '0 0', opacity: pillIn }}>
            <Pill box={{ x: -PW / 2, y: -PH / 2, w: PW, h: PH }}>
              <span style={{ ...textBase(NS, 900), color: S.accentDark, marginRight: 44 }}>{num}</span>
              <span style={{ ...textBase(size, 400), color: '#fff' }}>{c.title}</span>
            </Pill>
          </div>
        </div>
      </Handoff>
    </Frame>
  );
}
