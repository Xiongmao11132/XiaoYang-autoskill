// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T01e-ConditionCapsule.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：条件黑胶囊（正版 T01e，升级自 X003）：小圆点长成圆（轻微过冲）→ 打开成胶囊 → 逐字打出条件 →
// 胶囊再横向延长、补上第二段（紫字）；单行字号放不下时补充段落到第二行、胶囊向下加厚。
// 与近名件区别：YangTermDefine（正版 T01b）是术语卡下抽出释义卡；YangDotToLine（正版 T01f）是圆点胀成一句关键句；
// 本件是「一个条件补上第二个条件、组合成完整前提」的两段式延长，不是重复集成。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/typed/cueAt/textWidth 与 Frame/Handoff/Pill 已内嵌移植，逻辑与原版一致；
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
const typed = (s: string, t: number, a: number, b: number) => {
  const n = Array.from(s);
  const k = clamp((t - a) / Math.max(b - a, 1e-6));
  return n.slice(0, Math.floor(n.length * k)).join('');
};
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

export type YangConditionCapsuleProps = YangHandoffProps & {
  condition: string;  // 第一个条件（白字）
  extra: string;      // 补上的条件（紫字，通常以“+”开头）
  cues?: number[];    // [0]=圆点出现，[1]=胶囊延长、补上第二个条件
};

export const yangConditionCapsuleDefaults: YangConditionCapsuleProps = {
  condition: '预算有限',
  extra: '+想长期用',
};

const overshoot = (t: number, a: number, rise: number, settle: number, amount: number) =>
  p(t, a, a + rise) * (1 + amount) - amount * q(t, a + rise, a + rise + settle);

const MAX_W = 1640;
const PAD = 1.55;

export const YangConditionCapsule: React.FC<Partial<YangConditionCapsuleProps>> = (props) => {
  const c = { ...yangConditionCapsuleDefaults, ...props };
  const t = useT();

  const u1 = textWidth(c.condition, 1), u2 = textWidth(c.extra, 1), uAll = u1 + u2;
  const s1 = Math.min(171, MAX_W / (u1 + PAD));
  const h1 = s1 * 2.14;
  const w1 = Math.max(h1 * 1.7, u1 * s1 + PAD * s1);
  const single = Math.min(145, s1 * 0.86, MAX_W / (uAll + PAD));
  const twoLine = single < 100;
  const s2 = twoLine ? Math.min(130, s1 * 0.9, MAX_W / (Math.max(u1, u2) + 3.22 * 0.72)) : single;
  const h2 = twoLine ? s2 * 3.22 : s2 * 1.86;
  const w2 = twoLine ? Math.max(u1, u2) * s2 + h2 * 0.72 : Math.max(w1, uAll * s2 + PAD * s2);
  const D = h1 * 0.7;

  const a0 = cueAt(c.cues, 0, 0.05);
  const grow = overshoot(t, a0, 0.36, 0.14, 0.04);
  const open = p(t, a0 + 0.42, a0 + 1.22);
  const n1 = Array.from(c.condition).length, n2 = Array.from(c.extra).length;
  const type1 = a0 + 1.0, type1End = type1 + Math.min(1.25, n1 * 0.11);
  const a1 = cueAt(c.cues, 1, Math.max(type1End + 0.9, 3.2));
  const ext = p(t, a1, a1 + 0.85);
  const type2 = a1 + 0.22, type2End = type2 + Math.min(0.95, n2 * 0.11);

  const w = t < a0 + 0.42 ? D * grow : mix(mix(D, w1, open), w2, ext);
  const h = t < a0 + 0.42 ? D * grow : mix(mix(D, h1, open), h2, ext);

  const y2a = twoLine ? 540 - s2 * 0.6 : 540;
  const y2b = twoLine ? 540 + s2 * 0.6 : 540;
  const size = mix(s1, s2, ext);
  const shift = twoLine ? 0 : (u2 * size) / 2 * (1 - ext);
  const fy = mix(540, y2a, ext);
  const shown = (s: string, a: number, b: number) => Array.from(typed(s, t, a, b)).length;
  const reveal = (s: string, a: number, b: number, color: string) => {
    const k = shown(s, a, b);
    return Array.from(s).map((ch, i) => <span key={i} style={{ color, opacity: i < k ? 1 : 0 }}>{ch}</span>);
  };

  const row = (s: number, y: number): React.CSSProperties => ({ ...textBase(s, 900), position: 'absolute', left: 0, width: 1920, top: y - s / 2, lineHeight: 1, textAlign: 'center' });
  const visible = t >= a0;
  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {visible && <Pill box={{ x: 960 - w / 2, y: 540 - h / 2, w, h }} />}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(${540 - h / 2}px ${960 - w / 2}px ${540 - h / 2}px ${960 - w / 2}px round ${Math.min(w, h) / 2}px)` }}>
        <div style={{ ...row(size, fy), transform: `translateX(${shift}px)` }}>
          {reveal(c.condition, type1, type1End, '#fff')}
          {!twoLine && reveal(c.extra, type2, type2End, accentOn(true))}
        </div>
        {twoLine && <div style={row(s2, y2b)}>{reveal(c.extra, type2, type2End, accentOn(true))}</div>}
      </div>
    </Handoff>
  </Frame>;
};
