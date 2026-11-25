// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T06b-MythFlip.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：反常识（正版 T06b）：常见说法写在白卡上 → 一条墨线从左到右逐行划掉它（字同时退灰）→
// 白卡缩小上移留作对照，真实答案装进黑胶囊从下方落定，答案里一处关键词染紫。
// 与近名件区别：库内 YangPriceLand（正版 T14c）是价格划掉＋差额胶囊；本件是「整句常识被划掉 → 退为对照，答案另起一层落定」，不是重复集成。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/springAt/cueAt/textWidth 与 Frame/Handoff/Pill/Surface 已内嵌移植，逻辑与原版一致；
// 原包默认示例已换中性示例。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  radius: 24, capsuleShadow: '30px 22px 25px #0005', shadow: '0 16px 25px 0 rgba(0,0,0,0.1333)',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, v: number) => a + (b - a) * v;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const q = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * (3 - 2 * v); };
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
const cueAt = (cues: readonly number[] | undefined, i: number, fb: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fb;
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900): React.CSSProperties => ({
  fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
type Box = { x: number; y: number; w: number; h: number };
function Frame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const { width } = useVideoConfig();
  return <AbsoluteFill style={{
    background: dark ? S.dark : '#fff', overflow: 'hidden', fontFamily: FONT,
    fontWeight: 500, fontSynthesis: 'none', color: dark ? '#fff' : S.ink,
  }}>
    <div style={{ position: 'absolute', width: 1920, height: 1080, transform: `scale(${width / 1920})`, transformOrigin: '0 0', overflow: 'hidden' }}>
      {children}
    </div>
  </AbsoluteFill>;
}
export type YangEnter = 'cut' | 'fade' | 'rise' | 'grow';
export type YangExit = 'none' | 'recede' | 'fade' | 'cut' | 'slide-left' | 'slide-up';
export type YangHandoffProps = { enter?: YangEnter; exit?: YangExit; exitAt?: number };
function Handoff({ enter = 'cut', exit = 'none', enterAt = 0, enterDur = 0.45, exitAt, exitDur = 0.5, children }: {
  enter?: YangEnter; exit?: YangExit; enterAt?: number; enterDur?: number; exitAt?: number; exitDur?: number; children: React.ReactNode;
}) {
  const t = useT();
  const { durationInFrames, fps } = useVideoConfig();
  const at = exitAt ?? durationInFrames / fps - exitDur;
  const v = enter === 'cut' ? 1 : Math.max(0, Math.min(1, (t - enterAt) / enterDur));
  const e = 1 - Math.pow(1 - v, 3);
  const x = exit === 'none' ? 0 : exit === 'cut' ? (t >= at ? 1 : 0) : Math.max(0, Math.min(1, (t - at) / exitDur));
  const xs = x * x * (3 - 2 * x);
  let opacity = enter === 'cut' ? 1 : e;
  let transform = '';
  let filter = '';
  if (enter === 'rise') transform += `translateY(${(1 - e) * 40}px) `;
  if (enter === 'grow') transform += `scale(${mix(0.94, 1, e)}) `;
  if (exit === 'recede') { transform += `scale(${mix(1, 0.92, xs)}) `; filter = `blur(${xs * 14}px)`; opacity *= 1 - xs; }
  if (exit === 'fade' || exit === 'cut') opacity *= 1 - xs;
  if (exit === 'slide-left') transform += `translateX(${-xs * 1100}px) `;
  if (exit === 'slide-up') transform += `translateY(${-xs * 700}px) `;
  if (exit === 'slide-left' || exit === 'slide-up') opacity *= 1 - xs * 0.9;
  return <div style={{ position: 'absolute', inset: 0, opacity, transform: transform || undefined, filter: filter || undefined, transformOrigin: '960px 540px' }}>{children}</div>;
}
function Pill({ box, style, children }: { box: Box; style?: React.CSSProperties; children?: React.ReactNode }) {
  return <div style={{
    position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.h / 2,
    background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
  }}>{children}</div>;
}
function Surface({ box, style, children }: { box: Box; style?: React.CSSProperties; children?: React.ReactNode }) {
  return <div style={{
    position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: S.radius,
    background: '#fff', boxShadow: S.shadow, ...style,
  }}>{children}</div>;
}

export type YangMythFlipProps = YangHandoffProps & {
  myth: string;         // 大家以为的说法
  truth: string;        // 真实答案
  highlight: string;    // truth 里染紫的词（深底 #D6BEFF），留空不强调
  cues?: number[];      // [0]=开始划掉，[1]=答案落定
};

export const yangMythFlipDefaults: YangMythFlipProps = {
  myth: '资料越多，找起来越方便',
  truth: '分类放好，才是真的方便',
  highlight: '分类放好',
};

function splitLines(text: string, lines: number): string[] {
  if (lines <= 1) return [text];
  const chars = Array.from(text);
  const total = textWidth(text, 1);
  const out: string[] = [];
  let start = 0;
  for (let k = 1; k < lines; k++) {
    const target = (total * k) / lines;
    let acc = textWidth(chars.slice(0, start).join(''), 1), best = start + 1, bestScore = Infinity;
    for (let i = start + 1; i < chars.length; i++) {
      acc += textWidth(chars[i - 1], 1);
      const brk = /[，,、：:；; ]/.test(chars[i - 1]) ? -2.5 : 0;
      const score = Math.abs(acc - target) + brk;
      if (score < bestScore) { bestScore = score; best = i; }
    }
    out.push(chars.slice(start, best).join('').trim());
    start = best;
  }
  out.push(chars.slice(start).join('').trim());
  return out.filter(Boolean);
}

const PAD_X = 100, PAD_Y = 78;

export const YangMythFlip: React.FC<Partial<YangMythFlipProps>> = (props) => {
  const c = { ...yangMythFlipDefaults, ...props };
  const t = useT();
  const strikeAt = cueAt(c.cues, 0, 1.25);
  const flipAt = cueAt(c.cues, 1, 2.35);

  const mUnits = Math.max(1, textWidth(c.myth, 1));
  const mLines = Math.min(128, 1440 / mUnits) >= 96 ? [c.myth] : splitLines(c.myth, 2);
  const mLineUnits = Math.max(1, ...mLines.map((l) => textWidth(l, 1)));
  const mSize = Math.min(128, 1440 / mLineUnits);
  const mLH = mSize * 1.3;
  const cardW = mLineUnits * mSize + PAD_X * 2;
  const cardH = mLines.length * mLH - (mLH - mSize * 1.16) + PAD_Y * 2;

  const tUnits = Math.max(1, textWidth(c.truth, 1));
  const tSize = Math.min(124, 1500 / tUnits);
  const pillH = tSize * 1.86;
  const pillW = textWidth(c.truth, tSize) + tSize * 1.5;

  const S1 = 0.72, GAP = 56;
  const blockH = cardH * S1 + GAP + pillH;
  const cardCy1 = 540 - blockH / 2 + (cardH * S1) / 2;
  const pillY1 = 540 - blockH / 2 + cardH * S1 + GAP;

  const enter = p(t, 0, 0.4);
  const move = q(t, flipAt, flipAt + 0.55);
  const scale = mix(1, S1, move) * mix(0.92, 1, enter);
  const cardCy = mix(540, cardCy1, move) + (1 - enter) * 40;
  const drop = springAt(t, flipAt + 0.2, 0.7);
  const dropVis = clamp((t - flipAt - 0.2) / 0.16);

  const per = 0.5 / mLines.length;
  const strikeOf = (i: number) => p(t, strikeAt + i * per, strikeAt + (i + 1) * per + 0.08);
  const thick = Math.max(7, mSize * 0.075);

  const [tb, ta = ''] = c.highlight && c.truth.includes(c.highlight) ? c.truth.split(c.highlight) : [c.truth];
  const hasHl = !!c.highlight && c.truth.includes(c.highlight);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <Surface box={{ x: 960 - cardW / 2, y: cardCy - cardH / 2, w: cardW, h: cardH }}
        style={{ transform: `scale(${scale})`, opacity: clamp(enter * 1.6), overflow: 'visible' }}>
        {mLines.map((l, i) => {
          const s = strikeOf(i);
          const w = textWidth(l, mSize);
          return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: PAD_Y + i * mLH, height: mSize * 1.16, display: 'flex', justifyContent: 'center' }}>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ ...textBase(mSize, 900), color: s > 0.35 ? S.faint : S.ink }}>{l}</span>
              <span style={{
                position: 'absolute', left: -mSize * 0.08, top: mSize * 0.6 - thick / 2, height: thick,
                width: (w + mSize * 0.16) * s, background: S.ink, borderRadius: thick / 2,
              }} />
            </span>
          </div>;
        })}
      </Surface>
      {dropVis > 0 && <Pill box={{ x: 960 - pillW / 2, y: pillY1 + (1 - drop) * 90, w: pillW, h: pillH }}
        style={{ opacity: dropVis, transform: `scale(${mix(0.9, 1, clamp(drop))})` }}>
        <span style={{ ...textBase(tSize, 400), color: '#fff' }}>
          {tb}{hasHl && <span style={{ color: S.accentDark }}>{c.highlight}</span>}{ta}
        </span>
      </Pill>}
    </Handoff>
  </Frame>;
};
