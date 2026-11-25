/**
 * YangFrostedFactPro — 毛玻璃要点卡（参数化正版 T08i）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source file: fred-wave3-extra2-20261012/src/components/T08i-FrostedFact.tsx (+ src/kit/{theme.ts,ui.tsx});
 * package publicly released 2026-10-27 on the original author's visual library (fred-fu.com/visual-library).
 * Downloaded 2026-11-02 via the site's public asset route, SHA-256 verified against the FredTalk
 * member-package manifest (a0123e50…c22141, 34,010,126 B) and imported with FredTalk's
 * scripts/assets.py; archive kept at ~/workspace/tools/FredTalk/downloads-b/fred-wave3-extra2-source.zip.
 *
 * Integration notes: Sfx and Brand corner marks are NOT integrated (silent, no watermark);
 * fonts mapped to the library FONT (../src/theme); colors mapped to the library palette
 * (ink/muted/accent). 原版默认录制素材（第 114 期录屏）is NOT
 * integrated — pass your own recording/screenshot via `media`; an empty string renders a
 * neutral placeholder surface so the glass mechanics stay verifiable.
 * 与 A 类提炼件 YangFrostedFactCard 并行不互替：本件是录屏退后 + 玻璃卡透出正后方同一段画面
 * （重度模糊 + 白雾、随卡片位置实时对齐）的正版实现；提炼件是深色玻璃卡 + 静态模糊背景层，
 * 结构不同、不要混用结论。
 *
 * Mechanics: the full-screen recording recedes (slight blur + darken + 1.02 scale) but stays
 * recognizable; a frosted-glass card rises from below — inside the card is the SAME recording
 * region behind the card, heavily blurred with a white veil, aligned live to the card's
 * position, so light and motion keep flowing through the glass while the recording scrolls.
 * The big fact line wipes in left→right with the keyword in accent; a smaller note rises below.
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
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const p = (t: number, a: number, b: number) => easeOut(clamp01((t - a) / (b - a)));
export const q = (t: number, a: number, b: number) => easeInOut(clamp01((t - a) / (b - a)));
export const cueAt = (cues: number[] | undefined, i: number, fallback: number) =>
  cues && cues[i] !== undefined ? cues[i] : fallback;

const isW = (ch: string) => /[一-鿿＀-￯]/.test(ch);
export function textWidth(text: string, size: number) {
  let w = 0;
  for (const ch of text) w += isW(ch) ? 1 : 0.56;
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

function Media({ src, box, radius = 28, start = 0, style }: {
  src: string; box: Box; radius?: number; start?: number; style?: React.CSSProperties;
}) {
  const { fps } = useVideoConfig();
  if (!src) {
    return (
      <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', background: 'linear-gradient(135deg, #dfe3ea 0%, #c3c9d4 55%, #aeb6c4 100%)', ...style }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...textBase(44, 500), color: 'rgba(70,78,92,0.55)' }}>录屏画面</span>
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

export type YangFrostedFactProProps = YangHandoffProps & {
  media: string;        // 录屏视频或截图（铺满画面）；空串 = 中性占位面
  start?: number;       // 视频起播秒数
  fact: string;         // 关键事实（大字，一行）
  highlight: string;    // fact 里染紫的词
  note?: string;        // 小注（可留空）
  cues?: number[];      // [0]=画面退后，[1]=玻璃卡浮起
};

export const yangFrostedFactProDefaults: YangFrostedFactProProps = {
  media: '',
  start: 0,
  fact: '关键结论先看这一行',
  highlight: '这一行',
  note: '其余细节都在退后的画面里',
};

const RADIUS = 36;
const PAD_X = 92, PAD_TOP = 70, PAD_BOTTOM = 74, NOTE_GAP = 26;

export function YangFrostedFactPro(props: Partial<YangFrostedFactProProps>) {
  const c = { ...yangFrostedFactProDefaults, ...props };
  const t = useT();

  const fSize = Math.min(104, 1320 / Math.max(1, textWidth(c.fact, 1)));
  const nSize = c.note ? Math.min(46, 1320 / Math.max(1, textWidth(c.note, 1))) : 0;
  const fW = textWidth(c.fact, fSize), nW = c.note ? textWidth(c.note, nSize) : 0;
  const innerW = Math.max(fW, nW);
  const cardW = Math.max(760, innerW + PAD_X * 2);
  const cardH = PAD_TOP + fSize * 1.16 + (c.note ? NOTE_GAP + nSize * 1.16 : 0) + PAD_BOTTOM;
  const cx = 960, cy = 488;
  const card = { x: cx - cardW / 2, y: cy - cardH / 2, w: cardW, h: cardH };

  const recedeAt = cueAt(c.cues, 0, 0.45);
  const riseAt = cueAt(c.cues, 1, recedeAt + 0.25);
  const recede = q(t, recedeAt, recedeAt + 0.6);
  const rise = p(t, riseAt, riseAt + 0.7);
  const frost = q(t, riseAt, riseAt + 0.55);
  const factIn = p(t, riseAt + 0.3, riseAt + 0.85);
  const noteIn = p(t, riseAt + 0.6, riseAt + 1.05);

  const dy = (1 - rise) * 90;
  const sc = mix(0.94, 1, rise);
  const live = { ...card, y: card.y + dy };

  const hl = c.highlight && c.fact.includes(c.highlight) ? c.highlight : '';
  const [pre, post = ''] = hl ? c.fact.split(hl) : [c.fact];

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <div style={{ position: 'absolute', inset: 0, filter: recede > 0.01 ? `blur(${6 * recede}px)` : undefined, transform: `scale(${mix(1, 1.02, recede)})` }}>
          <Media src={c.media} box={{ x: 0, y: 0, w: 1920, h: 1080 }} radius={0} start={c.start ?? 0} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0.34 * recede }} />

        {rise > 0 && (
          <div style={{
            ...abs(live), borderRadius: RADIUS, overflow: 'hidden', opacity: Math.max(0, Math.min(1, rise * 2.2)),
            transform: `scale(${sc})`, transformOrigin: '50% 60%',
            boxShadow: '0 30px 60px 0 rgba(0,0,0,0.16), 0 16px 25px 0 rgba(0,0,0,0.1333333333)',
          }}>
            <div style={{ position: 'absolute', left: -live.x - 40, top: -live.y - 40, width: 2000, height: 1160, filter: `blur(${mix(4, 15, frost)}px)` }}>
              <Media src={c.media} box={{ x: 40, y: 40, w: 1920, h: 1080 }} radius={0} start={c.start ?? 0}
                style={{ transform: `scale(${mix(1, 1.02, recede)})`, transformOrigin: `${960 + 40}px ${540 + 40}px` }} />
            </div>
            <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: mix(0.2, 0.5, frost) }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '46%', background: 'linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0))' }} />

            <div style={{
              position: 'absolute', left: (cardW - fW) / 2, top: PAD_TOP, width: fW + fSize * 0.2,
              clipPath: `inset(-10% ${100 * (1 - factIn)}% -10% 0)`, transform: `translateX(${(1 - factIn) * 24}px)`,
            }}>
              <span style={{ ...textBase(fSize, 900), color: S.ink }}>
                {pre}{hl && <span style={{ color: S.accent }}>{hl}</span>}{post}
              </span>
            </div>
            {c.note && (
              <div style={{
                position: 'absolute', left: (cardW - nW) / 2, top: PAD_TOP + fSize * 1.16 + NOTE_GAP,
                opacity: noteIn, transform: `translateY(${(1 - noteIn) * 16}px)`,
              }}>
                <span style={{ ...textBase(nSize, 500), color: S.muted }}>{c.note}</span>
              </div>
            )}
          </div>
        )}
      </Handoff>
    </Frame>
  );
}

export { interpolate };
