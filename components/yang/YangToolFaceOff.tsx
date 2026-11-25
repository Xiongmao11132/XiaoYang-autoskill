// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T05d-ToolFaceOff.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-native-16-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-native-16-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：工具并排（正版 T05d）。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT（等宽走系统等宽栈）；
// Brand 角标未集成（Frame 的 brand 入参仅兼容、忽略）；kit 的 theme/ui 已内嵌移植（见下），逻辑与原版一致；
// defaults 保留原包示例数据（原版节目示例），使用时请传真实数据。
// 媒体注记：原包 defaults 里的原版素材路径已置空串——空串时由 ImgFill/Media 内置的中性骨架占位面顶替，
// 使用时传自己的真实素材（及对应像素框/尺寸）即走原逻辑。
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

export type YangTool = { name: string; logo: string };
export type YangFaceOffRow = { label: string; left: string; right: string; winner: 'left' | 'right' | 'tie' };
export type YangToolFaceOffProps = { left: YangTool; right: YangTool; rows: YangFaceOffRow[] };

export const yangToolFaceOffDefaults: YangToolFaceOffProps = {
  left: { name: 'Codex', logo: '' },
  right: { name: '豆包', logo: '' },
  rows: [
    { label: '改整个项目', left: '直接改文件、跑测试', right: '只给代码片段', winner: 'left' },
    { label: '上手门槛', left: '要装客户端', right: '网页打开就用', winner: 'right' },
    { label: '长任务', left: '能连续跑一小时', right: '中途容易停下', winner: 'left' },
    { label: '读本地文件', left: '整个文件夹都能读', right: '一次传几个文件', winner: 'left' },
  ],
};

// 列几何：标准列 + 两个工具列
const COL = { label: { x: 120, w: 400 }, left: { x: 560, w: 600 }, right: { x: 1200, w: 600 } };
const HEAD_Y = 150, HEAD_H = 150;

function fitSize(text: string, width: number, max: number, min = 30) {
  return clamp(width / Math.max(1, textWidth(text, 1)), min, max);
}

// 放不下一行时自己断成两行：优先在标点后断，其次取两行最均衡处
function breakLines(text: string, size: number, width: number) {
  if (textWidth(text, size) <= width * 0.96) return [text];
  const chars = Array.from(text);
  let best = { cost: Infinity, at: Math.ceil(chars.length / 2) };
  for (let i = 2; i < chars.length - 1; i++) {
    const cost = Math.max(textWidth(chars.slice(0, i).join(''), 1), textWidth(chars.slice(i).join(''), 1)) * (/[，,、：:；; ]/.test(chars[i - 1]) ? 0.7 : 1);
    if (cost < best.cost) best = { cost, at: i };
  }
  return [chars.slice(0, best.at).join('').trim(), chars.slice(best.at).join('').trim()];
}

// 同职责文字共用一个字号：从 max 往下找，使每段文字在宽度内最多两行、且两行高度放得进 boxH
function sharedSize(texts: string[], width: number, boxH: number, max: number, min = 28) {
  for (let s = max; s > min; s -= 1) {
    const ok = texts.every((tx) => {
      const lines = breakLines(tx, s, width);
      return lines.length === 1 || (s * 1.2 * 2 <= boxH && lines.every((l) => textWidth(l, s) <= width));
    });
    if (ok) return s;
  }
  return min;
}

export function YangToolFaceOff(props: Partial<YangToolFaceOffProps>) {
  const c = { ...yangToolFaceOffDefaults, ...props };
  const t = useT();
  const rows = c.rows.slice(0, 6);
  const n = Math.max(1, rows.length);

  // 行高按行数自适应，整张表在标题下方垂直居中
  const top = HEAD_Y + HEAD_H + 40, bottom = 1010;
  const gap = n <= 4 ? 26 : 18;
  const rowH = Math.min(150, (bottom - top - (n - 1) * gap) / n);
  const tableH = n * rowH + (n - 1) * gap;
  const rowsTop = top + (bottom - top - tableH) / 2;

  // 时序：表头 0–0.45s；每行建立 + 0.42s 后翻出胜方；最后整列抬起
  const head = p(t, 0.02, 0.45);
  const step = Math.min(0.62, 2.5 / n);
  const rowAt = (i: number) => 0.55 + i * step;
  const lastFlip = rowAt(n - 1) + 0.42 + 0.3;
  const liftAt = Math.max(3.6, lastFlip + 0.25);
  const lift = p(t, liftAt, liftAt + 0.5);

  const leftWins = rows.filter((r) => r.winner === 'left').length;
  const rightWins = rows.filter((r) => r.winner === 'right').length;
  const champ: 'left' | 'right' | 'tie' = leftWins === rightWins ? 'tie' : leftWins > rightWins ? 'left' : 'right';

  const cellPad = 44;
  const cellSize = sharedSize(rows.flatMap((r) => [r.left, r.right]), COL.left.w - cellPad * 2, rowH - 26, Math.min(rowH * 0.36, 54));
  const labelSize = sharedSize(rows.map((r) => r.label), COL.label.w - 20, rowH, Math.min(rowH * 0.4, 60));

  const columnStyle = (side: 'left' | 'right'): React.CSSProperties => {
    const won = champ === side, lost = champ !== 'tie' && champ !== side;
    const col = COL[side];
    return {
      position: 'absolute', left: col.x, top: 0, width: col.w, height: 1080,
      transform: `translateY(${won ? -16 * lift : 0}px) scale(${won ? mix(1, 1.035, lift) : 1})`,
      transformOrigin: `50% ${rowsTop + tableH / 2}px`, opacity: lost ? mix(1, 0.7, lift) : 1,
    };
  };

  const Header = ({ side }: { side: 'left' | 'right' }) => {
    const tool = c[side];
    const nameSize = fitSize(tool.name, COL[side].w - 170, 76);
    const logo = 112;
    const w = logo + 28 + textWidth(tool.name, nameSize);
    return <div style={{
      position: 'absolute', left: (COL[side].w - w) / 2, top: HEAD_Y + (HEAD_H - logo) / 2 + (1 - head) * 30,
      display: 'flex', alignItems: 'center', gap: 28, opacity: head,
    }}>
      <ImgFill src={tool.logo} style={{ width: logo, height: logo, objectFit: 'contain', borderRadius: 26 }} />
      <span style={{ ...textBase(nameSize, 900), color: champ === side && lift > 0.5 ? S.accent : S.ink }}>{tool.name}</span>
    </div>;
  };

  const Cell = ({ side, row, i }: { side: 'left' | 'right'; row: YangFaceOffRow; i: number }) => {
    const enter = p(t, rowAt(i) + (side === 'left' ? 0.06 : 0.12), rowAt(i) + (side === 'left' ? 0.06 : 0.12) + 0.42);
    const win = row.winner === side;
    const flip = win ? q(t, rowAt(i) + 0.42, rowAt(i) + 0.72) : 0;
    const y = rowsTop + i * (rowH + gap);
    // 胜方：白面 → 黑面（文字反白、加粗）；败方保持白面
    const bg = `rgb(${mix(255, 25, flip)},${mix(255, 25, flip)},${mix(255, 28, flip)})`;
    const ink = flip > 0.5 ? '#fff' : S.ink;
    const loseDim = row.winner !== 'tie' && !win ? mix(1, 0.55, q(t, rowAt(i) + 0.42, rowAt(i) + 0.72)) : 1;
    return <div style={{
      position: 'absolute', left: 0, top: y + (1 - enter) * 40, width: COL[side].w, height: rowH,
      background: bg, borderRadius: S.radius, boxShadow: flip > 0.5 ? S.capsuleShadow : S.shadow, opacity: enter,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      <span style={{ ...textBase(cellSize, win && flip > 0.5 ? 900 : 500), lineHeight: 1.2, textAlign: 'center', color: ink, opacity: loseDim }}>{breakLines(side === 'left' ? row.left : row.right, cellSize, COL[side].w - cellPad * 2).map((l, k) => <div key={k}>{l}</div>)}</span>
    </div>;
  };

  return <Frame>
    {/* 标准列：只放文字，不做卡片 */}
    {rows.map((r, i) => {
      const enter = p(t, rowAt(i), rowAt(i) + 0.4);
      const y = rowsTop + i * (rowH + gap);
      return <div key={i} style={{
        ...textBase(labelSize, 900), lineHeight: 1.2, position: 'absolute', left: COL.label.x, top: y + (1 - enter) * 30,
        width: COL.label.w - 20, height: rowH, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: S.ink, opacity: enter,
      }}>{breakLines(r.label, labelSize, COL.label.w - 20).map((l, k) => <div key={k}>{l}</div>)}</div>;
    })}

    {(['left', 'right'] as const).map((side) => <div key={side} style={columnStyle(side)}>
      <Header side={side} />
      {rows.map((r, i) => <Cell key={i} side={side} row={r} i={i} />)}
    </div>)}

    
    
  </Frame>;
}
