// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T04b-RoleSplit.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：角色分工（正版 T04b）：一整条黑胶囊（一件事）沿分段处裂开成 2–4 段（各环节），每段下方落下一张白工具卡
// （logo＋工具名）塞进对应段下面——不画连线，靠同一列上下归组表达「谁管哪段」。整件事里一处关键词染紫。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/springAt/cueAt/textWidth 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；
// 原包默认示例已换中性示例；logo 走 props（宿主 public 路径），原包默认的工具 logo 已去掉——
// 不传 logo 时用工具名首字圆牌作中性占位。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
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

export type YangRole = { step: string; tool: string; logo?: string };
export type YangRoleSplitProps = YangHandoffProps & {
  task: string;          // 整件事
  roles: YangRole[];     // 2–4 段：每段的环节名 + 负责的工具（名字 + 可选 Logo 路径）
  highlight: string;     // task 里染紫的词（黑胶囊上用 #D6BEFF）；'' 不染
  cues?: number[];       // [0]=胶囊裂开（默认 1.1s）；[1..n]=第 i 个工具落位
};

export const yangRoleSplitDefaults: YangRoleSplitProps = {
  task: '做一期产品测评视频',
  roles: [
    { step: '写口播稿', tool: '写作工具' },
    { step: '生成配图', tool: '生图工具' },
    { step: '做动画出片', tool: '剪辑工具' },
  ],
  highlight: '测评视频',
};

const BAR_H = 210;

const splitTwo = (s: string): string[] => {
  const ch = Array.from(s);
  const mid = ch.length / 2;
  let best = -1;
  ch.forEach((ch2, i) => { if (/[、，,\s·/]/.test(ch2) && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i; });
  if (best > 0 && best < ch.length - 1) return [ch.slice(0, best + (/\s/.test(ch[best]) ? 0 : 1)).join('').replace(/[、，,]$/, ''), ch.slice(best + 1).join('').trim()];
  const k = Math.ceil(mid);
  return [ch.slice(0, k).join(''), ch.slice(k).join('')];
};
const BAR_Y = 330;
const GAP = 40;

export const YangRoleSplit: React.FC<Partial<YangRoleSplitProps>> = (props) => {
  const c = { ...yangRoleSplitDefaults, ...props };
  const t = useT();
  const roles = c.roles.slice(0, 4);
  const n = Math.max(1, roles.length);

  const splitAt = cueAt(c.cues, 0, 1.1);
  const toolAt = (i: number) => cueAt(c.cues, i + 1, splitAt + 0.75 + i * 0.5);

  const stepFit = Math.max(...roles.map((r) => textWidth(r.step, 1)), 1);
  const segW = Math.min((1720 - (n - 1) * GAP) / n, Math.max(420, stepFit * 92 + 120));
  const W = segW * n + (n - 1) * GAP;
  const X0 = 960 - W / 2;
  const taskSize = Math.min(124, (W - 160) / Math.max(1, textWidth(c.task, 1)));
  const oneLine = Math.min(96, (segW - 80) / stepFit);
  const twoLines = oneLine < 60;
  const stepLines = roles.map((r) => (twoLines && textWidth(r.step, 1) * oneLine > (segW - 80) * 0.75 ? splitTwo(r.step) : [r.step]));
  const stepSize = twoLines
    ? Math.min(72, BAR_H / 2.7, ...stepLines.map((ls) => (segW - 70) / Math.max(1, ...ls.map((l) => textWidth(l, 1)))))
    : oneLine;

  const enter = p(t, 0, 0.5);
  const split = q(t, splitAt, splitAt + 0.6);
  const gap = GAP * split;
  const segWNow = (W - (n - 1) * gap) / n;
  const innerR = mix(0, BAR_H / 2, split);
  const taskOut = clamp((t - splitAt) / 0.18);
  const stepIn = p(t, splitAt + 0.2, splitAt + 0.6);

  const [pre, post = ''] = c.highlight && c.task.includes(c.highlight) ? c.task.split(c.highlight) : [c.task];
  const hl = c.highlight && c.task.includes(c.highlight);

  const nameFit = Math.max(...roles.map((r) => textWidth(r.tool, 1)), 1);
  const logo = 128;
  const cardW = segW - 56;
  const nameSize = Math.min(68, (cardW - 70) / nameFit);
  const TUCK = 40;
  const cardH = 330;
  const toolY = BAR_Y + BAR_H - TUCK;
  const blockH = BAR_H - TUCK + cardH;
  const dyEnd = (1080 - blockH) / 2 - BAR_Y;
  const dyStart = (1080 - BAR_H) / 2 - BAR_Y;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${mix(dyStart, dyEnd, q(t, splitAt, splitAt + 0.7))}px)` }}>
        {roles.map((r, i) => {
          const x = X0 + i * (segWNow + gap);
          const first = i === 0, last = i === n - 1;
          const R = BAR_H / 2;
          const radius = `${first ? R : innerR}px ${last ? R : innerR}px ${last ? R : innerR}px ${first ? R : innerR}px`;
          return <div key={i} style={{
            position: 'absolute', left: x, top: BAR_Y + (1 - enter) * 40, width: segWNow + (split < 1 && !last ? 1 : 0), height: BAR_H,
            background: S.dark, borderRadius: radius, boxShadow: split > 0.02 || n === 1 ? S.capsuleShadow : 'none', opacity: enter,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ opacity: stepIn, transform: `translateY(${(1 - stepIn) * 18}px)`, textAlign: 'center' }}>
              {stepLines[i].map((l, li) => <div key={li} style={{ ...textBase(stepSize, 400), color: '#fff' }}>{l}</div>)}
            </div>
          </div>;
        })}
        <div style={{ position: 'absolute', left: X0, top: BAR_Y + (1 - enter) * 40, width: W, height: BAR_H, borderRadius: BAR_H / 2,
          boxShadow: S.capsuleShadow, opacity: enter * (1 - clamp(split * 4)), zIndex: -1 }} />
        <div style={{ position: 'absolute', left: X0, top: BAR_Y + (1 - enter) * 40, width: W, height: BAR_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: enter * (1 - taskOut) }}>
          <span style={{ ...textBase(taskSize, 400), color: '#fff' }}>
            {pre}{hl && <span style={{ color: S.accentDark }}>{c.highlight}</span>}{post}
          </span>
        </div>
        {roles.map((r, i) => {
          const a = toolAt(i);
          const s = springAt(t, a, 0.6);
          const v = p(t, a, a + 0.45);
          const x = X0 + i * (segW + GAP) + 28;
          return <div key={i} style={{ position: 'absolute', left: x, top: toolY + (1 - v) * 90, width: cardW, height: cardH, zIndex: -1,
            background: '#fff', borderRadius: S.radius, boxShadow: S.shadow, opacity: v,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, paddingTop: TUCK }}>
            {r.logo
              ? <Img src={staticFile(r.logo)} style={{ width: logo, height: logo, objectFit: 'contain', transform: `scale(${mix(0.7, 1, s)})` }} />
              : <div style={{ width: logo, height: logo, borderRadius: logo / 2, background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${mix(0.7, 1, s)})` }}>
                  <span style={{ ...textBase(56, 900), color: '#fff' }}>{Array.from(r.tool)[0] ?? ''}</span>
                </div>}
            <span style={{ ...textBase(nameSize, 900), color: S.ink }}>{r.tool}</span>
          </div>;
        })}
      </div>
    </Handoff>
  </Frame>;
};
