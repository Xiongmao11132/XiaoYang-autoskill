/**
 * YangDecode — 解码定格章节过渡（正版 T12q）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T12q-Decode.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S; defaults neutralized.
 *
 * Mechanics: on a dark stage the chapter title's characters scramble rapidly (refreshed
 * 20×/s from a deterministic seeded pool, each character in a fixed-width cell so the line
 * never shifts), then lock in one by one from the left with a small settle scale; meanwhile
 * the chapter number counts up like a counter to the target, and the part label fades in
 * when the last character locks. Fits AI/code/tool chapters.
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
function Frame({ dark = false, children }: { dark?: boolean; children: React.ReactNode }) {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: dark ? S.dark : S.bg, overflow: 'hidden' }}>
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
const rand = (seed: number) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export type YangDecodeProps = YangHandoffProps & {
  index: number;
  label: string;
  title: string;
  pool: string;
  cues?: number[];
};

export const yangDecodeDefaults: YangDecodeProps = {
  index: 4,
  label: '',
  title: '示例章节名',
  pool: '示例章节名解码定格工具自动生成模型代码一键',
};

const LAB = 56, NUM = 120;

export function YangDecode(props: Partial<YangDecodeProps>) {
  const c = { ...yangDecodeDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.55);
  const chars = Array.from(c.title);
  const pool = Array.from(c.pool + c.title).filter((ch) => /[一-鿿]/.test(ch));
  const latinPool = 'ABCDEFGHKMNPRSTUVXZ0123456789';

  const size = fit(c.title, 168, 1600);
  const per = Math.min(0.12, 0.9 / Math.max(1, chars.length));
  const scrambleFrom = 0.12;
  const step = Math.floor(t * 20);

  const lockAt = (i: number) => at + i * per;
  const shown = chars.map((ch, i) => {
    if (ch === ' ' || t >= lockAt(i)) return ch;
    if (t < scrambleFrom + i * 0.03) return '';
    const latin = ch.charCodeAt(0) <= 0xff;
    const src = latin ? Array.from(latinPool) : pool;
    return src[Math.floor(rand(i * 97 + step * 13) * src.length)];
  });

  const doneAt = lockAt(chars.length - 1);
  const cnt = Math.round(c.index * p(t, scrambleFrom, doneAt));
  const num = pad2(cnt);
  const label = partLabel(c.index, c.label);
  const fin = p(t, doneAt, doneAt + 0.35);

  const w = textWidth(c.title, size);
  const y0 = 540 - (NUM + 40 + size * 1.16 + 30 + LAB * 1.16) / 2;
  return (
    <Frame dark>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{
          ...textBase(NUM, 900), lineHeight: 1, position: 'absolute', left: 0, right: 0, top: y0, textAlign: 'center',
          color: S.accentDark, fontVariantNumeric: 'tabular-nums', opacity: p(t, 0, 0.3),
        }}>{num}</div>
        <div style={{ position: 'absolute', left: 960 - w / 2, top: y0 + NUM + 40, display: 'flex' }}>
          {chars.map((ch, i) => {
            const cw = textWidth(ch, size);
            const locked = t >= lockAt(i);
            const k = clamp((t - lockAt(i)) / 0.18);
            return (
              <div key={i} style={{ width: cw, height: size * 1.16, textAlign: 'center' }}>
                <span style={{
                  ...textBase(size, 400), color: locked ? '#fff' : S.faint,
                  display: 'inline-block', transform: `scale(${locked ? 1 + 0.06 * (1 - k) : 0.92})`,
                }}>{shown[i]}</span>
              </div>
            );
          })}
        </div>
        <div style={{
          ...textBase(LAB, 600), position: 'absolute', left: 0, right: 0, top: y0 + NUM + 40 + size * 1.16 + 30, textAlign: 'center',
          color: '#fff', letterSpacing: 4, opacity: fin, transform: `translateY(${(1 - fin) * 16}px)`,
        }}>{label}</div>
      </Handoff>
    </Frame>
  );
}
