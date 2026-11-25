/**
 * YangStepRail — 顶部常驻步骤轨（T03h 机制提炼）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source: member package episode-scenes-112-125-20261018, `episodes/113/src/components/e113.tsx`
 * (StepRail; C 类，catalog 条目 T03h「总览步骤轨收到顶部常驻，下方录屏逐步点亮」，
 * 另见 scenes `B-ch3.tsx` / `GroupC.tsx` 的用法）；集成 2026-11-16（见 INDEX.md）。
 * Integration notes: 只取视觉机制、本库参数化重写；实测轨代码不搬运；Sfx/Brand/素材不带；
 * 字体 → 库内 FONT；配色默认对齐 HouseTheme（C），标志性视觉作可覆盖 prop 默认值。
 *
 * Mechanics: 一排带序号圆章的步骤胶囊，居中横排。当前步与已过步为深色胶囊
 * （当前步序号圆用 accent 色，点亮时 0.3s 过渡＋轻微放大脉冲），未到步为白色胶囊、
 * 文字略压暗。position='center' 为大号居中建立态（S13 末态），position='top'（默认）
 * 为小号顶部常驻态（S14–S17 进度轨）；两态几何与原版 RAIL_BIG / RAIL_SMALL 一致。
 * 本件为透明底覆盖层（不画背景），宿主把它叠在场景画面上方作进度轨。
 * Layout: 1920×1080 logical stage, scaled by host width (Frame).
 */
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from '../src/theme';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const p = (t: number, a: number, b: number) => easeOut(clamp((t - a) / (b - a)));
const q = (t: number, a: number, b: number) => easeInOut(clamp((t - a) / (b - a)));
const settle = (t: number, a: number, d: number) => easeOut(clamp((t - a) / d));
const isW = (ch: string) => /[一-鿿＀-￯]/.test(ch);
function textWidth(text: string, size: number) { let w = 0; for (const ch of text) w += isW(ch) ? 0.94 : 0.56; return w * size; }
const textBase = (size: number, weight = 500): React.CSSProperties => ({
  fontFamily: FONT, fontSize: size, fontWeight: weight, lineHeight: 1.16, letterSpacing: 0, whiteSpace: 'nowrap',
});
function useT() { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return f / fps; }
function Frame({ children }: { children: React.ReactNode }) {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${width / 1920})`, transformOrigin: '0 0' }}>
        {children}
      </div>
    </AbsoluteFill>
  );
}
export type YangHandoffProps = { enter?: number; exit?: number; exitAt?: number };
function Handoff({ enter = 0, exit = 0, exitAt = 0, children }: YangHandoffProps & { children: React.ReactNode }) {
  const t = useT();
  const k = enter > 0 ? q(t, 0, enter) : 1;
  const out = exit > 0 ? q(t, exitAt, exitAt + exit) : 0;
  const ty = (1 - k) * 46 - out * 46;
  const blur = (1 - k) * 8 + out * 8;
  return <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, k * 1.6) * (1 - out), transform: `translateY(${ty}px)`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>{children}</div>;
}

export type YangStepRailProps = YangHandoffProps & {
  /** 每步标签（序号自动按 1..n） */
  steps: string[];
  /** 当前步（0-based；-1 = 都未点亮） */
  activeIndex: number;
  /** 'top' 顶部常驻小号（默认）/ 'center' 居中大号建立态 */
  position?: 'top' | 'center';
  /** 胶囊字号；默认 top=30、center=58（原版 RAIL_SMALL / RAIL_BIG） */
  size?: number;
  /** 轨中心 y；默认 top=82、center=560 */
  top?: number;
  /** 步间距（px）；默认 size*0.9 */
  stepGap?: number;
  /** 每颗胶囊出现时刻（秒，逐个砸下用）；不传 = 全部已出现 */
  appearSec?: number[];
  /** 当前步点亮时刻（秒，0.3s 过渡）；默认 0 */
  litAt?: number;
  /** 深色胶囊底（默认 HouseTheme C.base） */
  activeBg?: string;
  /** 深色胶囊文字色（默认白） */
  activeColor?: string;
  /** 白色胶囊底（默认白） */
  inactiveBg?: string;
  /** 白色胶囊文字色（默认 C.base） */
  inactiveColor?: string;
  /** 当前步序号圆底色（默认 HouseTheme C.brass；原版为白色圆，改 accent 便于一眼认出当前步） */
  accent?: string;
};

export const yangStepRailDefaults: YangStepRailProps = {
  steps: ['选题', '找素材', '写稿', '配音字幕', '剪辑', '封面发布'],
  activeIndex: 0,
  position: 'top',
};

export function YangStepRail(props: Partial<YangStepRailProps>) {
  const c = { ...yangStepRailDefaults, ...props };
  const t = useT();
  const n = c.steps.length;
  const cur = c.activeIndex;
  const size = c.size ?? (c.position === 'center' ? 58 : 30);
  const cy = c.top ?? (c.position === 'center' ? 560 : 82);
  const activeBg = c.activeBg ?? C.base;
  const activeColor = c.activeColor ?? '#fff';
  const inactiveBg = c.inactiveBg ?? '#fff';
  const inactiveColor = c.inactiveColor ?? C.base;
  const accent = c.accent ?? C.brass;
  const litAt = c.litAt ?? 0;

  // 几何与原版 railGeom 一致：H=字号*1.9，圆章直径=H*0.66，间距默认字号*0.9
  const H = size * 1.9, D = H * 0.66, gap = c.stepGap ?? size * 0.9;
  const ws = c.steps.map((s) => H * 0.22 + D + size * 0.36 + textWidth(s, size) * 1.03 + H * 0.42);
  const total = ws.reduce((a, b) => a + b, 0) + gap * (n - 1);
  let x = 960 - total / 2;
  const lit = p(t, litAt, litAt + 0.3);

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        {c.steps.map((s, i) => {
          const left = x; x += ws[i] + gap;
          const ap = c.appearSec ? settle(t, c.appearSec[i], 0.45) : 1;
          if (c.appearSec && t < c.appearSec[i]) return null;
          const on = i === cur ? lit : 0;
          const past = i < cur;
          const dark = on > 0.5 || past;
          const dim = cur >= 0 && i > cur;
          const isCur = i === cur;
          return (
            <div key={i} style={{
              position: 'absolute', left, top: cy - H / 2, width: ws[i], height: H, borderRadius: H / 2,
              background: dark ? activeBg : inactiveBg,
              boxShadow: c.position === 'top' ? '0 8px 18px rgba(0,0,0,0.18)' : '0 18px 36px rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', paddingLeft: H * 0.17, gap: size * 0.36,
              opacity: clamp(ap * 3) * (dim ? 0.92 : 1),
              transform: `translateY(${(1 - clamp(ap)) * 40}px) scale(${1 + 0.05 * Math.sin(Math.PI * on)})`,
            }}>
              <div style={{
                width: D, height: D, borderRadius: D / 2,
                background: dark ? (isCur ? accent : '#fff') : activeBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
              }}>
                <span style={{ ...textBase(size * 0.62, 900), color: dark ? (isCur ? C.dark : C.base) : '#fff', lineHeight: 1 }}>{i + 1}</span>
              </div>
              <span style={{ ...textBase(size, 900), color: dark ? activeColor : (dim ? '#b9b9bf' : inactiveColor) }}>{s}</span>
            </div>
          );
        })}
      </Handoff>
    </Frame>
  );
}
