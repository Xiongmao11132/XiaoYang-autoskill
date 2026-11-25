// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T15a-ScoreBars.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 与自有库 RankBarChart / MomentumBar 的区别：那两件是黄铜风的榜单收尾件（名次牌＋动量），
// 本件是白底横条评分对比——条依次长出带滚动数字，收尾非主角变灰、主角条变紫且数值放大。
// 用途：评分横条（正版 T15a）：2–8 条横条依次长出，数值同步滚动；全部长齐后非主角淡成灰，
// 主角条变紫、数值放大停住。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/quintic 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；
// 默认数据已换中性示例。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  shadow: '0 16px 25px 0 rgba(0,0,0,0.1333)',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, v: number) => a + (b - a) * v;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const quintic = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * v * (v * (v * 6 - 15) + 10); };
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

export type YangScoreBar = { label: string; value: number };
export type YangScoreBarsProps = YangHandoffProps & {
  bars: YangScoreBar[];      // 2–8 条
  hero: number;              // 主角下标
  max?: number;              // 满格值；默认取最大值
  decimals?: number;         // 数值小数位（默认 0）
  cues?: number[];           // [i]=第 i 条开始长；[n]=收尾聚焦
};

export const yangScoreBarsDefaults: YangScoreBarsProps = {
  bars: [
    { label: '方案甲', value: 72 },
    { label: '方案乙', value: 85 },
    { label: '方案丙', value: 64 },
    { label: '方案丁', value: 91 },
  ],
  hero: 3,
};

export const YangScoreBars: React.FC<Partial<YangScoreBarsProps>> = (props) => {
  const c = { ...yangScoreBarsDefaults, ...props };
  const bars = (c.bars.length >= 2 ? c.bars : yangScoreBarsDefaults.bars).slice(0, 8);
  const n = bars.length;
  const hero = clamp(Math.round(c.hero), 0, n - 1);
  const max = c.max ?? Math.max(...bars.map((b) => b.value));
  const dec = c.decimals ?? 0;
  const t = useT();

  const ROW = Math.min(128, 860 / n);
  const BAR_H = Math.min(64, ROW * 0.5);
  const totalH = ROW * n;
  const Y0 = 540 - totalH / 2;
  const LABEL_X = 170, BAR_X = 470, BAR_W = 1010;
  const growAt = (i: number) => (c.cues && typeof c.cues[i] === 'number' ? c.cues[i] : 0.3 + i * 0.42);
  const focusAt = c.cues && typeof c.cues[n] === 'number' ? c.cues[n] : growAt(n - 1) + 1.0;
  const focus = quintic(t, focusAt, focusAt + 0.6);
  const fmt = (v: number) => v.toFixed(dec);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {bars.map((b, i) => {
        const g = quintic(t, growAt(i), growAt(i) + 0.7);
        const isHero = i === hero;
        const dim = isHero ? 0 : focus;
        const y = Y0 + ROW * i + (ROW - BAR_H) / 2;
        const w = (b.value / max) * BAR_W * g;
        const shown = b.value * g;
        const barColor = isHero ? mix(0, 1, focus) : 0;
        return <div key={i} style={{ position: 'absolute', left: 0, top: Y0 + ROW * i, width: 1920, height: ROW, opacity: clamp(g * 2) * (1 - dim * 0.45) }}>
          <div style={{ position: 'absolute', left: LABEL_X, top: 0, height: ROW, display: 'flex', alignItems: 'center' }}>
            <span style={{ ...textBase(52, isHero && focus > 0.5 ? 900 : 700), color: isHero && focus > 0.5 ? S.ink : dim > 0.5 ? S.faint : S.ink }}>{b.label}</span>
          </div>
          <div style={{ position: 'absolute', left: BAR_X, top: (ROW - BAR_H) / 2, width: BAR_W, height: BAR_H, borderRadius: BAR_H / 2, background: '#ececf0' }} />
          <div style={{
            position: 'absolute', left: BAR_X, top: (ROW - BAR_H) / 2 + (y - (Y0 + ROW * i)) * 0, width: Math.max(BAR_H, w), height: BAR_H, borderRadius: BAR_H / 2,
            background: barColor > 0.5 ? S.accent : '#3a3a3f', boxShadow: isHero && focus > 0.3 ? S.shadow : undefined,
          }} />
          <div style={{
            position: 'absolute', left: BAR_X + Math.max(BAR_H, w) + 30, top: 0, height: ROW, display: 'flex', alignItems: 'center',
            transform: `scale(${isHero ? mix(1, 1.3, focus) : 1})`, transformOrigin: '0 50%',
          }}>
            <span style={{ ...textBase(58, 900), color: isHero && focus > 0.5 ? S.accent : dim > 0.5 ? S.faint : S.ink, fontVariantNumeric: 'tabular-nums' }}>{fmt(shown)}</span>
          </div>
        </div>;
      })}
    </Handoff>
  </Frame>;
};
