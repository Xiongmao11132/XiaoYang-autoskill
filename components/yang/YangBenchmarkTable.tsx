// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T15h-BenchmarkTable.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：多方测评表（正版 T15h）——一张多列测评表 → 逐格落下对错和数值，最后一行合计亮出赢家。
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

export type YangBenchmarkCell = boolean | string;   // true=对勾，false=叉，字符串=数值
export type YangBenchmarkRow = { label: string; cells: YangBenchmarkCell[] };
export type YangBenchmarkTableProps = YangHandoffProps & {
  columns: string[];        // 被比较的几方（2–5）
  rows: YangBenchmarkRow[];     // 评测项（2–7 行）
  totalLabel: string;       // 合计行的名字
  totals?: string[];        // 每列合计；不传就按对勾数自动算（"3/4"）
  winner?: number;          // 赢家列；不传取对勾最多的一列
  cues?: number[];          // [0..n-1]=第 j 列开始落格；[n]=赢家抬起
};

// 示例内容（非实测）
export const yangBenchmarkTableDefaults: YangBenchmarkTableProps = {
  columns: ['方案甲', '方案乙', '方案丙'],
  rows: [
    { label: '上手快', cells: [true, true, false] },
    { label: '能自动执行', cells: [false, true, true] },
    { label: '价格可控', cells: [true, false, true] },
    { label: '结果稳定', cells: [false, true, false] },
    { label: '上手天数', cells: ['1 天', '3 天', '2 天'] },
  ],
  totalLabel: '合计',
};

const tw = (s: string, f: number) => Array.from(s).reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.68 : /[\u0000-ÿ]/.test(ch) ? 0.6 : 1) * f, 0);

// 对勾：黑圆章弹出，白勾沿路径画出
function Check({ d, pop, draw }: { d: number; pop: number; draw: number }) {
  return <div style={{ width: d, height: d, borderRadius: d / 2, background: S.dark, transform: `scale(${pop})`, boxShadow: '0 6px 12px #0003', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width={d * 0.62} height={d * 0.62} viewBox="0 0 24 24" style={{ overflow: 'visible' }}>
      <path d="M4 12.6 L9.8 18.2 L20.2 5.8" pathLength={1} fill="none" stroke="#fff" strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="1 1" strokeDashoffset={1 - draw} />
    </svg>
  </div>;
}
// 叉：淡灰两笔画出（不抢对勾）
function Cross({ d, draw }: { d: number; draw: number }) {
  const s = d * 0.5;
  return <svg width={s} height={s} viewBox="0 0 24 24" style={{ overflow: 'visible' }}>
    <path d="M5 5 L19 19" pathLength={1} stroke={S.faint} strokeWidth={4.2} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - clamp(draw * 2)} />
    <path d="M19 5 L5 19" pathLength={1} stroke={S.faint} strokeWidth={4.2} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - clamp(draw * 2 - 1)} />
  </svg>;
}

export function YangBenchmarkTable(props: Partial<YangBenchmarkTableProps>) {
  const c = { ...yangBenchmarkTableDefaults, ...props };
  const t = useT();
  const cols = c.columns.slice(0, 5);
  const n = Math.max(1, cols.length);
  const rows = c.rows.slice(0, 7);
  const R = rows.length;

  // ---------- 内容 → 终态版式 ----------
  const tickCount = (j: number) => rows.filter((r) => r.cells[j] === true).length;
  const countable = rows.filter((r) => r.cells.some((x) => typeof x === 'boolean')).length;
  const totals = cols.map((_, j) => c.totals?.[j] ?? `${tickCount(j)}/${countable}`);
  const winner = clamp(Math.round(c.winner ?? cols.reduce((best, _, j) => (tickCount(j) > tickCount(best) ? j : best), 0)), 0, n - 1);

  // 字号从 36 往下找：整表宽 ≤ 1740
  const plan = (f: number) => {
    const labelW = Math.max(tw(c.totalLabel, f), ...rows.map((r) => tw(r.label, f)));
    const colW = cols.map((name, j) => Math.max(f * 6.6, tw(name, f) + f * 2.2, ...rows.map((r) => (typeof r.cells[j] === 'string' ? tw(r.cells[j] as string, f) + f * 1.6 : 0)), tw(totals[j], f * 1.25) + f * 1.6));
    const cw = Math.max(...colW);                 // 各列等宽，更整齐
    const gap = f * 1.0;
    const width = labelW + f * 1.8 + n * cw + (n - 1) * gap;
    return { f, labelW, cw, gap, width };
  };
  let L = plan(36);
  for (let f = 36; f >= 26 && L.width > 1740; f -= 1) L = plan(f);
  const { f, labelW, cw, gap, width } = L;

  const pillH = Math.round(f * 1.9);
  const totalH = Math.round(f * 2.8);
  const rowH = Math.round(Math.min(f * 2.55, (880 - 150 - pillH - totalH - 30) / Math.max(1, R)));
  const cardH = pillH / 2 + 18 + R * rowH + totalH;
  const groupH = pillH / 2 + cardH;
  const top = 150 + (880 - 150 - groupH) / 2;    // 表头胶囊顶边
  const cardY = top + pillH / 2;
  const rowY = (i: number) => cardY + pillH / 2 + 18 + i * rowH;
  const totalY = rowY(R);
  const X0 = (1920 - width) / 2;
  const colX = (j: number) => X0 + labelW + f * 1.8 + j * (cw + gap);
  const sym = Math.round(f * 1.45);

  // ---------- 时间线 ----------
  const enterAt = (j: number) => 0.04 + j * 0.07;
  const step = Math.min(0.85, 3.0 / n);
  const colAt = cols.map((_, j) => cueAt(c.cues, j, 0.85 + j * step));
  const cellAt = (j: number, i: number) => colAt[j] + i * 0.07;
  const totAt = (j: number) => cellAt(j, R) + 0.1;
  const liftAt = Math.max(cueAt(c.cues, n, totAt(n - 1) + 0.55), totAt(n - 1) + 0.3);
  const lift = p(t, liftAt, liftAt + 0.55);
  const lands = springAt(t, liftAt, 0.7);

  const labelIn = p(t, 0.15, 0.6);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 行分隔细线：从评测项一直贯穿到最后一列（卡片之间也连着） */}
      {Array.from({ length: R }, (_, i) => <div key={i} style={{
        position: 'absolute', left: X0, top: rowY(i + 1) - 1, width: (width) * labelIn, height: 2, background: S.ink, opacity: 0.08,
      }} />)}

      {/* 评测项 */}
      {rows.map((r, i) => <div key={i} style={{
        ...textBase(f, 900), position: 'absolute', left: X0, top: rowY(i) + (rowH - f * 1.16) / 2, color: S.ink,
        opacity: labelIn * mix(1, 0.55, lift), transform: `translateX(${(1 - labelIn) * -24}px)`,
      }}>{r.label}</div>)}
      <div style={{ ...textBase(f * 1.05, 900), position: 'absolute', left: X0, top: totalY + (totalH - f * 1.2) / 2, color: S.ink, opacity: labelIn }}>{c.totalLabel}</div>

      {/* 每一方：白卡列 + 黑胶囊表头 */}
      {cols.map((name, j) => {
        const e = p(t, enterAt(j), enterAt(j) + 0.5);
        const won = j === winner;
        const back = won ? 0 : lift;
        const x = colX(j);
        const shadow = won && lift > 0 ? `0 ${16 + 22 * lift}px ${25 + 25 * lift}px 0 rgba(0,0,0,${0.133 + 0.08 * lift})` : S.shadow;
        return <div key={j} style={{
          position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: e,
          transform: `translateY(${(1 - e) * 50 - (won ? 26 * lift : 0)}px)`, zIndex: won ? 3 : 1,
        }}>
          <div style={{ position: 'absolute', inset: 0, transformOrigin: `${x + cw / 2}px ${cardY + cardH / 2}px`, transform: `scale(${won ? mix(1, 1.045, lift) + (1 - lands) * 0.01 * (lift > 0 ? 1 : 0) : mix(1, 0.97, back)})` }}>
            <Surface box={{ x, y: cardY, w: cw, h: cardH }} shadow={shadow}>
              {/* 卡内细线（与外面那条同一高度） */}
              {Array.from({ length: R }, (_, i) => <div key={i} style={{ position: 'absolute', left: 18, right: 18, top: rowY(i + 1) - cardY - 1, height: 2, background: S.ink, opacity: 0.08 }} />)}
              {/* 格子 */}
              {rows.map((r, i) => {
                const v = r.cells[j];
                const a = cellAt(j, i);
                if (t < a) return null;
                const pop = springAt(t, a, 0.5);
                const draw = p(t, a + 0.1, a + 0.4);
                const box: React.CSSProperties = { position: 'absolute', left: 0, width: cw, top: rowY(i) - cardY, height: rowH, display: 'flex', alignItems: 'center', justifyContent: 'center' };
                if (v === true) return <div key={i} style={box}><Check d={sym} pop={mix(0.3, 1, pop)} draw={draw} /></div>;
                if (v === false) return <div key={i} style={box}><Cross d={sym} draw={draw} /></div>;
                return <div key={i} style={{ ...box, opacity: clamp((t - a) / 0.12), transform: `translateY(${(1 - p(t, a, a + 0.35)) * -16}px)` }}>
                  <span style={{ ...textBase(f, 900), color: S.ink }}>{String(v)}</span>
                </div>;
              })}
              {/* 合计 */}
              <div style={{ position: 'absolute', left: 18, right: 18, top: totalY - cardY - 2, height: 4, borderRadius: 2, background: S.ink, opacity: 0.85 * p(t, totAt(j) - 0.1, totAt(j) + 0.2) }} />
              {t >= totAt(j) && <div style={{ position: 'absolute', left: 0, width: cw, top: totalY - cardY, height: totalH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ ...textBase(f * 1.25, 900), color: won && lift > 0.5 ? accentOn(false) : S.ink, transform: `scale(${mix(0.6, 1, springAt(t, totAt(j), 0.5)) * (won ? mix(1, 1.12, lift) : 1)})`, display: 'inline-block' }}>{totals[j]}</span>
              </div>}
              {/* 退后：白蒙版（不失焦，仍读得出） */}
              <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.55 * back }} />
            </Surface>
            {/* 黑胶囊表头压在卡顶 */}
            <Pill box={{ x: x + cw / 2 - (cw - f * 0.6) / 2, y: top, w: cw - f * 0.6, h: pillH }} style={{ opacity: mix(1, 0.5, back) }}>
              <span style={{ ...textBase(f, 900), color: won && lift > 0.5 ? accentOn(true) : '#fff' }}>{name}</span>
            </Pill>
          </div>
        </div>;
      })}
    </Handoff>
    
    
    
  </Frame>;
}
