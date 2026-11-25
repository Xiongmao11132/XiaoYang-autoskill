// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T15f-DonutShare.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：占比环（正版 T15f）——一个圆环 → 各部分依次长出，主角那块抽出并亮出比例。
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

export type YangDonutSegment = { label: string; value: number };
export type YangDonutShareProps = YangHandoffProps & {
  segments: YangDonutSegment[];   // 2–5 段；占比 = value / 总和
  highlight: number;          // 主角在 segments 里的序号
  decimals: number;           // 占比小数位
  centerNote: string;         // 环长出时中央的一句说明；主角抽出后让位给大数字
  highlightLabel?: string;    // 大数字下方的小字；不传用主角名称
  cues?: number[];            // [0]=环开始长；[1]=主角抽出
};

// 示例内容（明显是示意数据，不是实测结论）：100 条测试里与官方结果一致 87 条、轻微差异 9 条、不一致 4 条。
// 真实的 113 期开源版 JEV 一致率要等实测后用 props 替换。
export const yangDonutShareDefaults: YangDonutShareProps = {
  segments: [
    { label: '完全一致', value: 87 },
    { label: '轻微差异', value: 9 },
    { label: '结果不同', value: 4 },
  ],
  highlight: 0,
  decimals: 0,
  centerNote: '100 条示例',
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

const CX = 640, CY = 550, RM = 290, SW = 132;
const TONES = [S.ink, '#6c6c72', '#a3a3ab', '#c4c4cb', '#dcdce0'];
const GREY = '#d3d3d9';
const pt = (a: number, r = RM) => ({ x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) });
const arc = (a0: number, a1: number) => {
  const e = Math.min(a1, a0 + Math.PI * 2 - 0.002);
  const s = pt(a0), f = pt(e);
  return `M${s.x.toFixed(2)} ${s.y.toFixed(2)} A${RM} ${RM} 0 ${e - a0 > Math.PI ? 1 : 0} 1 ${f.x.toFixed(2)} ${f.y.toFixed(2)}`;
};

export function YangDonutShare(props: Partial<YangDonutShareProps>) {
  const c = { ...yangDonutShareDefaults, ...props };
  const t = useT();
  const segs = c.segments.slice(0, 5);
  const n = Math.max(1, segs.length);
  const hi = clamp(Math.round(c.highlight), 0, n - 1);
  const total = segs.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
  const GAP = 11 / RM;                       // 块与块之间约 11px 的缝
  let acc = 0;
  const parts = segs.map((s, i) => {
    const share = Math.max(0, s.value) / total;
    const a0 = acc * Math.PI * 2;
    acc += share;
    return { ...s, i, share, a0, span: share * Math.PI * 2 };
  });

  // —— 时间线 ——
  const ringAt = cueAt(c.cues, 0, 0.35);
  const ringDur = 2.3;
  const pullAt = cueAt(c.cues, 1, ringAt + ringDur + 0.45);
  const sweep = q(t, ringAt, ringAt + ringDur);
  const head = sweep * Math.PI * 2;
  const light = p(t, pullAt, pullAt + 0.5);
  const pull = springAt(t, pullAt, 0.75);
  const rollV = p(t, pullAt + 0.12, pullAt + 1.15);
  const enter = p(t, 0, 0.5);

  // 中央大数字：按宽度自适应
  const hp = parts[hi];
  const hiPct = hp.share * 100;
  const finalStr = `${fmt(hiPct, c.decimals)}%`;
  const innerR = RM - SW / 2 - 26;
  const bigSize = Math.min(168, (innerR * 2 * 0.92) / Math.max(1, numWidth(finalStr, 1)));
  const noteSize = Math.min(58, Math.max(38, (innerR * 2 * 0.9 * 1.9) / Math.max(1, textWidth(c.centerNote, 1))));   // 放不下就拆成两行，字不再缩小
  const labelText = c.highlightLabel ?? hp.label;
  const labelSize = Math.min(52, Math.max(36, (innerR * 2 * 0.86 * 1.9) / Math.max(1, textWidth(labelText, 1))));

  // 右侧名单：名称一行放不下就拆两行；名称列与数字列贴近，整块在右侧区域居中
  const rowH = Math.min(136, 700 / n);
  const listX = 1110, listR = 1800, areaW = listR - listX;
  const vs = Math.min(60, rowH * 0.46);
  const valW = numWidth('100%', vs);
  const labelMax = areaW - 62 - 72 - valW;
  const base = Math.min(62, rowH * 0.46);
  const longest = Math.max(...parts.map((x) => textWidth(x.label, 1)));
  const oneLine = Math.min(base, labelMax / Math.max(1, longest));
  const twoLine = oneLine < 42;
  const ls = twoLine ? Math.max(30, Math.min(base, labelMax / Math.max(1, longest / 2 + 0.6))) : oneLine;
  const splitLabel = (label: string): string[] => {
    if (!twoLine || textWidth(label, 1) * ls <= labelMax) return [label];
    const chars = Array.from(label);
    let acc2 = 0;
    const half = textWidth(label, 1) / 2;
    let k = 0;
    while (k < chars.length - 1 && acc2 + textWidth(chars[k], 1) / 2 < half) { acc2 += textWidth(chars[k], 1); k++; }
    return [chars.slice(0, k + 1).join(''), chars.slice(k + 1).join('')];
  };
  const lines = parts.map((x) => splitLabel(x.label));
  const labelW = Math.max(...lines.flat().map((l) => textWidth(l, ls)));
  const blockW = 62 + labelW + 72 + valW;
  const bx = listX + Math.max(0, (areaW - blockW) / 2);
  const y0 = CY - (n * rowH) / 2;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: enter }}>
        <circle cx={CX} cy={CY} r={RM} fill="none" stroke={S.ink} strokeOpacity={0.06} strokeWidth={SW} />
        {[...parts].sort((a, b) => Number(a.i === hi) - Number(b.i === hi)).map((s) => {
          const vis = clamp((head - s.a0) / Math.max(1e-6, s.span));
          if (vis <= 0.001) return null;
          const a0 = s.a0 + (n > 1 ? GAP / 2 : 0), a1 = s.a0 + s.span * vis - (n > 1 && vis >= 0.999 ? GAP / 2 : 0);
          if (a1 - a0 <= 0.002) return null;
          const isHi = s.i === hi;
          const tone = TONES[s.i % TONES.length];
          const color = isHi ? mixColor(tone, S.accent, light) : mixColor(tone, GREY, light);
          const am = s.a0 + s.span / 2;
          const k = isHi ? pull * 54 : 0;
          return <path key={s.i} d={arc(a0, a1)} fill="none" stroke={color} strokeWidth={SW}
            transform={`translate(${(Math.sin(am) * k).toFixed(2)} ${(-Math.cos(am) * k).toFixed(2)})`} />;
        })}
      </svg>

      {/* 环中央：先是一句说明，主角抽出后换成大数字 */}
      <div style={{ position: 'absolute', left: CX - innerR * 0.92, top: CY - 80, width: innerR * 1.84, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', ...textBase(noteSize, 900), whiteSpace: 'normal', color: S.ink, opacity: clamp(1 - light * 3) * p(t, ringAt, ringAt + 0.5) }}>{c.centerNote}</div>
      <div style={{ position: 'absolute', left: CX - innerR, top: CY - bigSize * 0.5 - 30, width: innerR * 2, display: 'flex', justifyContent: 'center', opacity: clamp(light * 3), transform: `scale(${mix(0.9, 1, light)})` }}>
        <Num text={`${fmt(hiPct * rollV, c.decimals)}%`} size={bigSize} color={S.ink} />
      </div>
      <div style={{ position: 'absolute', left: CX - innerR, top: CY + bigSize * 0.5 + 6, width: innerR * 2, textAlign: 'center', ...textBase(labelSize, 500), whiteSpace: 'normal', color: S.muted, opacity: clamp(light * 3 - 0.6) }}>{labelText}</div>

      {/* 右侧名单：跟着笔头出现 */}
      {parts.map((s) => {
        const a = clamp((head - s.a0) / 0.35);
        const isHi = s.i === hi;
        const tone = TONES[s.i % TONES.length];
        const dim = isHi ? 0 : light;
        const swatch = isHi ? mixColor(tone, S.accent, light) : mixColor(tone, GREY, light);
        const text = isHi ? S.ink : mixColor(S.ink, S.faint, dim);
        const vcol = isHi ? mixColor(S.ink, S.accent, light) : text;
        const str = `${fmt(s.share * 100, c.decimals)}%`;
        const L = lines[s.i];
        return <div key={s.i} style={{ position: 'absolute', left: bx, top: y0 + s.i * rowH, width: blockW, height: rowH, opacity: a, transform: `translateX(${(1 - a) * 36}px)` }}>
          <div style={{ position: 'absolute', left: 0, top: rowH / 2 - 17, width: 34, height: 34, borderRadius: 999, background: swatch }} />
          <div style={{ position: 'absolute', left: 62, top: (rowH - ls * 1.16 * L.length) / 2, ...textBase(ls, 900), color: text }}>{L.map((ln, k) => <div key={k}>{ln}</div>)}</div>
          <div style={{ position: 'absolute', left: blockW - numWidth(str, vs), top: (rowH - vs) / 2, transform: `scale(${isHi ? 1 + 0.1 * light : 1})`, transformOrigin: '100% 50%' }}>
            <Num text={str} size={vs} color={vcol} />
          </div>
        </div>;
      })}
    </Handoff>
    
    
    
    
  </Frame>;
}
