// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T17c-FileTree.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：文件夹结构（正版 T17c）——一个文件夹 → 逐层展开成目录树，关键文件被点亮并标注。
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

export type YangTreeRow = { name: string; depth: number; note?: string };

export type YangFileTreeProps = YangHandoffProps & {
  tree: YangTreeRow[];       // 按显示顺序；depth 0 为根；文件夹名以 / 结尾
  cues?: number[];       // [0..maxDepth-1]=第 1..maxDepth 层展开；之后依次是每个带 note 的行点亮
};

// 默认内容：原作者的公开仓库 YangTalk 的真实目录（git ls-files 核对，2026-10-12）
export const yangFileTreeDefaults: YangFileTreeProps = {
  tree: [
    { name: 'YangTalk/', depth: 0 },
    { name: 'apps/', depth: 1 },
    { name: 'docs/', depth: 1 },
    { name: 'scripts/', depth: 1, note: '安装、检查用的脚本' },
    { name: 'skills/', depth: 1, note: 'Skill 本体都在这里' },
    { name: 'yang-remotion-output/', depth: 2 },
    { name: 'yang-remake/', depth: 2 },
    { name: 'cloud-render/', depth: 2 },
    { name: '.gitignore', depth: 1 },
    { name: 'README.md', depth: 1, note: '先看这个：项目说明书' },
  ],
};

const MONO_W = 0.6 / 0.58;   // Source Code Pro 每字约 0.6em；textWidth 的拉丁字按 0.58 估
const LINE = '#c9c9cf';

function Icon({ folder, size, color }: { folder: boolean; size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
    {folder
      ? <path d="M2.5 6.2A1.7 1.7 0 0 1 4.2 4.5h4.6l2.1 2.2h8.9a1.7 1.7 0 0 1 1.7 1.7v9.4a1.7 1.7 0 0 1-1.7 1.7H4.2a1.7 1.7 0 0 1-1.7-1.7z" fill={color} />
      : <g fill="none" stroke={color} strokeWidth={1.9} strokeLinejoin="round"><path d="M6 2.8h8.2l4.3 4.3v14.1H6z" /><path d="M14 2.8v4.5h4.5" /></g>}
  </svg>;
}

export function YangFileTree(props: Partial<YangFileTreeProps>) {
  const c = { ...yangFileTreeDefaults, ...props };
  const t = useT();
  const rows = (c.tree.length ? c.tree : yangFileTreeDefaults.tree).slice(0, 14).map((r) => ({ ...r, depth: Math.max(0, Math.round(r.depth)) }));
  const n = rows.length;
  const maxDepth = Math.max(0, ...rows.map((r) => r.depth));

  // —— 终态版式 ——
  const LH = Math.min(92, 860 / n);
  const NOTE = Math.min(46, LH * 0.54);
  const longestName = Math.max(...rows.map((r) => r.depth * 1.4 + 1.5 + textWidth(r.name, 1) * MONO_W));
  const notes = rows.filter((r) => r.note).map((r) => r.note as string);
  const noteUnits = Math.max(0, ...notes.map((s) => textWidth(s, 1)));
  // 字号：树 + 标注列一起放进 1640 宽
  // 标注列紧跟在“带标注的行”里最长的文件名后面（不被别的长行拖远）
  const unitW = (r: YangTreeRow) => r.depth * 1.4 + 1.5 + textWidth(r.name, 1) * MONO_W;
  const litLongest = Math.max(0, ...rows.filter((r) => r.note).map(unitW));
  const needUnits = Math.max(longestName, noteUnits ? litLongest + 1.8 + noteUnits * 0.92 + 1.0 : 0);
  const FS = Math.min(52, LH * 0.58, 1640 / needUnits);
  const NS = Math.min(NOTE, FS * 0.92);
  const IND = FS * 1.4, ICON = FS * 1.08, GAPI = FS * 0.42;
  const treeW = longestName * FS;
  const COL_GAP = FS * 1.8;
  const noteW = noteUnits * NS;
  const groupW = Math.max(treeW, noteUnits ? litLongest * FS + COL_GAP + noteW + NS * 0.9 : 0);

  // —— 时间 ——
  const layerGap = maxDepth > 1 ? Math.min(0.86, 1.5 / (maxDepth - 1)) : 0.86;   // 层多就展开得紧一点
  const layerAt = (d: number) => cueAt(c.cues, d - 1, 0.42 + (d - 1) * layerGap);
  const order = rows.map((r, i) => rows.slice(0, i).filter((x) => x.depth === r.depth).length);
  const w = rows.map((r, i) => r.depth === 0 ? 1 : q(t, layerAt(r.depth) + order[i] * 0.055, layerAt(r.depth) + order[i] * 0.055 + 0.42));
  // 行内容在它被让出大半空间后才显出来，展开途中不和下一行叠字
  const shown = rows.map((r, i) => r.depth === 0 ? p(t, 0, 0.32) : clamp((w[i] - 0.5) / 0.5));
  const lastLayerEnd = maxDepth > 0 ? layerAt(maxDepth) + rows.filter((r) => r.depth === maxDepth).length * 0.055 + 0.42 : 0.4;
  const litRows = rows.map((r, i) => (r.note ? i : -1)).filter((i) => i >= 0);
  const lightStart = lastLayerEnd + 0.42;
  const lightGap = litRows.length > 1 ? Math.min(0.66, (4.15 - lightStart) / (litRows.length - 1)) : 0;   // 最后一条在 4.15s 前点亮，留足稳定阅读
  const lightAt = (k: number) => cueAt(c.cues, maxDepth + k, lightStart + k * lightGap);
  const shift = noteUnits ? q(t, lastLayerEnd + 0.02, lastLayerEnd + 0.52) : 0;

  // 行位置：每行的 y = 它前面各行“已展开份额”之和，展开时下方各行被连续推开
  const H = w.reduce((s, v) => s + v, 0) * LH;
  const top = 556 - H / 2;
  const ys = rows.map((_, i) => top + w.slice(0, i).reduce((s, v) => s + v, 0) * LH);
  const left = mix(960 - treeW / 2, 960 - groupW / 2, shift);
  const iconX = (r: YangTreeRow) => left + r.depth * IND;
  const nameX = (r: YangTreeRow) => iconX(r) + ICON + GAPI;
  const colX = left + litLongest * FS + COL_GAP;

  // 竖线：每个有子项的行，从图标下方画到最后一个直接子项
  const lines: React.ReactNode[] = [];
  rows.forEach((r, i) => {
    const kids: number[] = [];
    for (let j = i + 1; j < n && rows[j].depth > r.depth; j++) if (rows[j].depth === r.depth + 1) kids.push(j);
    if (!kids.length) return;
    const cx = iconX(r) + ICON / 2;
    const y0 = ys[i] + LH / 2 + ICON * 0.5;
    const last = kids[kids.length - 1];
    const yEnd = ys[last] + LH / 2;
    const vis = Math.max(...kids.map((k) => w[k]));
    lines.push(<path key={`v${i}`} d={`M${cx} ${y0} L${cx} ${Math.max(y0, yEnd)}`} stroke={LINE} strokeWidth={3} strokeLinecap="round" opacity={clamp(vis * 1.5)} />);
    kids.forEach((k) => {
      const y = ys[k] + LH / 2;
      lines.push(<path key={`h${k}`} d={`M${cx} ${y} L${iconX(rows[k]) - FS * 0.26} ${y}`} stroke={LINE} strokeWidth={3} strokeLinecap="round" opacity={shown[k]} />);
    });
  });

  const rowContent = (r: YangTreeRow, i: number, ink: string, noteInk?: string) => {
    const folder = r.name.endsWith('/');
    return <>
      <div style={{ position: 'absolute', left: iconX(r), top: ys[i] + (LH - ICON) / 2 }}><Icon folder={folder} size={ICON} color={ink} /></div>
      <div style={{ position: 'absolute', left: nameX(r), top: ys[i], height: LH, display: 'flex', alignItems: 'center', ...textBase(FS, 600, S.mono), lineHeight: 1, color: ink }}>{r.name}</div>
      {noteInk && r.note && <div style={{ position: 'absolute', left: colX, top: ys[i], height: LH, display: 'flex', alignItems: 'center', ...textBase(NS, 500), lineHeight: 1, color: noteInk }}>{r.note}</div>}
    </>;
  };

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>{lines}</svg>
      {rows.map((r, i) => <div key={i} style={{ position: 'absolute', inset: 0, opacity: shown[i], transform: `translateX(${(1 - shown[i]) * -18}px)` }}>
        {rowContent(r, i, r.depth === 0 ? S.ink : '#2a2a2e')}
      </div>)}
      {/* 关键行：黑条从左擦过，经过处反白，并延伸到标注列 */}
      {litRows.map((i, k) => {
        const r = rows[i];
        const at = lightAt(k);
        const e = p(t, at, at + 0.55);
        if (e <= 0) return null;
        const h = Math.min(LH * 0.86, FS * 1.7);
        const x0 = iconX(r) - FS * 0.5;
        const x1 = colX + noteW + NS * 0.9;   // 所有亮条右端对齐，像文件管理器里的选中行
        const reveal = x0 + (x1 + 70 - x0) * e;   // 多擦 70px，给右下投影留位置
        return <div key={i} style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${1920 - reveal}px 0 0)` }}>
          <div style={{ position: 'absolute', left: x0, top: ys[i] + (LH - h) / 2, width: x1 - x0, height: h, borderRadius: h / 2, background: S.dark, boxShadow: S.capsuleShadow }} />
          {rowContent(r, i, '#fff', k === litRows.length - 1 || t < lightAt(k + 1) ? S.accentDark : '#fff')}
        </div>;
      })}
    </Handoff>
    
  </Frame>;
}
