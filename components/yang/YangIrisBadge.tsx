/**
 * YangIrisBadge — 黑圆扩散章节过渡（正版 T12l）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T12l-IrisBadge.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S; defaults neutralized.
 *
 * Mechanics: a black dot appears on the white canvas (place `origin` on the previous
 * segment's focus) and bursts into a full-screen black disc; the huge chapter number lands
 * at center, then yields left on the same progress that reveals the label and chapter title
 * line by line on the right — final layout is horizontal （序号｜名字）, unlike YangFlipClock.
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
const CN = '一二三四五六七八九十';
const cnNum = (n: number) => (n <= 10 ? CN[n - 1] : n < 20 ? `十${CN[n - 11]}` : n < 100 ? `${CN[Math.floor(n / 10) - 1]}十${n % 10 ? CN[n % 10 - 1] : ''}` : String(n));
const partLabel = (index: number, label = '') => label || `第${index >= 1 ? cnNum(index) : index}部分`;
const pad2 = (n: number) => String(Math.max(0, Math.round(n))).padStart(2, '0');
const fit = (s: string, max: number, avail: number) => Math.min(max, avail / Math.max(1, textWidth(s, 1)));
function splitTitle(title: string, maxUnits: number): string[] {
  if (textWidth(title, 1) <= maxUnits) return [title];
  const chars = Array.from(title);
  const half = textWidth(title, 1) / 2;
  let best = Math.floor(chars.length / 2), bestScore = Infinity, acc = 0;
  for (let i = 1; i < chars.length; i++) {
    acc += textWidth(chars[i - 1], 1);
    const prev = chars[i - 1];
    const brk = /[，,、：:；; ]/.test(prev) ? -3 : /[的和与]/.test(prev) ? -1.5 : 0;
    const score = Math.abs(acc - half) + brk;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return [chars.slice(0, best).join('').trim(), chars.slice(best).join('').trim()];
}

export type YangIrisBadgeProps = YangHandoffProps & {
  index: number;
  label: string;
  title: string;
  origin: { x: number; y: number };
  cues?: number[];
};

export const yangIrisBadgeDefaults: YangIrisBadgeProps = {
  index: 3,
  label: '',
  title: '示例章节名',
  origin: { x: 960, y: 540 },
};

const NUM = 400, LAB = 54;

export function YangIrisBadge(props: Partial<YangIrisBadgeProps>) {
  const c = { ...yangIrisBadgeDefaults, ...props };
  const t = useT();
  const label = partLabel(c.index, c.label);
  const num = pad2(c.index);

  const at = cueAt(c.cues, 0, 0.14);
  const titleAt = cueAt(c.cues, 1, at + 0.78);

  const dot = p(t, 0, at + 0.02);
  const grow = p(t, at, at + 0.62);
  const ox = c.origin.x, oy = c.origin.y;
  const far = Math.hypot(Math.max(ox, 1920 - ox), Math.max(oy, 1080 - oy)) + 40;
  const r = mix(22 * dot, far, grow);

  const numIn = p(t, at + 0.16, at + 0.6);
  const shift = q(t, titleAt - 0.12, titleAt + 0.36);
  const reveal = titleAt + 0.22;

  const lines = splitTitle(c.title, 900 / 120);
  const tSize = Math.min(150, ...lines.map((l) => fit(l, 150, 960)));
  const numW = textWidth(num, NUM) * 1.04;
  const textW = Math.max(textWidth(label, LAB), ...lines.map((l) => textWidth(l, tSize)));
  const GAP = 90;
  const groupW = numW + GAP + textW;
  const numCx = mix(960, 960 - groupW / 2 + numW / 2, shift);
  const textX = 960 - groupW / 2 + numW + GAP;
  const blockH = LAB * 1.16 + 18 + lines.length * tSize * 1.1;
  const textTop = 540 - blockH / 2;

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{ position: 'absolute', left: ox - r, top: oy - r, width: r * 2, height: r * 2, borderRadius: r, background: S.dark }} />
        <div style={{
          position: 'absolute', left: numCx - numW / 2, top: 540 - NUM * 0.58, width: numW, height: NUM * 1.16, textAlign: 'center',
          ...textBase(NUM, 900), lineHeight: 1.16, color: '#fff', fontVariantNumeric: 'tabular-nums',
          opacity: numIn, transform: `scale(${mix(1.35, 1, numIn)})`,
        }}>{num}</div>
        <div style={{ position: 'absolute', left: textX, top: textTop }}>
          <div style={{ ...textBase(LAB, 600), color: S.accentDark, letterSpacing: 4, clipPath: `inset(0 ${100 * (1 - p(t, reveal, reveal + 0.4))}% 0 0)` }}>{label}</div>
          {lines.map((l, i) => {
            const li = p(t, reveal + 0.06 + i * 0.1, reveal + 0.54 + i * 0.1);
            return (
              <div key={i} style={{ height: tSize * 1.1, overflow: 'hidden', marginTop: i === 0 ? 18 : 0 }}>
                <div style={{ ...textBase(tSize, 400), lineHeight: 1.1, color: '#fff', transform: `translateY(${(1 - li) * tSize * 1.1}px)` }}>{l}</div>
              </div>
            );
          })}
        </div>
      </Handoff>
    </Frame>
  );
}
