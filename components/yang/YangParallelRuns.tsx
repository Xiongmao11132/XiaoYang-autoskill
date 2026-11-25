// YangParallelRuns — one list becomes many parallel runs: a real screenshot table is shown whole, then each row flies out of the table into its lane's small window; lanes tick their rows off at independent speeds with their own progress bars; when all finish, the windows merge back into one and a conclusion pill lands (原版 T09w). Rows are crops of the same source image throughout — the object never changes, only its grouping.
// Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
// Source: member package fred-recording-8-20261018
//   source/src/components/T09w-ParallelRuns.tsx (+ kit/theme.ts, kit/ui.tsx)
//   package first public release: 2026-10-18 (early-access window ended 2026-11-01); downloaded 2026-11-02 via the
//   public visual-library route (fred-fu.com, anonymous, authorization: not-required).
//   Package ZIP: 34,039,291 bytes, SHA-256 b06d66380b266d927a91b1ddcc1de01f0ae32e4681f19e792585776549c76329
//   archived at ~/workspace/tools/FredTalk/downloads-b/fred-recording-8-20261018-source.zip
// Integration notes: Sfx and Brand NOT integrated. Original fonts replaced by the library FONT
//   (../src/theme); kit colors kept as the original 109-spec palette constants (S). All copy/numbers/media
//   are props with neutral example defaults (the original's own chapter titles, screenshots and recordings
//   are NOT bundled). source defaults to an empty string: neutral placeholder cells then stand in for the table rows.
// Layout: 1920x1080 logical stage, scaled by host width (Frame).
import React from 'react';
import { Easing, Freeze, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

// —— kit 最小移植（wave2 / recording 两包同版 kit：theme.ts + ui.tsx + _shared.ts）——
// 与 B 类章节包移植的差异：本批 kit 为 v2/v3 版——Handoff 的 enter/exit 是字符串枚举（含 enterAt 语义），
// 另有 settle()（无过冲落定）与 cueAt 口播锚点。字体统一换本库 FONT，Brand/Sfx/Fonts 不集成。
const S = {
  ink: '#19191c', dark: '#19191c', windowBody: '#212123', windowBar: '#161618',
  muted: '#6c6c72', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  radius: 24, shadow: '0 16px 25px 0 rgba(0,0,0,0.1333)',
  capsuleShadow: '30px 22px 25px #0005', windowShadow: '-25px 6px 35px #0003',
  textShadowDark: '8px 9px 5px #000',
};
type Box = { x: number; y: number; w: number; h: number };
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const q = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * (3 - 2 * v); };
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
const settle = (t: number, delay: number, duration = 0.8) => p(t, delay, delay + Math.max(0.3, duration * 0.6));

const useT = () => useCurrentFrame() / useVideoConfig().fps;

function Frame({ dark, children }: { dark?: boolean; brand?: boolean; children: React.ReactNode }) {
  return <div style={{ position: 'absolute', inset: 0, background: dark ? S.dark : '#fff', overflow: 'hidden', fontFamily: FONT }}>{children}</div>;
}

type Enter = 'cut' | 'fade' | 'rise' | 'grow';
type Exit = 'none' | 'recede' | 'fade' | 'cut' | 'slide-left' | 'slide-up';
type YangHandoffProps = { enter?: Enter; exit?: Exit; exitAt?: number };

function Handoff({ enter = 'cut', exit = 'none', exitAt, children }: YangHandoffProps & { children: React.ReactNode }) {
  const t = useT();
  const { durationInFrames, fps } = useVideoConfig();
  const T = durationInFrames / fps;
  const enterAt = 0.06, enterDur = 0.3;
  const exitDur = exit === 'cut' ? 0.05 : 0.4;
  const startAt = exitAt !== undefined ? Math.max(0, exitAt) : Math.max(enterAt, T - exitDur - 0.02);
  let transform = 'none', opacity = 1;
  if (t < enterAt + enterDur) {
    const v = enter === 'fade' || enter === 'cut' ? p(t, enterAt, enterAt + enterDur)
      : enter === 'rise' ? q(t, enterAt, enterAt + enterDur)
        : springAt(t, enterAt, enterDur * 1.6);
    if (enter === 'fade') opacity = v;
    else if (enter === 'rise') transform = `translateY(${(1 - v) * 260}px)`;
    else if (enter === 'grow') transform = `scale(${mix(0.92, 1, v)})`;
  }
  if (exit !== 'none' && t >= startAt) {
    const v = exit === 'cut' ? p(t, startAt, startAt + exitDur) : q(t, startAt, startAt + exitDur);
    if (exit === 'recede') transform = `scale(${mix(1, 0.94, v)})`;
    else if (exit === 'fade') opacity = 1 - v;
    else if (exit === 'cut') opacity = 1 - v;
    else if (exit === 'slide-left') transform = `translateX(${-v * 340}px)`;
    else if (exit === 'slide-up') transform = `translateY(${-v * 260}px)`;
  }
  return <div style={{ position: 'absolute', inset: 0, transformOrigin: '960px 540px', transform, opacity }}>{children}</div>;
}

const textBase = (size: number, weight: number, _family?: string): React.CSSProperties => ({
  fontFamily: FONT, fontSize: size, fontWeight: weight, lineHeight: 1.25, whiteSpace: 'nowrap',
});
const abs = (b: Box): React.CSSProperties => ({ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h });
const between = (a: Box, b: Box, v: number): Box => ({ x: mix(a.x, b.x, v), y: mix(a.y, b.y, v), w: mix(a.w, b.w, v), h: mix(a.h, b.h, v) });
const center = (cx: number, cy: number, w: number, h: number): Box => ({ x: cx - w / 2, y: cy - h / 2, w, h });

function Surface({ box, dark, light, radius = S.radius, shadow = S.shadow, style, children }: {
  box: Box; dark?: boolean; light?: boolean; radius?: number; shadow?: string; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  return <div style={{
    ...abs(box), borderRadius: radius, overflow: 'hidden',
    background: dark ? S.windowBody : light ? '#fff' : '#fcfcfc',
    color: dark ? '#fff' : S.ink, boxShadow: shadow, ...style,
  }}>{children}</div>;
}

function Pill({ box, dark, style, children }: { box: Box; dark?: boolean; style?: React.CSSProperties; children?: React.ReactNode }) {
  return <div style={{
    ...abs(box), borderRadius: box.h / 2, background: dark === false ? '#fff' : S.dark,
    color: dark === false ? S.ink : '#fff', boxShadow: S.capsuleShadow,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, ...style,
  }}>{children}</div>;
}

function MacWindow({ box, light, bar = 64, radius = S.radius, style, children }: {
  box: Box; light?: boolean; bar?: number; radius?: number; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  const body = light ? '#fff' : S.windowBody, barBg = light ? '#f2f2f4' : S.windowBar;
  return <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', background: body, boxShadow: S.windowShadow, ...style }}>
    <div style={{ height: bar, background: barBg, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 13 }}>
      <span style={{ width: 21, height: 21, borderRadius: '50%', background: '#D8D8DC', display: 'inline-block' }} />
      <span style={{ width: 21, height: 21, borderRadius: '50%', background: '#C6C6CB', display: 'inline-block' }} />
      <span style={{ width: 21, height: 21, borderRadius: '50%', background: '#AEAFB4', display: 'inline-block' }} />
    </div>
    <div style={{ position: 'absolute', left: 0, top: bar, right: 0, bottom: 0 }}>{children}</div>
  </div>;
}

// 媒体：src 为空串时渲染中性占位面（浅灰 + 细横线纹理），不引用任何原版素材
function Media({ src, box, radius = 18, style, objectPosition = '50% 50%' }: {
  src: string; box: Box; radius?: number; style?: React.CSSProperties; objectPosition?: string;
}) {
  if (!src) {
    return <div style={{
      ...abs(box), borderRadius: radius, overflow: 'hidden', backgroundColor: '#ececef',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 54px, rgba(25,25,28,0.07) 54px 55px)', ...style,
    }} />;
  }
  const isVideo = /\.(mp4|mov|webm)$/i.test(src);
  const mediaStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', objectPosition, display: 'block' };
  return <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', background: S.dark, ...style }}>
    {isVideo
      ? <OffthreadVideo muted src={staticFile(src)} style={mediaStyle} />
      : <Img src={staticFile(src)} style={mediaStyle} />}
  </div>;
}

// 图片（可空）：空串时用同几何的中性占位面代替，保证版式与动效可核验
const SrcImg = ({ src, style }: { src: string; style: React.CSSProperties }) =>
  src
    ? <Img src={staticFile(src)} style={style} />
    : <div style={{ ...style, backgroundColor: '#ececef', backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 46px, rgba(25,25,28,0.08) 46px 47px)' }} />;

function Cursor({ x, y, scale = 1, press = 0, dark, style }: {
  x: number; y: number; scale?: number; press?: number; dark?: boolean; style?: React.CSSProperties;
}) {
  const s = scale * (1 - 0.12 * press);
  return <svg width={44 * s} height={44 * s} viewBox="0 0 44 44" style={{ position: 'absolute', left: x, top: y, zIndex: 900, filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))', ...style }}>
    <path d="M8 3 L36 22 L23.5 25.5 L29 39 L22.5 42 L17 28.5 L9 36 Z" fill={dark ? '#19191c' : '#fff'} stroke={dark ? '#fff' : '#19191c'} strokeWidth={2.4} strokeLinejoin="round" />
  </svg>;
}

function ClickRing({ x, y, t, at, dark }: { x: number; y: number; t: number; at: number; dark?: boolean }) {
  const v = clamp((t - at) / 0.45);
  if (v <= 0 || v >= 1) return null;
  const r = mix(10, 46, v);
  return <div style={{
    position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%',
    border: `4px solid ${dark ? '#19191c' : S.accent}`, opacity: 1 - v, zIndex: 890, pointerEvents: 'none',
  }} />;
}

function Spotlight({ rects, amount, dim = 0.3, pad = 24, radius = 0, feather = 40 }: {
  rects: Box[]; amount: number; dim?: number; pad?: number; radius?: number; feather?: number;
}) {
  if (amount <= 0.003 || rects.length === 0) return null;
  const stops: string[] = [];
  const soft = Math.max(1, feather);
  for (const r of rects) {
    const x0 = r.x - pad, y0 = r.y - pad, x1 = r.x + r.w + pad, y1 = r.y + r.h + pad;
    const rad = radius + pad;
    stops.push(
      `radial-gradient(ellipse ${Math.max(1, (x1 - x0) / 2 + soft)}px ${Math.max(1, (y1 - y0) / 2 + soft)}px at ${(x0 + x1) / 2}px ${(y0 + y1) / 2}px, ` +
      `transparent ${Math.max(0, Math.min((x1 - x0) / 2, (y1 - y0) / 2) - rad * 0.2)}px, rgba(0,0,0,${dim * amount}) 100%)`,
    );
  }
  return <div style={{ position: 'absolute', inset: 0, background: stops.join(','), opacity: 1, pointerEvents: 'none' }} />;
}

// —— _shared.ts 移植：章节小工具 ——
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const partLabel = (index: number, label: string) => label || `第${CN[index] ?? index}部分`;
const pad2 = (n: number) => String(n).padStart(2, '0');
const fit = (s: string, size: number, maxW: number) => Math.min(size, maxW / Math.max(1, textWidth(s, 1)));
const splitTitle = (title: string, per = 8.5): string[] => {
  const lines: string[] = [];
  let cur = '';
  for (const ch of Array.from(title)) {
    cur += ch;
    if (textWidth(cur, 1) >= per || /[：:、，,；;]/.test(ch)) { lines.push(cur); cur = ''; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [title];
};
const splitHighlight = (s: string, hl: string): [string, string, string] => {
  const i = s.indexOf(hl);
  return i < 0 ? [s, '', ''] : [s.slice(0, i), hl, s.slice(i + hl.length)];
};
const rand = (seed: number) => {
  let x = seed % 2147483647;
  if (x <= 0) x += 2147483646;
  return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
};
const zoomMix = (a: number, b: number, v: number) => Math.exp(mix(Math.log(a), Math.log(b), v));
const easeIn = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * v; };


type Rect = { x: number; y: number; w: number; h: number };
export type RunLane = {
  label: string;      // 这一组是什么
  rows: number[];     // 这一组包含表格的哪几行（rowTops 的下标）
  duration: number;   // 开跑后多久查完（秒）
};
export type YangParallelRunsProps = YangHandoffProps & {
  source: string;       // 真实表格截图；留空用中性占位格
  sourceSize: { w: number; h: number };
  tableCrop: Rect;      // 开场整表显示的区域（源像素）
  cellX: { x: number; w: number };   // 每行取哪一栏（源像素，横向）
  rowTops: number[];    // 每一行的上边线（源像素）
  lineTop: number;      // 行内第一行字相对上边线的偏移（源像素）
  lineH: number;        // 取多高的一条（源像素）
  lanes: RunLane[];
  doneLabel: string;
  highlight: string;
  cues?: number[];      // [0]=拆开，[1]=合回
};

export const yangParallelRunsDefaults: YangParallelRunsProps = {
  source: '',
  sourceSize: { w: 1200, h: 3000 },
  tableCrop: { x: 80, y: 1200, w: 1040, h: 1600 },
  cellX: { x: 200, w: 500 },
  rowTops: [1300, 1500, 1700, 1900, 2100, 2300, 2500, 2700, 2900],
  lineTop: 14,
  lineH: 80,
  lanes: [
    { label: '第一组', rows: [0, 1, 2], duration: 1.5 },
    { label: '第二组', rows: [3, 4, 5], duration: 2.0 },
    { label: '第三组', rows: [6, 7, 8], duration: 2.4 },
  ],
  doneLabel: '几组同时查完',
  highlight: '同时',
};

export function YangParallelRuns(props: Partial<YangParallelRunsProps>) {
  const c = { ...yangParallelRunsDefaults, ...props };
  const t = useT();
  const lanes = (c.lanes.length ? c.lanes : yangParallelRunsDefaults.lanes).map((l) => ({ ...l, rows: l.rows.filter((r) => r >= 0 && r < c.rowTops.length) }));
  const n = lanes.length;

  // —— 开场整表：按源比例放在正中 ——
  const TC = c.tableCrop;
  const k0 = Math.min(1500 / TC.w, 960 / TC.h);
  const BIG: Box = { w: TC.w * k0, h: TC.h * k0, x: 960 - (TC.w * k0) / 2, y: 545 - (TC.h * k0) / 2 };
  const inBig = (r: Rect): Box => ({ x: BIG.x + (r.x - TC.x) * k0, y: BIG.y + (r.y - TC.y) * k0, w: r.w * k0, h: r.h * k0 });
  const itemSrc = (r: number): Rect => ({ x: c.cellX.x, y: c.rowTops[r] + c.lineTop, w: c.cellX.w, h: c.lineH });

  // —— 小窗版式 ——
  const cols = Math.min(3, n), rowsN = Math.ceil(n / cols);
  const GAP = 30, LABEL = 70, BAR = 64, PADY = 16, IG = 6, RIGHT = 74, LEFT = 16;
  const maxItemsRow = Array.from({ length: rowsN }, (_, r) => Math.max(...lanes.map((l, i) => (Math.floor(i / cols) === r ? l.rows.length : 0))));
  const sW = ((1850 - (cols - 1) * GAP) / cols - LEFT - RIGHT) / c.cellX.w;
  const fixedH = rowsN * (LABEL + BAR + PADY * 2) + (rowsN - 1) * GAP;
  const varH = maxItemsRow.reduce((a, mm) => a + mm * c.lineH + Math.max(0, mm - 1) * IG, 0);
  const s = Math.min(1.08, sW, (1010 - fixedH) / Math.max(1, varH));
  const bh = c.lineH * s, cw = c.cellX.w * s;
  const CW = cw + LEFT + RIGHT;
  const cardH = (r: number) => maxItemsRow[r] * bh + Math.max(0, maxItemsRow[r] - 1) * IG + PADY * 2;
  const blockH = Array.from({ length: rowsN }, (_, r) => cardH(r) + LABEL + BAR).reduce((a, b) => a + b, 0) + (rowsN - 1) * GAP;
  const cardBox = (i: number, merged: boolean): Box => {
    const col = i % cols, row = Math.floor(i / cols);
    const rowN = Math.min(cols, n - row * cols);
    const g = merged ? 0 : GAP;
    const totalW = rowN * CW + (rowN - 1) * g;
    const x = 960 - totalW / 2 + col * (CW + g);
    let y: number;
    if (merged) {
      const mh = Array.from({ length: rowsN }, (_, r) => cardH(r)).reduce((a, b) => a + b, 0);
      y = 470 - mh / 2;
      for (let r = 0; r < row; r++) y += cardH(r);
    } else {
      y = 555 - blockH / 2 + LABEL;
      for (let r = 0; r < row; r++) y += cardH(r) + LABEL + BAR + GAP;
    }
    return { x, y, w: CW, h: cardH(row) };
  };
  const slot = (card: Box, j: number): Box => ({ x: card.x + LEFT, y: card.y + PADY + j * (bh + IG), w: cw, h: bh });

  // —— 时间 ——
  const enter = p(t, 0, 0.3);
  const splitAt = cueAt(c.cues, 0, 0.7);
  const nItems = lanes.reduce((a, l) => a + l.rows.length, 0);
  const stagger = Math.min(0.03, 0.4 / Math.max(1, nItems));
  const runAt = splitAt + 0.95;
  const doneAt = lanes.map((l) => runAt + l.duration);
  const allDone = Math.max(...doneAt);
  const mergeAt = cueAt(c.cues, 1, allDone + 0.4);
  const merge = q(t, mergeAt, mergeAt + 0.5);
  const pillAt = mergeAt + 0.45;
  const pillIn = settle(t, pillAt, 0.6);
  const bigFade = 1 - q(t, splitAt, splitAt + 0.35);
  const cardIn = p(t, splitAt + 0.25, splitAt + 0.6);
  const sideOut = 1 - q(t, mergeAt - 0.05, mergeAt + 0.25);

  const DS = Math.min(68, 1300 / Math.max(1, textWidth(c.doneLabel, 1)));
  const PW = textWidth(c.doneLabel, DS) + DS * 1.8, PH = DS * 2;
  const [before, after = ''] = c.doneLabel.split(c.highlight);
  const hasHL = !!c.highlight && c.doneLabel.includes(c.highlight);
  const mergedBottom = Math.max(...lanes.map((_, i) => { const b = cardBox(i, true); return b.y + b.h; }));

  const crop = (b: Box, r: Rect, extra?: React.CSSProperties, key?: React.Key) => {
    const kk = b.w / r.w;
    return <div key={key} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, overflow: 'hidden', ...extra }}>
      <SrcImg src={c.source} style={{ position: 'absolute', left: -r.x * kk, top: -r.y * kk, width: c.sourceSize.w * kk, height: c.sourceSize.h * kk }} />
    </div>;
  };
  let gi = 0;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 整表：开场全貌，拆开时退掉（每一行自己飞走） */}
      {bigFade > 0 && crop({ ...BIG, y: BIG.y + (1 - enter) * 30 }, TC, { opacity: enter * bigFade, borderRadius: 20, boxShadow: S.shadow, background: '#fff' })}

      {/* 合回后的一个窗口底 */}
      {merge > 0 && (() => {
        const bs = lanes.map((_, i) => cardBox(i, true));
        const x0 = Math.min(...bs.map((b) => b.x)), y0 = Math.min(...bs.map((b) => b.y));
        const x1 = Math.max(...bs.map((b) => b.x + b.w)), y1 = Math.max(...bs.map((b) => b.y + b.h));
        return <Surface box={{ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }} style={{ opacity: merge }} />;
      })()}

      {lanes.map((l, i) => {
        const card = between(cardBox(i, false), cardBox(i, true), merge);
        const run = clamp((t - runAt) / l.duration);
        const done = t >= doneAt[i];
        const cnt = l.rows.length;
        const shown = Math.min(cnt, Math.floor(run * cnt + 1e-6));
        const LS = Math.min(44, (CW - 70) / Math.max(1, textWidth(l.label, 1)));
        const lab = cardBox(i, false);
        const tick = done ? settle(t, doneAt[i], 0.45) : 0;
        return <React.Fragment key={i}>
          <Surface box={card} radius={mix(20, 0, merge)} shadow={merge > 0.5 ? 'none' : S.shadow} style={{ opacity: cardIn }} />
          {/* 组名 + 完成勾 */}
          <div style={{ position: 'absolute', left: lab.x, width: lab.w, top: lab.y - LABEL + 4, height: LABEL - 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: cardIn * sideOut }}>
            <span style={{ ...textBase(LS, 900), color: done ? S.ink : S.muted }}>{l.label}</span>
            {tick > 0 && <span style={{ width: 44, height: 44, borderRadius: 22, background: S.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${mix(0.4, 1, tick)})` }}>
              <svg width={28} height={28} viewBox="0 0 24 24"><path d="M5 12.5 L10 17 L19 7.5" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>}
          </div>
          {/* 进度：底条 + 已查数 */}
          <div style={{ position: 'absolute', left: lab.x + 10, top: lab.y + lab.h + 22, width: lab.w - 20, height: 12, borderRadius: 6, background: 'rgba(25,25,28,0.10)', opacity: cardIn * sideOut }} />
          <div style={{ position: 'absolute', left: lab.x + 10, top: lab.y + lab.h + 22, width: (lab.w - 20) * run, height: 12, borderRadius: 6, background: S.ink, opacity: cardIn * sideOut }} />
          <div style={{ ...textBase(36, 600), position: 'absolute', left: lab.x, width: lab.w - 10, top: lab.y + lab.h + 38, textAlign: 'right', color: done ? S.ink : S.muted, opacity: cardIn * sideOut }}>{shown}/{cnt}</div>

          {/* 每一行：从整表原位飞进小窗；查到它时右侧落一个黑色勾 */}
          {l.rows.map((r, j) => {
            const kk2 = gi++;
            const midCol = cols % 2 === 1 && i % cols === (cols - 1) / 2;
            const f0 = splitAt + kk2 * stagger + (midCol ? 0.22 : 0);
            const ux = q(t, f0, f0 + 0.32), uy = q(t, f0 + 0.18, f0 + 0.55);
            const dst = slot(card, j);
            const src0 = inBig(itemSrc(r));
            const b = uy < 1 ? { x: mix(src0.x, dst.x, ux), y: mix(src0.y, dst.y, uy), w: mix(src0.w, dst.w, uy), h: mix(src0.h, dst.h, uy) } : dst;
            const checkAt = runAt + l.duration * ((j + 1) / cnt);
            const ck = settle(t, checkAt - 0.04, 0.3);
            const active = t >= runAt && t < checkAt && t >= runAt + l.duration * (j / cnt);
            return <React.Fragment key={j}>
              {active && <div style={{ position: 'absolute', left: dst.x - 10, top: dst.y - 2, width: cw + 20, height: bh + 4, borderRadius: 10, background: 'rgba(25,25,28,0.06)' }} />}
              {crop(b, itemSrc(r), { opacity: ck > 0 ? mix(1, 0.92, ck) : 1 }, `c${j}`)}
              {ck > 0 && <div style={{
                position: 'absolute', left: dst.x + cw + 14, top: dst.y + bh / 2 - 22, width: 44, height: 44, borderRadius: 22, background: S.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${mix(0.4, 1, ck)})`, opacity: clamp(ck * 2),
              }}>
                <svg width={26} height={26} viewBox="0 0 24 24"><path d="M5 12.5 L10 17 L19 7.5" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={22} strokeDashoffset={22 * (1 - ck)} /></svg>
              </div>}
            </React.Fragment>;
          })}
        </React.Fragment>;
      })}

      {pillIn > 0 && <Pill box={{ x: 960 - PW / 2, y: Math.min(1040 - PH, mergedBottom + 50) + (1 - pillIn) * 24, w: PW, h: PH }} style={{ opacity: pillIn, zIndex: 60 }}>
        <span style={{ ...textBase(DS, 400), color: '#fff' }}>
          {hasHL ? <>{before}<span style={{ color: S.accentDark }}>{c.highlight}</span>{after}</> : c.doneLabel}
        </span>
      </Pill>}
    </Handoff>
  </Frame>;
}
