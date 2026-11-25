// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T01f-DotToLine.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：圆点胀成关键句胶囊（正版 T01f，升级自 L81-T03，快过渡）：圆点长成圆 → 横向展开带一次过冲（约 5.5%）→
// 字从左到右分组亮起，一处关键词染紫；单行字号放不下（<112px）自动折成两行。
// 与近名件区别：库内 A 类 YangCapsuleKeyword 是静态胶囊句＋黄铜高亮，没有圆点生长过程；
// YangConditionCapsule（正版 T01e）是胶囊逐字打条件再延长补段；本件的主动作是「点 → 句」的生长转场，不是重复集成。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/spring 系辅助与 Frame/Handoff/Pill 已内嵌移植，逻辑与原版一致；
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
const cueAt = (cues: readonly number[] | undefined, i: number, fb: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fb;
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
const accentOn = (dark: boolean) => (dark ? '#D6BEFF' : '#8554E8');
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

export type YangDotToLineProps = YangHandoffProps & {
  text: string;       // 关键句；太长会自动折成两行（也可用 \n 指定断行）
  highlight: string;  // 句中染紫的一处关键词（黑胶囊上用 #D6BEFF）；留空则不染
  cues?: number[];    // [0]=圆点出现，[1]=横向展开成句
};

export const yangDotToLineDefaults: YangDotToLineProps = {
  text: '先把重复的事交出去',
  highlight: '交出去',
};

const overshoot = (t: number, a: number, rise: number, settle: number, amount: number) =>
  p(t, a, a + rise) * (1 + amount) - amount * q(t, a + rise, a + rise + settle);

const PUNCT = /[，,、。：:；;！!？?]/;
const trimEnd = (l: string) => l.trim().replace(/[，,、。：:；;]+$/, '');
const splitTwo = (s: string): string[] => {
  if (s.includes('\n')) return s.split('\n').slice(0, 2).map(trimEnd);
  const chars = Array.from(s);
  const total = textWidth(s, 1);
  let best = Math.ceil(chars.length / 2), bestScore = Infinity, acc = 0;
  for (let i = 1; i < chars.length; i++) {
    acc += textWidth(chars[i - 1], 1);
    if (PUNCT.test(chars[i])) continue;
    const soft = /[，,、：:；; ]/.test(chars[i - 1]) ? -1.6 : 0;
    const score = Math.abs(acc - total / 2) + soft;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return [trimEnd(chars.slice(0, best).join('')), trimEnd(chars.slice(best).join(''))];
};

const MAX_W = 1640;
const PAD = 1.3;

export const YangDotToLine: React.FC<Partial<YangDotToLineProps>> = (props) => {
  const c = { ...yangDotToLineDefaults, ...props };
  const t = useT();

  let lines = c.text.includes('\n') ? splitTwo(c.text) : [c.text];
  const widest = (ls: string[]) => Math.max(...ls.map((l) => textWidth(l, 1)));
  const fit1 = (ls: string[]) => Math.min(165, MAX_W / (widest(ls) + PAD));
  const fit2 = (ls: string[]) => Math.min(132, MAX_W / (widest(ls) + 3.22 * 0.72));
  let size = lines.length > 1 ? fit2(lines) : fit1(lines);
  if (lines.length === 1 && size < 112 && Array.from(c.text).length > 3) { lines = splitTwo(c.text); size = fit2(lines); }
  const two = lines.length > 1;
  const H = two ? size * 1.16 * 2 + size * 0.9 : size * 2.1;
  const W = Math.max(H * 1.9, widest(lines) * size + (two ? H * 0.72 : PAD * size));
  const D = Math.min(330, H * 0.92);

  const a0 = cueAt(c.cues, 0, 0.03);
  const a1 = cueAt(c.cues, 1, Math.max(a0 + 0.62, 0.72));
  const grow = overshoot(t, a0, 0.56, 0.14, 0.03);
  const open = overshoot(t, a1, 0.55, 0.3, 0.055);
  const tall = p(t, a1, a1 + 0.8);
  const w = mix(D * grow, W, open);
  const h = mix(D * grow, H, tall);
  const textAt = a1 + 0.34;

  const chars = lines.map((l) => Array.from(l));
  const total = chars.reduce((n, l) => n + l.length, 0);
  const step = Math.min(0.045, 0.42 / Math.max(1, total));
  const hl = c.highlight && c.text.includes(c.highlight) ? c.highlight : '';
  let k = 0;
  const renderLine = (line: string, li: number) => {
    const arr = Array.from(line);
    const mark = new Array(arr.length).fill(false);
    if (hl) {
      const at = line.indexOf(hl);
      if (at >= 0) { const s0 = Array.from(line.slice(0, at)).length; for (let i = 0; i < Array.from(hl).length; i++) mark[s0 + i] = true; }
    }
    return <div key={li} style={{ ...textBase(size, 900), color: '#fff', textAlign: 'center' }}>
      {arr.map((ch, i) => {
        const i0 = k++;
        const o = p(t, textAt + i0 * step, textAt + i0 * step + 0.22);
        return <span key={i} style={{ opacity: o, color: mark[i] ? accentOn(true) : '#fff' }}>{ch}</span>;
      })}
    </div>;
  };

  const visible = t >= a0;
  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {visible && <Pill box={{ x: 960 - w / 2, y: 540 - h / 2, w, h }}>
        <div style={{ position: 'absolute', left: w / 2 - W / 2, top: h / 2 - H / 2, width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {two && chars.length ? lines.map(renderLine) : renderLine(lines[0], 0)}
        </div>
      </Pill>}
    </Handoff>
  </Frame>;
};
