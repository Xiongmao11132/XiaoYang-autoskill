// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T14f-Gauge.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：仪表读数（正版 T14f）——一个仪表盘 → 指针走到读数，所在区间被点亮。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT（等宽走系统等宽栈）；
// Brand 角标未集成（Frame 的 brand 入参仅兼容、忽略）；kit 的 theme/ui 已内嵌移植（见下），逻辑与原版一致；
// defaults 保留原包示例数据（原版节目示例），使用时请传真实数据。
// 舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。调色板保留原版设计。
import React from 'react';
import { AbsoluteFill, Easing, Img, OffthreadVideo, staticFile, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const MONO = "'SF Mono', 'Cascadia Code', Consolas, 'Courier New', monospace";

// —— kit/theme 最小移植（MIT，逻辑逐字；字体名映射到本库 FONT 与系统等宽栈） ——
const S = {
  ink: '#19191c',
  dark: '#19191c',
  windowBody: '#212123',
  windowBar: '#161618',
  muted: '#6c6c72',
  faint: '#a3a3ab',
  accent: '#8554E8',
  accentDark: '#D6BEFF',
  radius: 24,
  shadow: '0 16px 25px 0 rgba(0,0,0,0.1333333333)',
  capsuleShadow: '30px 22px 25px #0005',
  windowShadow: '-25px 6px 35px #0003',
  textShadowDark: '8px 9px 5px #000',
  body: FONT,
  display: FONT,
  mono: MONO,
  kai: FONT,
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const q = (t: number, a: number, b: number) => {
  const v = clamp((t - a) / (b - a));
  return v * v * (3 - 2 * v);
};
const chapterCurve = Easing.bezier(0.65, 0, 0.2, 1);
const wipe = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: chapterCurve, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
const quintic = (t: number, a: number, b: number) => {
  const v = clamp((t - a) / (b - a));
  return v * v * v * (v * (6 * v - 15) + 10);
};
const typed = (s: string, t: number, a: number, b: number) => {
  const chars = Array.from(s);
  return chars.slice(0, Math.floor(clamp((t - a) / (b - a)) * chars.length)).join('');
};
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
const cameraTransform = (focusX: number, focusY: number, zoom: number, push: number) => {
  const fx = mix(960, focusX, push), fy = mix(540, focusY, push), z = mix(1, zoom, push);
  return `translate(960px, 540px) scale(${z}) translate(${-fx}px, ${-fy}px)`;
};
const cueAt = (cues: readonly number[] | undefined, i: number, fallback: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fallback;
const accentOn = (dark: boolean) => (dark ? S.accentDark : S.accent);
const inkOn = (dark: boolean) => (dark ? '#fff' : S.ink);

// —— kit/ui 最小移植（Frame/Surface/Pill/MacWindow/Media/Cursor/ClickRing/Handoff/textBase，去 Brand、Fonts 与 Sfx） ——
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900, family: string = FONT): React.CSSProperties => ({
  fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
type Box = { x: number; y: number; w: number; h: number };
const abs = ({ x, y, w, h }: Box): React.CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h });
const between = (a: Box, b: Box, t: number): Box => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) });
const center: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center' };
function Frame({ children, dark = false, background }: { children: React.ReactNode; brand?: boolean; dark?: boolean; background?: string }) {
  const { width } = useVideoConfig();
  return <AbsoluteFill style={{
    background: background ?? (dark ? S.dark : '#fff'), overflow: 'hidden', fontFamily: FONT,
    fontWeight: 500, fontSynthesis: 'none', color: dark ? '#fff' : S.ink,
  }}>
    <div style={{ position: 'absolute', width: 1920, height: 1080, transform: `scale(${width / 1920})`, transformOrigin: '0 0', overflow: 'hidden' }}>
      {children}
    </div>
  </AbsoluteFill>;
}
function Surface({ box, dark = false, radius = S.radius, shadow = S.shadow, style, children }: {
  box: Box; dark?: boolean; radius?: number; shadow?: string; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  return <div style={{
    ...abs(box), background: dark ? S.dark : '#fff', color: dark ? '#fff' : S.ink, border: 'none',
    borderRadius: radius, boxShadow: shadow, overflow: 'hidden', ...style,
  }}>{children}</div>;
}
function Pill({ box, dark = true, shadow = S.capsuleShadow, style, children }: {
  box: Box; dark?: boolean; shadow?: string; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  return <Surface box={box} dark={dark} radius={Math.min(box.w, box.h) / 2} shadow={shadow} style={{ ...center, ...style }}>{children}</Surface>;
}
function MacWindow({ box, light = false, bar = 90, radius = 36, shadow, style, children, title }: {
  box: Box; light?: boolean; bar?: number; radius?: number; shadow?: string; style?: React.CSSProperties; children?: React.ReactNode; title?: string;
}) {
  const dot = Math.round(bar * 0.267);
  return <div style={{
    ...abs(box), borderRadius: radius, overflow: 'hidden', background: light ? '#fff' : S.windowBody,
    boxShadow: shadow ?? (light ? S.shadow : S.windowShadow), ...style,
  }}>
    <div style={{ height: bar, background: light ? '#f4f4f6' : S.windowBar, display: 'flex', alignItems: 'center', gap: dot, paddingLeft: bar * 0.63, position: 'relative' }}>
      {[S.accent, '#aaa', light ? '#ddd' : '#eee'].map((c) => <span key={c} style={{ width: dot, height: dot, borderRadius: dot, background: c }} />)}
      {title && <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: bar * 0.36, color: light ? S.muted : '#8d8d93', fontWeight: 500 }}>{title}</div>}
    </div>
    <div style={{ position: 'absolute', left: 0, top: bar, right: 0, bottom: 0 }}>{children}</div>
  </div>;
}
function Media({ src, box, radius = S.radius, fit = 'cover', start = 0, style, objectPosition }: {
  src: string; box: Box; radius?: number; fit?: 'cover' | 'contain'; start?: number; style?: React.CSSProperties; objectPosition?: string;
}) {
  const { fps } = useVideoConfig();
  if (!src) {
    // 空串＝中性骨架占位面（原包示例素材不集成，传真实素材路径即走原图）
    return <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #eef1f5 0%, #d7dde6 60%, #bfc9d6 100%)' }} />
      <div style={{ position: 'absolute', left: '6%', top: '8%', width: '46%', height: '7%', borderRadius: 12, background: 'rgba(90,100,115,0.35)' }} />
      <div style={{ position: 'absolute', left: '6%', top: '22%', width: '78%', height: '4.5%', borderRadius: 9, background: 'rgba(90,100,115,0.22)' }} />
      <div style={{ position: 'absolute', left: '6%', top: '31%', width: '70%', height: '4.5%', borderRadius: 9, background: 'rgba(90,100,115,0.22)' }} />
    </div>;
  }
  const image = /\.(png|jpe?g|webp)$/i.test(src);
  const inner: React.CSSProperties = { width: '100%', height: '100%', objectFit: fit, objectPosition, display: 'block' };
  return <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', ...style }}>
    {image ? <Img src={staticFile(src)} style={inner} /> : <OffthreadVideo muted src={staticFile(src)} startFrom={Math.round(start * fps)} style={inner} />}
  </div>;
}

// 中性占位图：src 为空串时以浅灰骨架面顶替（几何/定位与原 Img 一致），传真实素材路径时即原图。
function ImgFill({ src, style }: { src: string; style: React.CSSProperties }) {
  if (!src) {
    return <div style={{ ...style, objectFit: undefined, objectPosition: undefined, background: 'linear-gradient(160deg, #eef1f5 0%, #d7dde6 60%, #bfc9d6 100%)' }} />;
  }
  return <Img src={staticFile(src)} style={style} />;
}
function Cursor({ x, y, scale = 1, press = 0, style }: { x: number; y: number; scale?: number; press?: number; style?: React.CSSProperties }) {
  return <svg width={65 * scale} height={80 * scale} viewBox="0 0 52 64" style={{
    position: 'absolute', left: x, top: y, filter: 'drop-shadow(0 4px 5px #0003)', transform: `scale(${1 - 0.12 * press})`, transformOrigin: '10% 5%', zIndex: 800, ...style,
  }}>
    <path d="M5 3 L5 50 L17 38 L27 60 L37 55 L27 34 L44 34 Z" fill="#171719" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
  </svg>;
}
function ClickRing({ x, y, t, at, dark = false }: { x: number; y: number; t: number; at: number; dark?: boolean }) {
  const v = Math.max(0, Math.min(1, (t - at) / 0.45));
  if (v <= 0 || v >= 1) return null;
  const r = 18 + 52 * v;
  return <div style={{
    position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r,
    border: `${6 * (1 - v) + 1}px solid ${dark ? S.accentDark : S.accent}`, opacity: 1 - v, zIndex: 790,
  }} />;
}
export type YangHandoffEnter = 'cut' | 'fade' | 'rise' | 'grow';
export type YangHandoffExit = 'none' | 'recede' | 'fade' | 'cut' | 'slide-left' | 'slide-up';
export type YangHandoffProps = { enter?: YangHandoffEnter; exit?: YangHandoffExit; exitAt?: number };
function Handoff({ enter = 'cut', exit = 'none', enterAt = 0, enterDur = 0.45, exitAt, exitDur = 0.5, children }: {
  enter?: YangHandoffEnter; exit?: YangHandoffExit; enterAt?: number; enterDur?: number; exitAt?: number; exitDur?: number; children: React.ReactNode;
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

export type YangGaugeZone = { label: string; to: number };   // to = 这一档的上界；最后一档应等于 max
export type YangGaugeProps = YangHandoffProps & {
  value: number;
  min: number;
  max: number;
  decimals: number;
  prefix: string;
  suffix: string;
  zones: YangGaugeZone[];     // 2–4 档，按上界从小到大
  caption?: string;       // 读数下面的一句说明（含数据出处），可空
  cues?: number[];        // [0]=指针开始走；[1]=所在档亮起
};

// 真实素材：autotrust/JEV-27B 模型卡自称“六组基准平均 84.07（官方 Jev 1.13 为 83.85）”，未经独立验证（来自 113 期交接文件）。
// 档位 偏低 / 中等 / 较高 只是示意刻度，不是评测标准。
export const yangGaugeDefaults: YangGaugeProps = {
  value: 84.07,
  min: 0,
  max: 100,
  decimals: 2,
  prefix: '',
  suffix: '',
  zones: [{ label: '偏低', to: 60 }, { label: '中等', to: 80 }, { label: '较高', to: 100 }],
  caption: '六组基准平均分 · 模型卡自称，未独立验证',
};

const fmt = (v: number, d: number) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const glyph = (ch: string) => (/\d/.test(ch) ? 0.6 : /[.,:]/.test(ch) ? 0.3 : ch === '%' ? 0.86 : ch === ' ' ? 0.28 : /[\u0000-ÿ]/.test(ch) ? 0.62 : 1);
const numWidth = (s: string, size: number) => Array.from(s).reduce((w, ch) => w + glyph(ch) * size, 0);
function Num({ text, size, color }: { text: string; size: number; color: string }) {
  return <span style={{ ...textBase(size, 900), lineHeight: 1, display: 'inline-flex', color, fontVariantNumeric: 'tabular-nums' }}>
    {Array.from(text).map((ch, i) => <span key={i} style={{ display: 'inline-block', width: glyph(ch) * size, textAlign: 'center' }}>{ch}</span>)}
  </span>;
}
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixColor = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(mix(v, B[i], t))).join(',')})`; };

const CX = 960, CY = 690, RM = 450, SW = 96;
const TRACK = '#e1e1e6';

export function YangGauge(props: Partial<YangGaugeProps>) {
  const c = { ...yangGaugeDefaults, ...props };
  const t = useT();
  const span = Math.max(1e-9, c.max - c.min);
  const frac = (v: number) => clamp((v - c.min) / span);
  // 角度：0 = 最左端，π = 最右端（沿上半圆顺时针）
  const th = (f: number) => Math.PI * (1 - f);                 // 数学角
  const P = (f: number, r: number) => ({ x: CX + r * Math.cos(th(f)), y: CY - r * Math.sin(th(f)) });
  const zones = c.zones.slice(0, 4).map((z, i, arr) => ({ ...z, from: i === 0 ? c.min : arr[i - 1].to }));
  const target = clamp(c.value, c.min, c.max);
  const zi = Math.max(0, zones.findIndex((z) => target <= z.to + 1e-9));
  const GAPPX = 9;

  // —— 时间线 ——
  const needleAt = cueAt(c.cues, 0, 1.2);
  const needleDur = 1.5;
  const lightAt = cueAt(c.cues, 1, needleAt + needleDur + 0.2);
  const light = p(t, lightAt, lightAt + 0.5);
  const sweepP = quintic(t, needleAt, needleAt + needleDur);       // 0→1（读数滚动用，不过冲）
  const ov = 0.05;
  const needleF = frac(target) * (sweepP * (1 + ov) - ov * q(t, needleAt + needleDur, needleAt + needleDur + 0.4));
  const curVal = c.min + (target - c.min) * sweepP;
  const hubIn = p(t, 0.5, 1.0);
  const finalStr = `${c.prefix}${fmt(target, c.decimals)}${c.suffix}`;
  const numSize = Math.min(150, 760 / Math.max(1, numWidth(finalStr, 1)));

  // 指针：细长的三角体，尖端伸进色带
  const angle = (th(needleF) * 180) / Math.PI;                    // 数学角（度）
  const L = RM + 6, back = 40;
  const arcPath = (f0: number, f1: number, r: number) => {
    const a = P(f0, r), b = P(f1, r);
    return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${r} ${r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  };

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
        {zones.map((z, i) => {
          const g = GAPPX / RM;
          const f0 = frac(z.from) + (i === 0 ? 0 : g / (2 * Math.PI) * 1.0), f1 = frac(z.to) - (i === zones.length - 1 ? 0 : g / (2 * Math.PI) * 1.0);
          const grow = p(t, 0.12 + i * 0.12, 0.7 + i * 0.12);
          if (grow <= 0.001 || f1 <= f0) return null;
          const on = i === zi ? light : 0;
          const r = RM + on * 8;
          return <path key={i} d={arcPath(f0, f0 + (f1 - f0) * grow, r)} fill="none" stroke={mixColor(TRACK, S.accent, on)} strokeWidth={SW + on * 16} />;
        })}
      </svg>

      {/* 档位名：放在色带外侧，贴着弧线中点 */}
      {zones.map((z, i) => {
        const mid = (frac(z.from) + frac(z.to)) / 2;
        const pos = P(mid, RM + SW / 2 + 82);
        const size = 48;
        const w = textWidth(z.label, size);
        const on = i === zi ? light : 0;
        const a = p(t, 0.5 + i * 0.12, 0.95 + i * 0.12);
        const cosv = Math.cos(th(mid));
        const left = pos.x - w / 2 + cosv * (w / 2 + 6);
        return <div key={i} style={{ position: 'absolute', left, top: pos.y - size * 0.58, ...textBase(size, 900), color: mixColor(S.faint, S.ink, on), opacity: a, transform: `scale(${1 + 0.12 * on})`, transformOrigin: '50% 50%' }}>{z.label}</div>;
      })}

      {/* 两端刻度 */}
      {[c.min, c.max].map((v, i) => {
        const s = `${fmt(v, Number.isInteger(v) ? 0 : c.decimals)}${c.suffix.trim().length <= 1 ? c.suffix : ''}`;
        const w = numWidth(s, 44);
        return <div key={i} style={{ position: 'absolute', left: (i ? CX + RM : CX - RM) - w / 2, top: CY + 30, opacity: p(t, 0.4, 0.9) }}>
          <Num text={s} size={44} color={S.faint} />
        </div>;
      })}

      {/* 指针 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: hubIn, overflow: 'visible' }}>
        <g transform={`translate(${CX} ${CY}) rotate(${-angle})`} style={{ filter: 'drop-shadow(10px 10px 8px rgba(0,0,0,0.28))' }}>
          <path d={`M${L} 0 L0 -17 L${-back} -9 L${-back} 9 L0 17 Z`} fill={S.dark} />
        </g>
        <circle cx={CX} cy={CY} r={36} fill={S.dark} />
        <circle cx={CX} cy={CY} r={13} fill="#fff" />
      </svg>

      {/* 中央读数 */}
      <div style={{ position: 'absolute', left: CX - 360, top: CY + 90, width: 720, display: 'flex', justifyContent: 'center', opacity: p(t, 0.6, 1.1) }}>
        <Num text={`${c.prefix}${fmt(curVal, c.decimals)}${c.suffix}`} size={numSize} color={S.ink} />
      </div>
      {c.caption && <div style={{ position: 'absolute', left: 0, top: CY + 90 + numSize + 30, width: 1920, textAlign: 'center', ...textBase(Math.min(48, 1500 / Math.max(1, textWidth(c.caption, 1))), 500), color: S.muted, opacity: p(t, 0.8, 1.3) }}>{c.caption}</div>}
    </Handoff>
    
    
    
  </Frame>;
}
