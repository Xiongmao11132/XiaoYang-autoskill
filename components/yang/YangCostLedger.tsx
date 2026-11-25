// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T15d-CostLedger.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：费用账单（正版 T15d）：一张账单卡，条目逐行出现；每出现一行，它的金额复制一份紫字飞进
// 底部黑色总计条，总计数字同步累加滚动；最后一行落定，总计停住。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/quintic 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；
// 默认条目已换中性示例。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
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

export type YangCostRow = { label: string; amount: number };
export type YangCostLedgerProps = YangHandoffProps & {
  title: string;
  rows: YangCostRow[];       // 2–6 行
  totalLabel: string;
  prefix?: string;           // 金额前缀，如 ¥ / $
  cues?: number[];           // [i]=第 i 行出现
};

export const yangCostLedgerDefaults: YangCostLedgerProps = {
  title: '这次尝试的成本',
  rows: [
    { label: '工具订阅', amount: 68 },
    { label: '素材采购', amount: 120 },
    { label: '外包剪辑', amount: 300 },
    { label: '投放测试', amount: 200 },
  ],
  totalLabel: '合计',
  prefix: '¥',
};

const CARD = { x: 460, y: 120, w: 1000 };
const ROW_H = 96;

export const YangCostLedger: React.FC<Partial<YangCostLedgerProps>> = (props) => {
  const c = { ...yangCostLedgerDefaults, ...props };
  const rows = (c.rows.length >= 1 ? c.rows : yangCostLedgerDefaults.rows).slice(0, 6);
  const n = rows.length;
  const t = useT();
  const barTop = 150 + n * ROW_H + 26;
  const cardH = barTop + 118 + 28;
  const cardY = Math.max(70, 540 - cardH / 2);
  const at = (i: number) => (c.cues && typeof c.cues[i] === 'number' ? c.cues[i] : 0.45 + i * 0.62);
  const FLY = 0.5;
  const flying = rows.map((r, i) => {
    const v = q(t, at(i) + 0.08, at(i) + FLY);
    return v > 0 && v < 1 ? v : -1;
  });
  const partial = rows.reduce((a, r, i) => {
    if (t < at(i) + 0.08) return a;
    const v = q(t, at(i) + 0.08, at(i) + FLY);
    return a + r.amount * v;
  }, 0);
  const shownTotal = Math.round(partial);
  const totalY = cardY + barTop + 59;
  const fmt = (v: number) => `${c.prefix ?? ''}${Math.round(v)}`;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: CARD.x, top: cardY, width: CARD.w, height: cardH, borderRadius: 28,
        background: '#fff', boxShadow: S.shadow, opacity: p(t, 0, 0.4),
      }}>
        <div style={{ position: 'absolute', left: 56, top: 44, ...textBase(54, 900), color: S.ink }}>{c.title}</div>
        {rows.map((r, i) => {
          const show = p(t, at(i), at(i) + 0.3);
          const y = 150 + i * ROW_H;
          return <div key={i} style={{ position: 'absolute', left: 0, top: y, width: CARD.w, height: ROW_H, opacity: show, transform: `translateY(${(1 - show) * 12}px)` }}>
            <div style={{ position: 'absolute', left: 56, top: 0, height: ROW_H, display: 'flex', alignItems: 'center' }}>
              <span style={{ ...textBase(46, 600), color: S.ink }}>{r.label}</span>
            </div>
            <div style={{ position: 'absolute', right: 56, top: 0, height: ROW_H, display: 'flex', alignItems: 'center' }}>
              <span style={{ ...textBase(46, 900), color: S.ink, fontVariantNumeric: 'tabular-nums' }}>{fmt(r.amount)}</span>
            </div>
            {i < n - 1 && <div style={{ position: 'absolute', left: 56, right: 56, bottom: 0, height: 2, background: '#ececf0' }} />}
          </div>;
        })}
        <div style={{
          position: 'absolute', left: 28, right: 28, top: barTop, height: 118, borderRadius: 59,
          background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 44px',
        }}>
          <span style={{ ...textBase(48, 600), color: '#fff' }}>{c.totalLabel}</span>
          <span style={{ ...textBase(62, 900), color: S.accentDark, fontVariantNumeric: 'tabular-nums' }}>{fmt(shownTotal)}</span>
        </div>
      </div>
      {rows.map((r, i) => {
        const v = flying[i];
        if (v < 0) return null;
        const sx = CARD.x + CARD.w - 56 - 90, sy = cardY + 150 + i * ROW_H + ROW_H / 2;
        const tx = CARD.x + CARD.w - 150, ty = totalY;
        const x = mix(sx, tx, v), y = mix(sy, ty, v) - Math.sin(Math.PI * v) * 46;
        return <div key={i} style={{
          position: 'absolute', left: x - 90, top: y - 30, width: 180, textAlign: 'center',
          opacity: 1 - q(t, at(i) + FLY - 0.12, at(i) + FLY), transform: `scale(${mix(1, 0.8, v)})`, zIndex: 30,
        }}>
          <span style={{ ...textBase(46, 900), color: S.accent, fontVariantNumeric: 'tabular-nums' }}>{fmt(r.amount)}</span>
        </div>;
      })}
    </Handoff>
  </Frame>;
};
