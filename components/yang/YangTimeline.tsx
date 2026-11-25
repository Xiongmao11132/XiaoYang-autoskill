// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T16a-Timeline.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：时间线（正版 T16a）——一条时间轴 → 节点依次点亮，当前节点展开说明。
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

export type YangTimelineNode = { date: string; title: string; detail?: string };
export type YangTimelineProps = YangHandoffProps & {
  nodes: YangTimelineNode[];   // 3–6 个，按时间先后
  focus?: number;          // 最后展开哪个节点（从 0 起），默认最后一个
  cues?: number[];         // [i]=第 i 个节点点亮；[n]=展开说明
};

export const yangTimelineDefaults: YangTimelineProps = {
  nodes: [
    { date: '105 期', title: 'Codex 更新全教程' },
    { date: '107 期', title: 'OpenAI Dev Day' },
    { date: '108 期', title: 'Codex 视频制作日常' },
    { date: '110 期', title: '3D 运镜组件库' },
    { date: '112 期', title: 'API 是什么' },
    { date: '114 期', title: 'GitHub', detail: '把项目放上 GitHub，每次改动都有记录，随时能回到上一版' },
  ],
};

const tw = (s: string, f: number) => Array.from(s).reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.66 : /[\u0000-ÿ]/.test(ch) ? 0.58 : 1) * f, 0);

// 按宽度折行：拉丁词整体不拆，中文逐字
function wrap(text: string, size: number, width: number): string[] {
  const tokens = text.match(/[A-Za-z0-9.\-_/+#']+|\s+|./gu) ?? [];
  const lines: string[] = [''];
  for (const tk of tokens) {
    const cur = lines[lines.length - 1];
    const punct = /^[，。、；：！？,.;:!?）)]$/.test(tk);   // 标点不放行首
    if (cur && !punct && tw(cur + tk, size) > width) lines.push(tk.trim() ? tk : '');
    else lines[lines.length - 1] = cur + tk;
  }
  return lines.map((l) => l.trim()).filter(Boolean);
}

// 平衡折行：行数不变的前提下把每行收窄到接近平均，避免“更新全/教程”这类断头
function balanced(text: string, size: number, width: number): string[] {
  const k = wrap(text, size, width).length;
  if (k <= 1) return [text.trim()];
  for (let w = tw(text, size) / k; w <= width; w += size * 0.25) {
    const lines = wrap(text, size, w);
    if (lines.length === k) return lines;
  }
  return wrap(text, size, width);
}

// 事件名两行折法：优先在空格 / 中英交界处断，其次取两行最均衡处（不拆英文单词）
function split2(text: string, size: number, width: number): string[] {
  if (tw(text, size) <= width) return [text];
  const ch = Array.from(text);
  let best = -1, cost = Infinity;
  for (let i = 1; i < ch.length; i++) {
    if (/[A-Za-z0-9]/.test(ch[i - 1]) && /[A-Za-z0-9]/.test(ch[i])) continue;
    if (/^[，。、；：！？,.;:!?）)]$/.test(ch[i])) continue;
    const a = ch.slice(0, i).join('').trim(), b = ch.slice(i).join('').trim();
    const w = Math.max(tw(a, size), tw(b, size));
    if (w > width) continue;
    const nice = ch[i - 1] === ' ' || ch[i] === ' ' || /[，、,]/.test(ch[i - 1]) ? 0.72 : /[A-Za-z0-9]/.test(ch[i - 1]) !== /[A-Za-z0-9]/.test(ch[i]) ? 0.85 : 1;
    if (w * nice < cost) { cost = w * nice; best = i; }
  }
  return best < 0 ? wrap(text, size, width) : [ch.slice(0, best).join('').trim(), ch.slice(best).join('').trim()];
}

const AX0 = 150, AX1 = 1770;   // 轴两端
const LINE = 14;               // 轴粗
const DOT = 36;

export function YangTimeline(props: Partial<YangTimelineProps>) {
  const c = { ...yangTimelineDefaults, ...props };
  const t = useT();
  const nodes = c.nodes.slice(0, 6);
  const n = Math.max(1, nodes.length);
  const fi = clamp(Math.round(c.focus ?? n - 1), 0, n - 1);

  // ---------- 终态版式 ----------
  const sp = (AX1 - AX0) / n;
  const nx = (i: number) => AX0 + (i + 0.5) * sp;
  const labW = sp - 30;
  const dateSize = Math.min(60, labW / Math.max(1, ...nodes.map((x) => tw(x.date, 1))));
  let evSize = 36;
  for (; evSize > 26; evSize -= 1) if (nodes.every((x) => split2(x.title, evSize, labW).length <= 2)) break;
  const evLines = nodes.map((x) => split2(x.title, evSize, labW));
  const evH = Math.max(...evLines.map((l) => l.length)) * evSize * 1.25;
  const dateGap = 30, evGap = 34;
  const aboveH = dateSize * 1.16 + dateGap;
  const belowH = evGap + evH;

  // 聚焦卡（终态居中）
  const fNode = nodes[fi];
  const tSize = Math.min(76, 1100 / Math.max(1, tw(fNode.title, 1)));
  // 卡宽贴合内容：说明按每行 ≤1000px 估行数，再与标题宽度取大
  let dSize = 40;
  const dNat = fNode.detail ? tw(fNode.detail, dSize) : 0;
  const dRows = Math.max(1, Math.ceil(dNat / 1000));
  const inner = Math.round(clamp(Math.max(tw(fNode.title, tSize), fNode.detail ? (dNat / dRows) * 1.08 : 0, 520), 520, 1100));
  const cardW = inner + 140;
  let dLines = fNode.detail ? balanced(fNode.detail, dSize, inner) : [];
  while (dLines.length > 3 && dSize > 30) { dSize -= 2; dLines = balanced(fNode.detail!, dSize, inner); }
  const pillSize = Math.min(40, dateSize * 0.8);
  const pillH = Math.round(pillSize * 1.7);
  const cardH = Math.round(54 + pillH + 22 + tSize * 1.2 + (dLines.length ? 18 + dLines.length * dSize * 1.42 : 0) + 54);

  // 轴的两个位置：建立时整组垂直居中；聚焦后上移，给卡让出下方
  const AY0 = 540 - (belowH - aboveH) / 2;
  const top2 = 196;
  const AY2 = top2 + aboveH;
  const cardY = Math.min(880 - cardH, AY2 + belowH + 64);
  const cardX = 960 - cardW / 2;

  // ---------- 时间线 ----------
  const step = Math.min(0.55, 2.5 / n);
  const at = nodes.map((_, i) => cueAt(c.cues, i, 0.4 + i * step));
  const F = cueAt(c.cues, n, at[n - 1] + 0.75);
  const track = p(t, 0.02, 0.45);
  // 墨线头：在相邻节点之间推进；第一个节点之前从轴头出发
  const headX = (() => {
    if (t <= at[0]) return mix(AX0, nx(0), p(t, at[0] - 0.3, at[0]));
    for (let i = 0; i < n - 1; i++) if (t < at[i + 1]) return mix(nx(i), nx(i + 1), q(t, at[i], at[i + 1]));
    return mix(nx(n - 1), AX1, p(t, at[n - 1], at[n - 1] + 0.5));
  })();
  const shift = q(t, F, F + 0.6);
  const AY = mix(AY0, AY2, shift);
  const travel = q(t, F + 0.12, F + 0.82);
  const content = p(t, F + 0.7, F + 1.1);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 底轨（极淡）+ 墨线 */}
      <div style={{ position: 'absolute', left: AX0, top: AY - LINE / 2, width: (AX1 - AX0) * track, height: LINE, borderRadius: LINE / 2, background: S.ink, opacity: 0.08 }} />
      <div style={{ position: 'absolute', left: AX0, top: AY - LINE / 2, width: Math.max(0, headX - AX0), height: LINE, borderRadius: LINE / 2, background: S.ink, opacity: track }} />

      {nodes.map((nd, i) => {
        const land = springAt(t, at[i], 0.6);
        const shown = t >= at[i];
        const isF = i === fi;
        const dim = isF ? 0 : shift;
        const lab = p(t, at[i] + 0.05, at[i] + 0.45);
        const x = nx(i);
        return <React.Fragment key={i}>
          {/* 日期：Heavy 大字 */}
          <div style={{
            ...textBase(dateSize, 900), position: 'absolute', left: x - labW / 2, width: labW, textAlign: 'center',
            top: AY - LINE / 2 - dateGap - dateSize * 1.16 + (1 - lab) * 18, opacity: lab * mix(1, 0.35, dim),
            color: isF && shift > 0.5 ? S.accent : S.ink,
          }}>{nd.date}</div>
          {/* 事件：Medium 小一档 */}
          <div style={{
            position: 'absolute', left: x - labW / 2, width: labW, top: AY + LINE / 2 + evGap - 8 - (1 - lab) * 14, opacity: lab * mix(1, 0.35, dim),
          }}>{evLines[i].map((l, k) => <div key={k} style={{ ...textBase(evSize, 500), lineHeight: 1.25, textAlign: 'center', color: '#3a3a40' }}>{l}</div>)}</div>
          {/* 圆点：从上方落到轴上，回弹一次 */}
          {shown && <div style={{
            position: 'absolute', left: x - DOT / 2, top: AY - DOT / 2 - (1 - clamp(land)) * 24, width: DOT, height: DOT, borderRadius: DOT / 2,
            background: isF && shift > 0 ? S.accent : S.ink, border: '6px solid #fff', boxSizing: 'border-box', boxShadow: '0 4px 10px #0003',
            transform: `scale(${mix(0, 1, land) * (isF ? mix(1, 1.25, shift) : 1)})`, opacity: mix(1, 0.45, dim),
          }} />}
        </React.Fragment>;
      })}

      {/* 当前节点：同一颗圆点离开轴，长成居中的黑卡 */}
      {t >= F + 0.12 && (() => {
        const fx = nx(fi), fy = AY;
        const w = mix(DOT, cardW, travel), h = mix(DOT, cardH, travel);
        const cx = mix(fx, 960, travel), cy = mix(fy, cardY + cardH / 2, travel);
        return <div style={{
          position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: mix(DOT / 2, S.radius + 8, clamp(travel * 1.6)),
          background: S.dark, boxShadow: S.capsuleShadow, overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', left: 70, top: 54, width: inner, opacity: content, transform: `translateY(${(1 - content) * 18}px)` }}>
            <div style={{ display: 'inline-flex', height: pillH, padding: `0 ${pillSize * 0.7}px`, borderRadius: pillH / 2, background: accentOn(true), alignItems: 'center' }}>
              <span style={{ ...textBase(pillSize, 900), color: S.ink, lineHeight: 1 }}>{fNode.date}</span>
            </div>
            <div style={{ ...textBase(tSize, 900), color: '#fff', marginTop: 22, lineHeight: 1.2 }}>{fNode.title}</div>
            {dLines.length > 0 && <div style={{ marginTop: 18 }}>{dLines.map((l, k) => <div key={k} style={{ ...textBase(dSize, 500), color: '#fff', opacity: 0.88, lineHeight: 1.42 }}>{l}</div>)}</div>}
          </div>
        </div>;
      })()}
    </Handoff>
    
    
    
    
  </Frame>;
}
