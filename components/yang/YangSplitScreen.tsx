/**
 * YangSplitScreen — 黑白分屏章节过渡（正版 T12t）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T12t-SplitScreen.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S; defaults neutralized.
 *
 * Mechanics: a black curtain drops from the top to claim the left `ratio` (0.34–0.46) of
 * the screen; inside it the huge chapter number rolls odometer-style from the previous
 * chapter (only the digits that change roll, vertically). On the white right side the
 * part label slides in and the title wipes in left-to-right, line by line.
 * Layout: 1920×1080 logical stage, scaled by host width (Frame).
 */
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  bg: '#fff', ink: '#19191c', dark: '#19191c', muted: '#83838a', faint: '#b9b9bf',
  accent: '#8554E8', accentDark: '#D6BEFF', radius: 28,
  capsuleShadow: '0 18px 36px 0 rgba(0,0,0,0.3)', shadow: '0 24px 40px 0 rgba(0,0,0,0.2)',
  windowBody: '#212123',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const p = (t: number, a: number, b: number) => easeOut(clamp((t - a) / (b - a)));
const q = (t: number, a: number, b: number) => easeInOut(clamp((t - a) / (b - a)));
const wipe = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
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

export type YangSplitScreenProps = YangHandoffProps & {
  index: number;
  label: string;
  title: string;
  ratio: number;
  cues?: number[];
};

export const yangSplitScreenDefaults: YangSplitScreenProps = {
  index: 3,
  label: '',
  title: '示例章节名',
  ratio: 0.4,
};

const NUM = 360, LAB = 56;

export function YangSplitScreen(props: Partial<YangSplitScreenProps>) {
  const c = { ...yangSplitScreenDefaults, ...props };
  const t = useT();
  const rollAt = cueAt(c.cues, 0, 0.42);
  const titleAt = cueAt(c.cues, 1, rollAt + 0.3);
  const DW = Math.round(1920 * Math.max(0.34, Math.min(0.46, c.ratio)));
  const label = partLabel(c.index, c.label);

  const drop = wipe(t, 0, 0.5);
  const roll = q(t, rollAt, rollAt + 0.55);
  const from = pad2(c.index - 1), to = pad2(c.index);

  const RW = 1920 - DW;
  const lines = splitTitle(c.title, (RW - 240) / 120);
  const tSize = Math.min(160, ...lines.map((l) => fit(l, 160, RW - 240)));
  const blockH = LAB * 1.16 + 22 + lines.length * tSize * 1.1;
  const tx = DW + 120;
  const ty = 540 - blockH / 2;
  const lab = p(t, titleAt, titleAt + 0.4);

  const digitW = textWidth('0', NUM) * 1.08;
  const LH = NUM * 1.05;
  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: DW, height: 1080, background: S.dark, clipPath: `inset(0 0 ${100 * (1 - drop)}% 0)` }}>
          <div style={{ position: 'absolute', left: DW / 2 - digitW, top: 540 - LH / 2, display: 'flex', opacity: p(t, 0.18, 0.45) }}>
            {[0, 1].map((i) => {
              const changes = from[i] !== to[i];
              const y = changes ? -roll * LH : 0;
              return (
                <div key={i} style={{ width: digitW, height: LH, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: y, width: digitW }}>
                    {(changes ? [from[i], to[i]] : [to[i]]).map((d, k) => (
                      <div key={k} style={{ height: LH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ ...textBase(NUM, 900), lineHeight: 1, color: '#fff' }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ position: 'absolute', left: tx, top: ty }}>
          <div style={{ ...textBase(LAB, 600), color: S.accent, letterSpacing: 4, opacity: lab, transform: `translateX(${(1 - lab) * -30}px)` }}>{label}</div>
          {lines.map((l, i) => {
            const e = wipe(t, titleAt + 0.08 + i * 0.1, titleAt + 0.62 + i * 0.1);
            return (
              <div key={i} style={{
                ...textBase(tSize, 400), lineHeight: 1.1, color: S.ink, marginTop: i === 0 ? 22 : 0,
                clipPath: `inset(0 ${100 * (1 - e)}% 0 0)`, transform: `translateX(${(1 - e) * -40}px)`,
              }}>{l}</div>
            );
          })}
        </div>
      </Handoff>
    </Frame>
  );
}
