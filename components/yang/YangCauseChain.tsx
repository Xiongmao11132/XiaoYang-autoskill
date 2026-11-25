// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T03d-CauseChain.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：因果链推进（正版 T03d）：3–5 步白卡，每一步从上一步底下被推出来、向右下错开一级落位，整组随之重新居中，
// 旧步略退后；最后一步是结果，落成黑胶囊、关键词染紫。不画箭头——先后出现＋从上一张下面滑出即「由它导致」。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/cueAt/textWidth 与 Frame/Handoff/Pill/Surface 已内嵌移植，逻辑与原版一致；
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

export type YangCauseChainProps = YangHandoffProps & {
  steps: string[];       // 第一项是原因，最后一项是结果；3–5 项
  highlight: string;     // 结果里染紫的词（黑胶囊上 #D6BEFF）
  cues?: number[];       // [i]=第 i 步出现（秒）；不传按默认节奏
};

export const yangCauseChainDefaults: YangCauseChainProps = {
  steps: ['需求没说清', '来回改了三版', '时间全耗在返工上', '上线还是延期了'],
  highlight: '延期',
};

const STEP_X = 150;
const ROW_GAP = 40;

export const YangCauseChain: React.FC<Partial<YangCauseChainProps>> = (props) => {
  const c = { ...yangCauseChainDefaults, ...props };
  const t = useT();
  const steps = c.steps.slice(0, 5);
  const n = Math.max(2, steps.length);
  const last = steps.length - 1;

  const cardH = n > 4 ? 118 : 140;
  const resH = n > 4 ? 160 : 196;
  const avail = (i: number) => 1760 - i * STEP_X;
  const midSize = Math.min(n > 4 ? 60 : 70, ...steps.slice(0, last).map((s, i) => (avail(i) - 120) / Math.max(1, textWidth(s, 1))));
  const resSize = Math.min(n > 4 ? 108 : 124, (avail(last) - 160) / Math.max(1, textWidth(steps[last], 1)));
  const w = (i: number) => i === last ? textWidth(steps[i], resSize) + resSize * 1.6 : textWidth(steps[i], midSize) + midSize * 1.8;
  const h = (i: number) => (i === last ? resH : cardH);
  const slotY = (i: number) => steps.slice(0, i).reduce((a, _, k) => a + h(k) + ROW_GAP, 0);
  const slotX = (i: number) => i * STEP_X;

  const step = Math.min(0.95, 3.0 / (n - 1));
  const at = (i: number) => (i === 0 ? cueAt(c.cues, 0, 0.05) : cueAt(c.cues, i, 0.75 + (i - 1) * step));
  const dur = 0.62;
  const vs = steps.map((_, i) => p(t, at(i), at(i) + dur));

  const extent = (k: number) => {
    let right = 0;
    for (let i = 0; i <= k; i++) right = Math.max(right, slotX(i) + w(i));
    return { wid: right, hei: slotY(k) + h(k) };
  };
  let ox = 0, oy = 0;
  for (let k = 0; k <= last; k++) {
    const e = extent(k);
    const tx = 960 - e.wid / 2, ty = 540 - e.hei / 2;
    const m = k === 0 ? 1 : q(t, at(k), at(k) + dur + 0.1);
    ox = k === 0 ? tx : mix(ox, tx, m);
    oy = k === 0 ? ty : mix(oy, ty, m);
  }

  const [pre, post = ''] = c.highlight && steps[last].includes(c.highlight) ? steps[last].split(c.highlight) : [steps[last]];

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', left: ox, top: oy }}>
        {steps.map((s, i) => {
          const v = vs[i];
          const fromX = i === 0 ? 0 : slotX(i - 1) + 10, fromY = i === 0 ? -30 : slotY(i - 1) + (h(i - 1) - h(i)) / 2;
          const x = mix(fromX, slotX(i), v), y = mix(fromY, slotY(i), v);
          const vis = i === 0 ? v : clamp(v * 6);
          const dim = i === last ? 1 : mix(1, 0.62, vs[i + 1] ?? 0);
          const box = { x, y, w: w(i), h: h(i) };
          const style: React.CSSProperties = { opacity: vis, zIndex: 10 - i, transform: `scale(${mix(0.94, 1, v)})`, transformOrigin: 'left center' };
          if (i === last) {
            return <Pill key={i} box={box} style={style}>
              <span style={{ ...textBase(resSize, 400), color: '#fff' }}>
                {pre}{c.highlight && steps[last].includes(c.highlight) && <span style={{ color: S.accentDark }}>{c.highlight}</span>}{post}
              </span>
            </Pill>;
          }
          return <Surface key={i} box={box} style={{ ...style, display: 'flex', alignItems: 'center', paddingLeft: midSize * 0.9 }}>
            <span style={{ ...textBase(midSize, 900), color: S.ink, opacity: dim }}>{s}</span>
          </Surface>;
        })}
      </div>
    </Handoff>
  </Frame>;
};
