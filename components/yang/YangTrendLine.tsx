// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T15e-TrendLine.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （官网视觉库公开下载，公开日 2026-10-27；2026-10-30 下载归档于 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip）。
// 用途：折线走势（正版 T15e）——一条折线逐段画出、线头圆点领走，关键点落下数值标签胶囊；可带一条浅灰对比线。
// 集成注记：原包 Sfx 音效文件未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；Brand 角标未集成；
// kit 的 p/q/springAt/textWidth/cueAt 与 Frame/Pill/Handoff 已内嵌移植，逻辑与原版一致。
// 舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。defaults 是原版节目（DeepSWE）的示例数据，使用时必须传自己的真实数据。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

// —— kit/theme 最小移植（MIT，逻辑逐字） ——
const S = {
  ink: '#19191c',
  dark: '#19191c',
  muted: '#6c6c72',
  faint: '#a3a3ab',
  accent: '#8554E8',
  accentDark: '#D6BEFF',
  shadow: '0 16px 25px 0 rgba(0,0,0,0.1333333333)',
  capsuleShadow: '30px 22px 25px #0005',
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
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
const cueAt = (cues: readonly number[] | undefined, i: number, fallback: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fallback;

// —— kit/ui 最小移植（Frame/Pill/Handoff/textBase，去 Brand 与 Fonts） ——
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900): React.CSSProperties => ({
  fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
type Box = { x: number; y: number; w: number; h: number };
function Frame({ children, background }: { children: React.ReactNode; background?: string }) {
  const { width } = useVideoConfig();
  return <AbsoluteFill style={{
    background: background ?? '#fff', overflow: 'hidden', fontFamily: FONT,
    fontWeight: 500, fontSynthesis: 'none', color: S.ink,
  }}>
    <div style={{ position: 'absolute', width: 1920, height: 1080, transform: `scale(${width / 1920})`, transformOrigin: '0 0', overflow: 'hidden' }}>
      {children}
    </div>
  </AbsoluteFill>;
}
function Surface({ box, dark = false, radius = 24, shadow = S.shadow, style, children }: {
  box: Box; dark?: boolean; radius?: number; shadow?: string; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  return <div style={{
    position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h,
    background: dark ? S.dark : '#fff', color: dark ? '#fff' : S.ink, border: 'none',
    borderRadius: radius, boxShadow: shadow, overflow: 'hidden', ...style,
  }}>{children}</div>;
}
function Pill({ box, dark = true, shadow = S.capsuleShadow, style, children }: {
  box: Box; dark?: boolean; shadow?: string; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  return <Surface box={box} dark={dark} radius={Math.min(box.w, box.h) / 2} shadow={shadow}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>{children}</Surface>;
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

export type YangTrendPoint = { x: number; y: number };
export type YangTrendSeries = { name: string; points: YangTrendPoint[]; ref?: boolean };   // ref=true：浅灰对比线
export type YangTrendLabel = { series: number; at: number; text: string };             // at = 该序列里点的序号
export type YangTrendLineProps = YangHandoffProps & {
  series: YangTrendSeries[];            // 1–3 条，每条 2–8 个点
  labels: YangTrendLabel[];             // 关键点标签（建议 1–4 个）
  highlight: number;                // labels 里主角的序号（圆点和标签里的字染紫）
  xDomain?: [number, number] | null;   // 不传（或 null）则按数据范围
  yDomain?: [number, number] | null;
  xTicks?: number[] | null;         // 少量刻度，不传（或 null）取等分 4 个；传 [] 则不画横轴刻度
  yTicks?: number[] | null;
  xPrefix: string;
  xSuffix: string;
  yPrefix: string;
  ySuffix: string;
  xTitle?: string;                  // 横轴一句话（放在刻度下、右对齐）
  yTitle?: string;                  // 纵轴一句话（放在左上）
  cues?: number[];                  // [0]=主线开始画；[1…]=各标签落下的时间（默认跟线头走）
  stageColor?: string;              // 舞台底色（默认原版浅底 #fff）
};

// 原版示例数据：原版 107 期 DeepSWE「得分—单任务成本」图（仅作 defaults 演示，使用时请传真实数据）。
export const yangTrendLineDefaults: YangTrendLineProps = {
  series: [
    { name: 'GPT-6.1 Sol', points: [{ x: 0.17, y: 64.5 }, { x: 0.4, y: 73 }, { x: 0.63, y: 75.4 }, { x: 0.78, y: 72 }, { x: 1.57, y: 72 }] },
    { name: 'GPT-6 Sol', ref: true, points: [{ x: 0.17, y: 37.4 }, { x: 0.37, y: 56.7 }, { x: 0.62, y: 65.3 }, { x: 1.0, y: 66.7 }, { x: 2.73, y: 69.0 }] },
  ],
  labels: [{ series: 0, at: 2, text: '75.4%' }, { series: 1, at: 4, text: '69.0%' }],
  highlight: 0,
  xDomain: [0, 3],
  yDomain: [30, 80],
  xTicks: [0, 1, 2, 3],
  yTicks: [40, 60, 80],
  xPrefix: '$',
  xSuffix: '',
  yPrefix: '',
  ySuffix: '%',
  xTitle: '单任务成本',
  yTitle: '得分',
};

const PL = 300, PR = 1620, PT = 340, PB = 890;
const REF = '#c4c4cb';

const fmt = (v: number) => {
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? String(r) : String(r);
};
// smoothstep 的反函数（二分），用来算“线头走到某个比例的时刻”
const invSmooth = (y: number) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 28; i++) { const m = (lo + hi) / 2; (m * m * (3 - 2 * m) < y ? (lo = m) : (hi = m)); }
  return (lo + hi) / 2;
};

export const YangTrendLine: React.FC<Partial<YangTrendLineProps>> = (props) => {
  const c = { ...yangTrendLineDefaults, ...props };
  const t = useT();
  const series = c.series.slice(0, 3).map((s) => ({ ...s, points: [...s.points].sort((a, b) => a.x - b.x) })).filter((s) => s.points.length >= 2);
  const allPts = series.flatMap((s) => s.points);
  const xs = allPts.map((d) => d.x), ys = allPts.map((d) => d.y);
  // 没给范围/刻度时：按数据取“整齐”的范围和 3–5 个刻度
  const nice = (span: number) => { const e = Math.pow(10, Math.floor(Math.log10(Math.max(span, 1e-9)))); const m = span / e; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * e; };
  const xmn = Math.min(...xs), xmx = Math.max(...xs), ymn = Math.min(...ys), ymx = Math.max(...ys);
  const xStep = nice((xmx - xmn) / 4), yStep = nice((ymx - ymn) / 3);
  const [x0, x1] = c.xDomain ?? [Math.floor(xmn / xStep) * xStep, Math.ceil(xmx / xStep) * xStep];
  const [y0, y1] = c.yDomain ?? [ymn >= 0 ? Math.max(0, Math.floor((ymn - yStep * 0.3) / yStep) * yStep) : Math.floor((ymn - yStep * 0.3) / yStep) * yStep, Math.ceil(ymx / yStep) * yStep + yStep * 0.4];
  const autoTicks = (lo: number, hi: number, step: number) => { const out: number[] = []; for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6); return out; };
  const xTicks = c.xTicks ?? autoTicks(x0, x1, xStep);
  const yTicks = c.yTicks ?? autoTicks(y0, y1, yStep).filter((_, i, a) => a.length <= 5 || i % 2 === 0);
  const X = (v: number) => PL + ((v - x0) / Math.max(1e-9, x1 - x0)) * (PR - PL);
  const Y = (v: number) => PB - ((v - y0) / Math.max(1e-9, y1 - y0)) * (PB - PT);

  // —— 时间线：浅灰线先起，主线接着画；标签落下的时刻跟线头走 ——
  const lineAt = cueAt(c.cues, 0, 0.6);
  const timing = series.map((s) => (s.ref ? { start: Math.max(0.2, lineAt - 0.3), dur: 2.4 } : { start: lineAt, dur: 3.0 }));

  const geo = series.map((s, si) => {
    const pts = s.points.map((d) => ({ x: X(d.x), y: Y(d.y) }));
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1] || 1;
    const d = pts.map((pt, i) => `${i ? 'L' : 'M'}${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`).join(' ');
    const f = q(t, timing[si].start, timing[si].start + timing[si].dur);
    const len = f * total;
    let k = 1;
    while (k < cum.length - 1 && cum[k] < len) k++;
    const seg = cum[k] - cum[k - 1] || 1;
    const u = clamp((len - cum[k - 1]) / seg);
    const head = { x: mix(pts[k - 1].x, pts[k].x, u), y: mix(pts[k - 1].y, pts[k].y, u) };
    return { pts, cum, total, d, f, head };
  });

  // 标签
  const labels = c.labels.slice(0, 4).map((l, i) => {
    const g = geo[l.series];
    if (!g || !g.pts[l.at]) return null;
    const frac = g.cum[l.at] / g.total;
    const tm = timing[l.series];
    const defAt = tm.start + tm.dur * invSmooth(frac) + 0.02;
    return { ...l, i, pt: g.pts[l.at], at: cueAt(c.cues, 1 + i, Math.min(defAt, 5.2)) };
  }).filter((l): l is NonNullable<typeof l> => !!l);
  const hi = labels.find((l) => l.i === c.highlight);

  const legendX0 = PL;
  let lx = legendX0;
  // 图例字号按总宽自适应（最长不超过 1800）
  const legendAvail = 1800 - legendX0 - series.length * 82 - (series.length - 1) * 64;
  const legendSize = Math.max(28, Math.min(44, legendAvail / Math.max(1, series.reduce((a, s) => a + textWidth(s.name, 1), 0))));
  const legend = series.map((s, si) => {
    const w = 64 + 18 + textWidth(s.name, legendSize);
    const item = { x: lx, w, name: s.name, si };
    lx += w + 64;
    return item;
  });

  return <Frame background={c.stageColor ?? '#fff'}>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 纵轴一句话、图例 */}
      {c.yTitle && <div style={{ position: 'absolute', left: 100, top: 192, ...textBase(44, 500), color: S.muted, opacity: p(t, 0, 0.5) }}>{c.yTitle}</div>}
      {legend.map((it) => {
        const s = series[it.si];
        const a = p(t, timing[it.si].start, timing[it.si].start + 0.45);
        return <div key={it.si} style={{ position: 'absolute', left: it.x, top: 190, height: 56, display: 'flex', alignItems: 'center', gap: 18, opacity: a }}>
          <div style={{ width: 64, height: 9, borderRadius: 5, background: s.ref ? REF : S.ink }} />
          <span style={{ ...textBase(legendSize, 500), color: s.ref ? S.muted : S.ink }}>{s.name}</span>
        </div>;
      })}

      {/* 极简坐标：只有基线和少量刻度 */}
      <div style={{ position: 'absolute', left: PL, top: PB, width: (PR - PL) * p(t, 0, 0.7), height: 4, borderRadius: 2, background: S.ink, opacity: 0.85 }} />
      {yTicks.map((v, i) => <div key={`y${i}`} style={{
        position: 'absolute', left: PL - 28 - textWidth(`${c.yPrefix}${fmt(v)}${c.ySuffix}`, 44) - 20, top: Y(v) - 26, width: textWidth(`${c.yPrefix}${fmt(v)}${c.ySuffix}`, 44) + 20,
        ...textBase(44, 500), color: S.faint, textAlign: 'right', opacity: p(t, 0.1 + i * 0.05, 0.6 + i * 0.05),
      }}>{`${c.yPrefix}${fmt(v)}${c.ySuffix}`}</div>)}
      {xTicks.map((v, i) => {
        const s = `${c.xPrefix}${fmt(v)}${c.xSuffix}`;
        return <div key={`x${i}`} style={{ position: 'absolute', left: X(v) - textWidth(s, 44) / 2 - 10, top: PB + 22, width: textWidth(s, 44) + 20, ...textBase(44, 500), color: S.faint, textAlign: 'center', opacity: p(t, 0.1 + i * 0.05, 0.6 + i * 0.05) }}>{s}</div>;
      })}
      {c.xTitle && <div style={{ position: 'absolute', left: PR - textWidth(c.xTitle, 44) - 20, top: PB + 86, width: textWidth(c.xTitle, 44) + 20, textAlign: 'right', ...textBase(44, 500), color: S.muted, opacity: p(t, 0.2, 0.7) }}>{c.xTitle}</div>}

      {/* 折线：strokeDashoffset 画出；浅灰对比线在下层 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
        {[...series.keys()].sort((a, b) => Number(!!series[b].ref) - Number(!!series[a].ref)).map((si) => {
          const g = geo[si], s = series[si];
          if (g.f <= 0.001) return null;
          const done = p(t, timing[si].start + timing[si].dur, timing[si].start + timing[si].dur + 0.3);
          return <g key={si}>
            <path d={g.d} fill="none" pathLength={1} stroke={s.ref ? REF : S.ink} strokeWidth={s.ref ? 10 : 13}
              strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - g.f} />
            {done < 1 && <circle cx={g.head.x} cy={g.head.y} r={mix(s.ref ? 11 : 17, 0, done)} fill={s.ref ? REF : S.ink} />}
          </g>;
        })}
      </svg>

      {/* 关键点：圆点按下 + 标签胶囊落定 */}
      {labels.map((l) => {
        const isHi = l.i === c.highlight;
        const dot = Math.max(0, springAt(t, l.at - 0.05, 0.5));
        const land = springAt(t, l.at, 0.7);
        const size = 54;
        const w = textWidth(l.text, size) + size * 1.4, h = 100;
        const above = l.pt.y - 34 - h > 130 || l.pt.x < 1500;
        const top = above ? l.pt.y - 36 - h : l.pt.y + 36;
        const left = clamp(l.pt.x - w / 2, 120, 1840 - w);
        const ring = p(t, l.at, l.at + 0.8);
        return <React.Fragment key={l.i}>
          {isHi && ring > 0 && ring < 1 && <div style={{ position: 'absolute', left: l.pt.x - (16 + 44 * ring), top: l.pt.y - (16 + 44 * ring), width: 2 * (16 + 44 * ring), height: 2 * (16 + 44 * ring), borderRadius: 999, border: `${5 * (1 - ring) + 1}px solid ${S.accent}`, opacity: 1 - ring }} />}
          <div style={{ position: 'absolute', left: l.pt.x - 16 * dot, top: l.pt.y - 16 * dot, width: 32 * dot, height: 32 * dot, borderRadius: 999, background: isHi ? S.accent : S.ink, boxShadow: `0 0 0 ${6 * dot}px #fff` }} />
          <Pill box={{ x: left, y: top + (1 - clamp(land)) * (above ? -34 : 34), w, h }} style={{ opacity: clamp(land * 3), transform: `scale(${mix(0.78, 1, clamp(land))})` }}>
            <span style={{ ...textBase(size, 400), color: isHi ? S.accentDark : '#fff' }}>{l.text}</span>
          </Pill>
        </React.Fragment>;
      })}
    </Handoff>
  </Frame>;
};
