/**
 * YangAvatarAsk — 头像发问开场（正版 T20n）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: fred-chapter-transitions-20-20261014/src/components/T20n-AvatarAsk.tsx (+ kit + _shared);
 * package publicly released 2026-10-28; downloaded/imported 2026-11-02 (see YangFlipClock header).
 * Integration notes: Sfx/Brand NOT integrated; fonts → library FONT; colors → local S.
 * the original's own avatar photo is NOT integrated — pass the presenter's avatar via `avatar`
 * (with `face` = face position 0–1 and `zoom`); an empty string renders a neutral
 * placeholder disc.
 *
 * Mechanics: the presenter's round avatar pops in from the lower-left; beside it a black
 * speech bubble wipes open and types the question character by character — the full line
 * is laid out from the start with untyped characters transparent, so nothing shifts.
 * When typing completes, the row lifts and the "answer" capsule slams in below: the
 * answer IS this episode's topic.
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

export type YangAvatarAskProps = YangHandoffProps & {
  avatar: string;
  face: { x: number; y: number };
  zoom: number;
  question: string;
  answer: string;
  highlight: string;
  cues?: number[];
};

export const yangAvatarAskDefaults: YangAvatarAskProps = {
  avatar: '',
  face: { x: 0.5, y: 0.4 },
  zoom: 1.6,
  question: '你还在重复做这件事吗？',
  answer: '这期给你一个新做法',
  highlight: '新做法',
};

const AV = 250;

export function YangAvatarAsk(props: Partial<YangAvatarAskProps>) {
  const c = { ...yangAvatarAskDefaults, ...props };
  const t = useT();
  const typeAt = cueAt(c.cues, 0, 0.55);
  const chars = Array.from(c.question);
  const typeEnd = typeAt + Math.min(1.3, chars.length * 0.1);
  const ansAt = cueAt(c.cues, 1, typeEnd + 0.35);

  const qs = fit(c.question, 96, 1200);
  const BH = qs * 1.9, BW = textWidth(c.question, qs) + BH * 0.9;
  const rowW = AV + 40 + BW;
  const rowX = 960 - rowW / 2;
  const as = fit(c.answer, 120, 1500);
  const AH = as * 1.7, AW = textWidth(c.answer, as) + AH * 1.05;
  const ans = p(t, ansAt, ansAt + 0.38);
  const lift = q(t, ansAt - 0.1, ansAt + 0.35);
  const rowY = mix(540, 360, lift);
  const ansY = 360 + AV / 2 + 90;

  const av = p(t, 0, 0.45);
  const bub = p(t, typeAt - 0.2, typeAt + 0.15);
  const shown = Math.floor(clamp((t - typeAt) / Math.max(0.01, typeEnd - typeAt)) * chars.length);
  const [a, hl, b] = splitHighlight(c.answer, c.highlight);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{
          position: 'absolute', left: rowX, top: rowY - AV / 2, width: AV, height: AV, borderRadius: AV / 2, overflow: 'hidden',
          boxShadow: S.shadow, opacity: clamp(av * 2), transform: `translate(${(1 - av) * -60}px, ${(1 - av) * 120}px) scale(${mix(0.7, 1, av)})`,
          background: 'linear-gradient(150deg, #ddd6fe, #a78bfa)',
        }}>
          {c.avatar
            ? <Img src={staticFile(c.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${c.zoom})`, transformOrigin: `${c.face.x * 100}% ${c.face.y * 100}%` }} />
            : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ ...textBase(64, 900), color: 'rgba(255,255,255,0.85)' }}>头像</span>
              </div>
            )}
        </div>
        {bub > 0 && (
          <div style={{
            position: 'absolute', left: rowX + AV + 40, top: rowY - BH / 2, width: BW, height: BH, borderRadius: BH / 2,
            background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', paddingLeft: BH * 0.45,
            clipPath: `inset(0 ${100 * (1 - bub)}% 0 0 round ${BH / 2}px)`,
          }}>
            <span style={{ ...textBase(qs, 900), color: '#fff' }}>
              {chars.map((ch, i) => <span key={i} style={{ color: i < shown ? '#fff' : 'transparent' }}>{ch}</span>)}
            </span>
          </div>
        )}
        {ans > 0 && (
          <div style={{
            position: 'absolute', left: 960 - AW / 2, top: ansY, width: AW, height: AH, borderRadius: AH / 2,
            background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: clamp(ans * 2), transform: `translateY(${(1 - ans) * -40}px) scale(${mix(1.14, 1, ans)})`,
          }}>
            <span style={{ ...textBase(as, 400), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
          </div>
        )}
      </Handoff>
    </Frame>
  );
}
