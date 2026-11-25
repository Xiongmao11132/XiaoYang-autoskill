/**
 * YangMergeHalves — 左右合拢章节过渡（正版 T12s）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T12s-MergeHalves.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S; defaults neutralized.
 *
 * Mechanics: the chapter number (a black disc) rushes in from the left and the title
 * capsule from the right, both ease-IN — accelerating into contact, stopping dead at
 * `hit` with no bounce; they merge into one wide capsule (number nested in its round left
 * end). At contact the whole assembly squashes 3% horizontally for 0.16s, once; the part
 * label then rises above the capsule.
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
const easeIn = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * v; };

export type YangMergeHalvesProps = YangHandoffProps & {
  index: number;
  label: string;
  title: string;
  cues?: number[];
};

export const yangMergeHalvesDefaults: YangMergeHalvesProps = {
  index: 2,
  label: '',
  title: '示例章节名',
};

const H = 230, NUM = 112, LAB = 54;

export function YangMergeHalves(props: Partial<YangMergeHalvesProps>) {
  const c = { ...yangMergeHalvesDefaults, ...props };
  const t = useT();
  const hit = cueAt(c.cues, 0, 0.58);
  const num = pad2(c.index), label = partLabel(c.index, c.label);

  const size = fit(c.title, 140, 1720 - H - 160);
  const pillW = textWidth(c.title, size) + H * 0.62 + H / 2;
  const W = H + pillW - H / 2;
  const left = 960 - W / 2;
  const circX = left, pillX = left + H / 2;

  const go = easeIn(t, 0, hit);
  const cx0 = -H * 0.6, px0 = 1920 - H * 0.4;
  const circLeft = mix(cx0, circX, go);
  const pillLeft = mix(px0, pillX, go);
  const sq = t >= hit ? 1 - 0.03 * Math.max(0, 1 - (t - hit) / 0.16) : 1;
  const lab = p(t, hit + 0.12, hit + 0.5);
  const top = 540 - H / 2 + 30;

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{ position: 'absolute', inset: 0, transform: `scaleX(${sq})`, transformOrigin: '960px 540px' }}>
          <div style={{
            position: 'absolute', left: pillLeft, top, width: pillW, height: H, borderRadius: H / 2, background: S.dark,
            boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: H * 0.31,
          }}>
            <span style={{ ...textBase(size, 400), color: '#fff' }}>{c.title}</span>
          </div>
          <div style={{
            position: 'absolute', left: circLeft, top, width: H, height: H, borderRadius: H / 2, background: S.dark,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: S.capsuleShadow,
          }}>
            <span style={{ ...textBase(NUM, 900), color: S.accentDark, fontVariantNumeric: 'tabular-nums' }}>{num}</span>
          </div>
        </div>
        <div style={{
          ...textBase(LAB, 600), position: 'absolute', left: 0, right: 0, top: top - LAB * 1.16 - 30, textAlign: 'center',
          color: S.accent, letterSpacing: 4, opacity: lab, transform: `translateY(${(1 - lab) * 18}px)`,
        }}>{label}</div>
      </Handoff>
    </Frame>
  );
}
