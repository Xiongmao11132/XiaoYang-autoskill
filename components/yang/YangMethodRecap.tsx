// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T21a-MethodRecap.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 与 YangVerdictYield 的区别：那件是结论让位给证据；本件是方法回顾——多行方法卡的关键词
// 脱离正文、飞到一处拼成一句话，是收尾的「把方法收成一句」件。
// 用途：方法回顾（正版 T21a）：2–4 行方法卡竖排，每行开头有一枚黑色小芯片写着关键词；
// 讲到收尾，各行正文退后变糊，关键词芯片依次飞到中央一排，连接词淡入，把 sentence 在一枚
// 大黑胶囊里拼完整，一段高亮变紫。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/quintic/springAt/textWidth 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；
// 默认文案已换中性示例。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  capsuleShadow: '30px 22px 25px #0005', shadow: '0 16px 25px 0 rgba(0,0,0,0.1333)',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, v: number) => a + (b - a) * v;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const q = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * (3 - 2 * v); };
const quintic = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * v * (v * (v * 6 - 15) + 10); };
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
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

export type YangMethodRow = { keyword: string; text: string };
export type YangMethodRecapProps = YangHandoffProps & {
  rows: YangMethodRow[];        // 2–4 行
  connectors: string[];         // 关键词之间的连接词（rows.length-1 个，可空串）
  sentenceLead?: string;        // 句首引导词（如「先」），拼在第一个关键词前
  highlight?: string;           // sentence 中的高亮段（出现在某个 keyword 上时变紫）
  cues?: number[];              // [0]=开始收拢
};

export const yangMethodRecapDefaults: YangMethodRecapProps = {
  rows: [
    { keyword: '看需求', text: '先弄清对方到底要解决什么' },
    { keyword: '看做法', text: '再看它具体是怎么做的' },
    { keyword: '看结果', text: '最后看实际效果和代价' },
  ],
  connectors: ['，再', '，最后'],
  sentenceLead: '先',
  highlight: '看结果',
};

const ROW_W = 1240, ROW_H = 128, GAPY = 26;
const CHIP_SIZE = 44;

export const YangMethodRecap: React.FC<Partial<YangMethodRecapProps>> = (props) => {
  const c = { ...yangMethodRecapDefaults, ...props };
  const rows = (c.rows.length >= 2 ? c.rows : yangMethodRecapDefaults.rows).slice(0, 4);
  const n = rows.length;
  const t = useT();
  const gatherAt = c.cues?.[0] ?? 1.6;
  const totalH = n * ROW_H + (n - 1) * GAPY;
  const Y0 = 540 - totalH / 2 - 40;
  const X0 = 960 - ROW_W / 2;

  const chipW = rows.map((r) => textWidth(r.keyword, CHIP_SIZE) + CHIP_SIZE * 1.3);
  const chipH = CHIP_SIZE * 1.72;
  const BIG = 62;
  const bigChipW = rows.map((r) => textWidth(r.keyword, BIG) + BIG * 1.3);
  const connW = rows.map((_, i) => (i < n - 1 ? textWidth(c.connectors[i] ?? '', BIG) : 0));
  const leadW = c.sentenceLead ? textWidth(c.sentenceLead, BIG) : 0;
  const totalSentenceW = leadW + bigChipW.reduce((a, b) => a + b, 0) + connW.reduce((a, b) => a + b, 0) + 26 * n;
  const pillW = totalSentenceW + 120;
  const pillH = BIG * 1.9;
  const pillX = 960 - pillW / 2, pillY = 540 - pillH / 2 + 150;

  // 每个关键词在句子里的目标 x（相对 pill 左）
  const targets: number[] = [];
  { let x = 60 + leadW + (c.sentenceLead ? 12 : 0); rows.forEach((_, i) => { targets.push(x); x += bigChipW[i] + 26 + connW[i] + (i < n - 1 ? 6 : 0); }); }

  const gather = quintic(t, gatherAt, gatherAt + 0.5);
  const pillIn = springAt(t, gatherAt + 0.25, 0.9);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {rows.map((r, i) => {
        const show = p(t, 0.15 + i * 0.18, 0.5 + i * 0.18);
        const y = Y0 + i * (ROW_H + GAPY);
        const recede = q(t, gatherAt, gatherAt + 0.45);
        return <div key={i} style={{
          position: 'absolute', left: X0, top: y, width: ROW_W, height: ROW_H, borderRadius: 24, background: '#fff',
          boxShadow: S.shadow, opacity: show * (1 - recede * 0.55), filter: recede > 0.01 ? `blur(${7 * recede}px)` : undefined,
          transform: `translateY(${(1 - show) * 18 - recede * 26}px) scale(${1 - recede * 0.03})`,
        }}>
          <div style={{ position: 'absolute', left: chipW[i] + 76, top: 0, height: ROW_H, display: 'flex', alignItems: 'center' }}>
            <span style={{ ...textBase(48, 600), color: S.ink }}>{r.text}</span>
          </div>
        </div>;
      })}

      {pillIn > 0.02 && <div style={{
        position: 'absolute', left: pillX, top: pillY, width: pillW, height: pillH, borderRadius: pillH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, opacity: clamp(pillIn * 1.5),
        transform: `scale(${mix(0.9, 1, clamp(pillIn))})`, zIndex: 5,
      }}>
        {c.sentenceLead && <div style={{ position: 'absolute', left: 60, top: 0, height: pillH, display: 'flex', alignItems: 'center', opacity: p(t, gatherAt + 0.8, gatherAt + 1.1) }}>
          <span style={{ ...textBase(BIG, 700), color: '#fff' }}>{c.sentenceLead}</span>
        </div>}
        {rows.map((r, i) => i < n - 1 && (c.connectors[i] ?? '') !== '' ? (
          <div key={i} style={{ position: 'absolute', left: pillX * 0 + targets[i] + bigChipW[i] + 16, top: 0, height: pillH, display: 'flex', alignItems: 'center', opacity: p(t, gatherAt + 0.95 + i * 0.12, gatherAt + 1.25 + i * 0.12) }}>
            <span style={{ ...textBase(BIG, 500), color: S.faint }}>{c.connectors[i]}</span>
          </div>
        ) : null)}
      </div>}

      {rows.map((r, i) => {
        const y = Y0 + i * (ROW_H + GAPY) + (ROW_H - chipH) / 2;
        const fly = quintic(t, gatherAt + 0.3 + i * 0.13, gatherAt + 0.85 + i * 0.13);
        const sx = X0 + 30, sy = y;
        const tx = pillX + targets[i], ty = pillY + (pillH - BIG * 1.72) / 2;
        const x = mix(sx, tx, fly), yy = mix(sy, ty, fly) - Math.sin(Math.PI * fly) * 60 * (fly > 0 && fly < 1 ? 1 : 0);
        const w = mix(chipW[i], bigChipW[i], fly);
        const h = mix(chipH, BIG * 1.72, fly);
        const show = p(t, 0.15 + i * 0.18, 0.5 + i * 0.18);
        return <div key={i} style={{
          position: 'absolute', left: x, top: yy, width: w, height: h, borderRadius: h / 2, background: S.dark,
          boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: show, zIndex: 10,
        }}>
          <span style={{ ...textBase(mix(CHIP_SIZE, BIG, fly), 900), color: c.highlight && r.keyword === c.highlight && fly > 0.7 ? S.accentDark : '#fff' }}>{r.keyword}</span>
        </div>;
      })}
    </Handoff>
  </Frame>;
};
