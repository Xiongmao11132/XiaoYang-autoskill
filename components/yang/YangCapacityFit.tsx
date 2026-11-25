// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T13c-CapacityFit.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：装不装得下（正版 T13c）——一个容器 → 东西放进去，装得下或溢出。
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

export type YangContainer = { size: number; label: string };
export type YangCapacityFitProps = YangHandoffProps & {
  item: { name: string; size: number };  // 要放进去的东西
  unit: string;                           // GB
  containers: YangContainer[];                // 1–4 只，按顺序从左到右
  overText: string;                       // 溢出标签前缀：超出
  fitText: string;                        // 装得下的标签
  cues?: number[];                        // [0]=开始落下；[1]=装得下的那只点亮
};

// 113 期第 5 段：完整版约 52GB；常见游戏显卡 8–24GB，作者建议 80GB 以上
export const yangCapacityFitDefaults: YangCapacityFitProps = {
  item: { name: 'JEV-27B 完整版', size: 52 },
  unit: 'GB',
  containers: [
    { size: 8, label: '入门游戏卡' },
    { size: 24, label: '高端游戏卡' },
    { size: 80, label: '专业显卡' },
  ],
  overText: '超出',
  fitText: '装得下',
};

const BASE = 748;          // 容器底
const MAX_H = 440;         // 最大量对应的高度
const WALL = 10;
const SRC_TOP = 128;

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

export function YangCapacityFit(props: Partial<YangCapacityFitProps>) {
  const c = { ...yangCapacityFitDefaults, ...props };
  const t = useT();
  const cs = c.containers.slice(0, 4);
  const n = Math.max(1, cs.length);

  // ---- 几何 ----
  const gap = n <= 3 ? 150 : 96;
  const colW = Math.min(n === 1 ? 400 : 300, (1600 - (n - 1) * gap) / n);
  const total = n * colW + (n - 1) * gap;
  const colX = (i: number) => 960 - total / 2 + i * (colW + gap);   // 左边
  const maxCap = Math.max(c.item.size, ...cs.map((k) => k.size));
  const k = MAX_H / maxCap;
  const ch = (v: number) => Math.max(26, v * k);
  const bw = colW - WALL * 2 - 20;
  const bh = c.item.size * k;
  const blockTop = BASE - WALL / 2 - 4 - bh;
  const fits = cs.map((x) => x.size >= c.item.size);
  const fitIdx = fits.findIndex(Boolean);

  // 字号
  const capSize = Math.min(66, ...cs.map((x) => (colW + gap * 0.6) / Math.max(1, textWidth(fmt(x.size) + c.unit, 1))));
  const labSize = Math.max(30, Math.min(36, ...cs.map((x) => (colW + gap * 0.6) / Math.max(1, textWidth(x.label, 1)))));
  const numSize = Math.min(64, (bw - 30) / Math.max(1, textWidth(fmt(c.item.size) + c.unit, 1)));
  // 名字一行放不下（小于 26px）就折成两行，不缩到读不清
  const nameOne = Math.min(34, (bw - 30) / Math.max(1, textWidth(c.item.name, 1)));
  const nameLines = nameOne < 26 ? 2 : 1;
  const nameSize = nameLines === 1 ? nameOne : Math.min(34, ((bw - 30) * 2 * 0.9) / Math.max(1, textWidth(c.item.name, 1)));
  const pillSize = Math.min(40, ...cs.map((x) => (colW + gap - 70) / Math.max(1, textWidth(x.size >= c.item.size ? c.fitText : `${c.overText} ${fmt(c.item.size - x.size)}${c.unit}`, 1))));
  const pillH = pillSize * 1.9;
  const pillCY = blockTop - pillH / 2 - 24;

  // ---- 时间 ----
  const src = p(t, 0.02, 0.45);
  const dropAt = cueAt(c.cues, 0, 1.05);
  const order = cs.map((_, i) => i).sort((a, b) => Math.abs(colX(a) + colW / 2 - 960) - Math.abs(colX(b) + colW / 2 - 960) || a - b);
  const spread = q(t, dropAt, dropAt + 0.5);                 // 分身从主方块后面横向滑出，停在各自容器上方
  const lead = order[0];                                      // 主方块：去离中间最近的那只，始终在最上层
  const startOf = (i: number) => dropAt + 0.42 + order.indexOf(i) * 0.16;
  const landOf = (i: number) => startOf(i) + 0.55;
  const lastLand = Math.max(...cs.map((_, i) => landOf(i)));
  const fitAt = cueAt(c.cues, 1, lastLand + 0.55);
  const fitOn = p(t, fitAt, fitAt + 0.45);

  // 方块上的字放在面积够大的那一截里（紫色溢出段或黑色段），不让颜色分界线穿过文字
  const textH = nameSize * 1.16 * nameLines + numSize * 1.16 + 4;
  const labelBand = (overH: number) => {
    const inside = bh - overH;
    if (overH >= textH + 28 && overH >= inside) return { top: 0, height: overH };
    if (inside >= textH + 28) return { top: overH, height: inside };
    if (overH >= textH + 28) return { top: 0, height: overH };
    return { top: 0, height: bh };
  };
  const block = (x: number, y: number, key: string, overH: number, stripe: number, textOpacity = 1, z = 1) => (
    <div key={key} style={{ position: 'absolute', zIndex: z, left: x, top: y, width: bw, height: bh, borderRadius: 14, background: S.dark, boxShadow: S.capsuleShadow, overflow: 'hidden' }}>
      {overH > 0 && stripe > 0 && <svg width={bw} height={overH} style={{ position: 'absolute', left: 0, top: 0, clipPath: `inset(${100 * (1 - stripe)}% 0 0 0)` }}>
        <defs>
          <pattern id={`st-${key}`} width={30} height={30} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={30} height={30} fill={S.accent} />
            <rect width={12} height={30} fill="#fff" opacity={0.2} />
          </pattern>
        </defs>
        <rect width={bw} height={overH} fill={`url(#st-${key})`} />
      </svg>}
      <div style={{ position: 'absolute', left: 0, right: 0, opacity: textOpacity, ...labelBand(overH), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <span style={{ ...textBase(nameSize, 500), color: '#fff', whiteSpace: nameLines === 2 ? 'normal' : 'nowrap', width: bw - 30, textAlign: 'center' }}>{c.item.name}</span>
        <span style={{ ...textBase(numSize, 900), color: '#fff' }}>{fmt(c.item.size)}{c.unit}</span>
      </div>
    </div>
  );

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 容器：开口 U 形，高度按容量比例 */}
      {cs.map((x, i) => {
        const x0 = colX(i), x1 = x0 + colW, top = BASE - ch(x.size);
        const r = Math.min(20, ch(x.size) / 2);
        const draw = p(t, 0.05 + i * 0.08, 0.6 + i * 0.08);
        const lab = p(t, 0.2 + i * 0.08, 0.65 + i * 0.08);
        const lit = i === fitIdx ? fitOn : 0;
        const d = `M${x0} ${top} L${x0} ${BASE - r} Q${x0} ${BASE} ${x0 + r} ${BASE} L${x1 - r} ${BASE} Q${x1} ${BASE} ${x1} ${BASE - r} L${x1} ${top}`;
        return <React.Fragment key={i}>
          <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
            <path d={d} pathLength={1} fill="none" stroke={S.ink} strokeWidth={WALL} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          </svg>
          <div style={{ position: 'absolute', left: x0 - gap / 2, width: colW + gap, top: BASE + 26 + (1 - lab) * 16, textAlign: 'center', opacity: lab }}>
            <div style={{ ...textBase(capSize, 900), color: lit > 0.5 ? accentOn(false) : S.ink }}>{fmt(x.size)}{c.unit}</div>
            <div style={{ ...textBase(labSize, 500), color: S.muted, marginTop: 4 }}>{x.label}</div>
          </div>
        </React.Fragment>;
      })}

      {/* 悬在上方的方块：先认清大小（落下开始后由各分身接手） */}
      {t < dropAt && block(960 - bw / 2, SRC_TOP + (1 - src) * 30, 'src', 0, 0)}

      {/* 分身落进各容器 */}
      {t >= dropAt && cs.map((x, i) => {
        const a = startOf(i);
        const fall = p(t, a, a + 0.55) * 1.03 - 0.03 * q(t, a + 0.55, a + 0.78);
        const xOf = (j: number) => mix(960 - bw / 2, colX(j) + colW / 2 - bw / 2, spread);
        const tx = xOf(i);
        const ty = mix(SRC_TOP, blockTop, fall);
        const overH = Math.max(0, (c.item.size - x.size) * k);
        const stripe = p(t, landOf(i), landOf(i) + 0.35);
        // 还藏在主方块后面时不显示字，完全滑出后字再出现，避免两层字叠在一起
        const clear = i === lead ? 1 : clamp((Math.abs(tx - xOf(lead)) - bw) / 30);
        return block(tx, ty, `b${i}`, overH, stripe, clear, i === lead ? 3 : 2);
      })}

      {/* 同一高度的结果标签 */}
      {cs.map((x, i) => {
        const fit = fits[i];
        const a = fit ? fitAt : landOf(i) + 0.22;
        const v = p(t, a, a + 0.42) * 1.05 - 0.05 * q(t, a + 0.42, a + 0.62);
        if (v <= 0) return null;
        const text = fit ? c.fitText : `${c.overText} ${fmt(c.item.size - x.size)}${c.unit}`;
        const w = textWidth(text, pillSize) + pillSize * 1.6;
        const box = { x: colX(i) + colW / 2 - w / 2, y: pillCY - pillH / 2, w, h: pillH };
        const style = { transform: `scale(${v})`, opacity: clamp(v * 3), zIndex: 30 };
        if (fit) return <Pill key={i} box={box} style={style}>
          <span style={{ ...textBase(pillSize, 900), color: accentOn(true) }}>{text}</span>
        </Pill>;
        const num = `${fmt(c.item.size - x.size)}${c.unit}`;
        return <Surface key={i} box={box} radius={pillH / 2} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...textBase(pillSize, 900), color: S.ink }}>{c.overText} <span style={{ color: accentOn(false) }}>{num}</span></span>
        </Surface>;
      })}
    </Handoff>
  </Frame>;
}
