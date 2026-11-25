// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T14d-ValueShift.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 与近名件的区别：YangPriceLand 是价格数字滚动＋划线＋差值胶囊落下；YangSpecLand 是单个数值盖章落地；
// YangStatSlam 是大数字砸入——本件是「同一条刻度尺上指针从旧值滑到新值」，讲的是位置迁移不是数字本身。
// 用途：数值迁移（正版 T14d）：一条刻度尺，旧值的指针先站住，随后滑到新值（读数跟着走），
// 旧位置留一个幽灵指针，两值之间的刻度段变紫，下方给出变化量（自动算或 deltaText 指定）。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/quintic/springAt 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；
// 默认数值已换中性示例（不含原包当期数据）。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
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
const quintic = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * v * (v * (v * 6 - 15) + 10); };
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
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

export type YangValueShiftProps = YangHandoffProps & {
  label: string;          // 指标名（尺上方）
  from: number;           // 旧值
  to: number;             // 新值
  min?: number;           // 刻度范围（默认按 from/to 外扩）
  max?: number;
  unit?: string;          // 单位后缀，如 %、分
  deltaText?: string;     // 变化量文案；不给则自动算 ±差值
  cues?: number[];        // [0]=指针开始滑动
};

export const yangValueShiftDefaults: YangValueShiftProps = {
  label: '完成一次任务的平均用时',
  from: 42,
  to: 18,
  unit: ' 分钟',
};

const TRACK = { x: 260, w: 1400, y: 560 };
const fmt = (v: number) => (Math.round(v * 10) / 10).toString();

export const YangValueShift: React.FC<Partial<YangValueShiftProps>> = (props) => {
  const c = { ...yangValueShiftDefaults, ...props };
  const t = useT();
  const lo = c.min ?? Math.min(c.from, c.to) - Math.abs(c.to - c.from) * 0.45 - 2;
  const hi = c.max ?? Math.max(c.from, c.to) + Math.abs(c.to - c.from) * 0.45 + 2;
  const pos = (v: number) => TRACK.x + (clamp((v - lo) / (hi - lo)) * TRACK.w);
  const slideAt = c.cues?.[0] ?? 0.9;
  const slide = quintic(t, slideAt, slideAt + 0.9);
  const cur = mix(c.from, c.to, slide);
  const curX = pos(cur);
  const fromX = pos(c.from);
  const appear = p(t, 0.1, 0.5);
  const delta = c.deltaText ?? `${c.to >= c.from ? '+' : '−'}${fmt(Math.abs(c.to - c.from))}${c.unit ?? ''}`;
  const deltaIn = springAt(t, slideAt + 0.95, 0.8);
  const ticks = 9;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', left: 0, top: 246, width: 1920, textAlign: 'center', opacity: appear }}>
        <span style={{ ...textBase(64, 700), color: S.ink }}>{c.label}</span>
      </div>
      <div style={{ position: 'absolute', left: TRACK.x, top: TRACK.y - 7, width: TRACK.w, height: 14, borderRadius: 7, background: '#e3e3e8', opacity: appear }} />
      <div style={{
        position: 'absolute', left: Math.min(fromX, curX), top: TRACK.y - 7, width: Math.abs(curX - fromX), height: 14,
        borderRadius: 7, background: S.accent, opacity: appear * clamp(slide * 2),
      }} />
      {Array.from({ length: ticks }).map((_, i) => {
        const x = TRACK.x + (TRACK.w / (ticks - 1)) * i;
        return <div key={i} style={{ position: 'absolute', left: x - 2, top: TRACK.y + 22, width: 4, height: 18, borderRadius: 2, background: '#c9c9cf', opacity: appear }} />;
      })}
      {slide > 0.02 && <div style={{ position: 'absolute', left: fromX - 3, top: TRACK.y - 34, width: 6, height: 68, borderRadius: 3, background: S.faint, opacity: 0.75 * appear }}>
        <div style={{ position: 'absolute', left: -60, top: -64, width: 126, textAlign: 'center', ...textBase(40, 700), color: S.faint }}>{fmt(c.from)}{c.unit}</div>
      </div>}
      <div style={{ position: 'absolute', left: curX - 4, top: TRACK.y - 52, width: 8, height: 104, borderRadius: 4, background: S.dark, opacity: appear }}>
        <div style={{
          position: 'absolute', left: '50%', top: -118, transform: 'translateX(-50%)', background: S.dark, color: '#fff',
          borderRadius: 999, padding: '14px 30px', boxShadow: S.capsuleShadow, ...textBase(54, 900), fontVariantNumeric: 'tabular-nums',
        }}>{fmt(cur)}{c.unit}</div>
      </div>
      {deltaIn > 0.02 && <div style={{
        position: 'absolute', left: 0, top: 700, width: 1920, textAlign: 'center',
        opacity: clamp(deltaIn * 1.6), transform: `translateY(${(1 - clamp(deltaIn)) * 20}px)`,
      }}>
        <span style={{ ...textBase(58, 900), color: S.accent }}>{delta}</span>
      </div>}
    </Handoff>
  </Frame>;
};
