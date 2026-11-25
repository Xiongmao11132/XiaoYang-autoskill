// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T05e-FitOrNot.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：适用 / 不适用（正版 T05e）：一摞情况卡先在中间排好，表头两枚胶囊（适合=黑／不适合=白）就位；
// 按口播逐张分拣到左右两列，落到「适合」一边的卡翻成黑底（被选中），不适合的保持白卡；一张适合卡可染紫一词。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/cueAt/textWidth 与 Frame/Handoff/Pill 已内嵌移植，逻辑与原版一致；
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
const cueAt = (cues: readonly number[] | undefined, i: number, fb: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fb;
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixColor = (a: string, b: string, v: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((x, i) => Math.round(mix(x, B[i], v))).join(',')})`;
};
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
function Pill({ box, dark = true, shadow, style, children }: { box: Box; dark?: boolean; shadow?: string; style?: React.CSSProperties; children?: React.ReactNode }) {
  return <div style={{
    position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.h / 2,
    background: dark ? S.dark : '#fff', boxShadow: shadow ?? (dark ? S.capsuleShadow : S.shadow),
    display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
  }}>{children}</div>;
}

export type YangFitItem = { text: string; fit: boolean };
export type YangFitOrNotProps = YangHandoffProps & {
  fitLabel: string;
  unfitLabel: string;
  items: YangFitItem[];      // 中间的顺序就是分拣顺序；2–8 项
  highlight: string;     // 某张“适合”卡里染紫的词（深底 #D6BEFF）；'' 不染
  cues?: number[];       // [i]=第 i 张卡开始分拣（秒）；不传按默认节奏
};

export const yangFitOrNotDefaults: YangFitOrNotProps = {
  fitLabel: '适合交给 AI',
  unfitLabel: '还是自己来',
  items: [
    { text: '批量整理几百条数据', fit: true },
    { text: '一句话就能答的小问题', fit: false },
    { text: '照模板生成周报初稿', fit: true },
    { text: '需要当场拍板的设计', fit: false },
    { text: '按规则逐条核对清单', fit: true },
    { text: '登录账号、填密码', fit: false },
  ],
  highlight: '周报初稿',
};

const COL_L = 500, COL_R = 1420;
const COL_W_MAX = 820;

export const YangFitOrNot: React.FC<Partial<YangFitOrNotProps>> = (props) => {
  const c = { ...yangFitOrNotDefaults, ...props };
  const t = useT();
  const items = c.items.slice(0, 8);
  const n = Math.max(1, items.length);

  const nFit = items.filter((x) => x.fit).length, nUn = n - nFit;
  const colRows = Math.max(nFit, nUn, 1);
  const longest = Math.max(...items.map((x) => textWidth(x.text, 1)), 1);
  const headSize = Math.min(64, 800 / Math.max(1, textWidth(c.fitLabel, 1), textWidth(c.unfitLabel, 1)));
  const headW = (s: string) => textWidth(s, headSize) + headSize * 1.7;
  const headH = headSize * 1.9;
  const rowGap = 26, headGap = 52;
  const slotH = Math.min(148, (900 - headH - headGap - (colRows - 1) * rowGap) / colRows);
  const total = headH + headGap + colRows * slotH + (colRows - 1) * rowGap;
  const headY = (1080 - total) / 2;
  const colTop = headY + headH + headGap;
  const fsEnd = Math.min(66, slotH * 0.46, (COL_W_MAX - 110) / longest);
  const wEnd = longest * fsEnd + fsEnd * 2.4;
  const gap = n > 6 ? 12 : 16;
  const cardH = Math.min(96, (1030 - colTop - (n - 1) * gap) / n);
  const size = Math.min(54, cardH * 0.52, 900 / longest);
  const wStart = longest * size + size * 2.4;
  const stackTop = colTop + (1030 - colTop - (n * cardH + (n - 1) * gap)) / 2;

  const enter = p(t, 0, 0.5);
  const head = p(t, 0.1, 0.55);
  const step = Math.min(0.48, 2.5 / n);
  const at = (i: number) => cueAt(c.cues, i, 1.0 + i * step);
  const dur = 0.55;

  let fi = 0, ui = 0;
  const vs = items.map((_, i) => p(t, at(i), at(i) + dur));
  const cards = items.map((it, i) => {
    const k = it.fit ? fi++ : ui++;
    const v = vs[i];
    const sx = 960, sy = stackTop + i * (cardH + gap) + cardH / 2;
    const tx = it.fit ? COL_L : COL_R, ty = colTop + k * (slotH + rowGap) + slotH / 2;
    const x = mix(sx, tx, v), y = mix(sy, ty, v);
    const h = mix(cardH, slotH, v);
    const flip = it.fit ? clamp((v - 0.55) / 0.35) : 0;
    const appear = p(t, 0.04 * i, 0.04 * i + 0.45);
    const fs = mix(size, fsEnd, v);
    const w = mix(wStart, wEnd, v);
    const hl = it.fit && c.highlight && it.text.includes(c.highlight) ? c.highlight : '';
    const [pre, post = ''] = hl ? it.text.split(hl) : [it.text];
    return <div key={i} style={{
      position: 'absolute', left: x - w / 2, top: y - h / 2 + (1 - appear) * 30, width: w, height: h,
      borderRadius: S.radius, background: mixColor('#ffffff', S.dark, flip), boxShadow: it.fit && flip > 0.5 ? S.capsuleShadow : S.shadow,
      display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: appear * enter,
      transform: `scale(${1 + 0.04 * Math.sin(Math.PI * v)})`, zIndex: v > 0 && v < 1 ? 20 : 10,
    }}>
      <span style={{ ...textBase(fs, 900), color: flip > 0.5 ? '#fff' : S.ink }}>
        {pre}{hl && <span style={{ color: flip > 0.5 ? S.accentDark : S.ink }}>{hl}</span>}{post}
      </span>
    </div>;
  });

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <Pill box={{ x: COL_L - headW(c.fitLabel) / 2, y: headY + (1 - head) * 24, w: headW(c.fitLabel), h: headH }} style={{ opacity: head }}>
        <span style={{ ...textBase(headSize, 400), color: '#fff' }}>{c.fitLabel}</span>
      </Pill>
      <Pill dark={false} box={{ x: COL_R - headW(c.unfitLabel) / 2, y: headY + (1 - head) * 24, w: headW(c.unfitLabel), h: headH }} shadow={S.shadow} style={{ opacity: head }}>
        <span style={{ ...textBase(headSize, 400), color: S.ink }}>{c.unfitLabel}</span>
      </Pill>
      {cards}
    </Handoff>
  </Frame>;
};
