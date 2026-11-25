// YangMentionChip — @ mention in a real input box: the full window shows briefly, the input box lifts out (background dims and blurs) while the camera pushes in; typing @ pops the suggestion list upward, the picked row flies back into the input and shrinks into an in-text chip, and typing continues after it (YangTalk T09z). The picked row and the chip are the same object. The suggestion list is a kit card — it does not fake a native menu.
// Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
// Source: member package fred-recording-8-20261018
//   source/src/components/T09z-MentionChip.tsx (+ kit/theme.ts, kit/ui.tsx)
//   package first public release: 2026-10-18 (early-access window ended 2026-11-01); downloaded 2026-11-02 via the
//   public visual-library route (fred-fu.com, anonymous, authorization: not-required).
//   Package ZIP: 34,039,291 bytes, SHA-256 b06d66380b266d927a91b1ddcc1de01f0ae32e4681f19e792585776549c76329
//   archived at ~/workspace/tools/FredTalk/downloads-b/fred-recording-8-20261018-source.zip
// Integration notes: Sfx and Brand NOT integrated. Original fonts replaced by the library FONT
//   (../src/theme); kit colors kept as the original 109-spec palette constants (S). All copy/numbers/media
//   are props with neutral example defaults (the original chapter titles, screenshots and recordings
//   are NOT bundled). image defaults to an empty string: a neutral placeholder surface then stands in for the screenshot.
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
export type MentionItem = { icon?: string; label: string; desc?: string };
export type YangMentionChipProps = YangHandoffProps & {
  image: string;              // 真实整窗截图；留空用中性占位面
  imageSize: { w: number; h: number };
  crop: Rect;                 // 输入框本体（源像素，贴着边线取）
  cropRadius: number;         // 输入框圆角（源像素）
  lift: number;               // 输入框从窗口里浮起多少（源像素，向上）
  textStart: { x: number; y: number };   // 第一行文字起点（左端、行中线，源像素）
  textSize: number;           // 截图里正文的字号（源像素）
  placeholderBox: Rect;       // 要盖掉的占位字（源像素）
  maskBoxes?: Rect[];
  prefix: string;             // @ 前已经打好的字
  query: string;              // @ 后接着打的检索词（可空）
  items: MentionItem[];
  pick: number;               // 选第几项
  after: string;              // 标签后继续打的字
  cues?: number[];            // [0]=打出 @，[1]=选中，[2]=开始继续打字
};

export const yangMentionChipDefaults: YangMentionChipProps = {
  image: '',
  imageSize: { w: 1920, h: 1080 },
  crop: { x: 500, y: 800, w: 1000, h: 140 },
  cropRadius: 34,
  lift: 90,
  textStart: { x: 530, y: 838 },
  textSize: 28,
  placeholderBox: { x: 520, y: 812, w: 260, h: 56 },
  maskBoxes: [],
  prefix: '按 ',
  query: '',
  items: [
    { label: '示例文件.md', desc: '示例目录' },
    { label: '规则说明.md', desc: '参考资料' },
    { label: '新组件流程.md', desc: '参考资料' },
  ],
  pick: 0,
  after: ' 的规则，做一个新示例',
};

const MONO = 0.6 / 0.58;   // 等宽字宽相对 textWidth 的拉丁估算
const take = (s: string, n: number) => Array.from(s).slice(0, Math.max(0, n)).join('');

// 相机关键帧：x/y 为源像素焦点，d 为"源像素 → 屏幕像素"的倍数；段间 quintic，倍数按对数插值
type Key = { at: number; x: number; y: number; d: number };
const camAt = (keys: Key[], t: number) => {
  let kk = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= a.at) break;
    const v = quintic(t, a.at, b.at);
    const d = Math.exp(mix(Math.log(a.d), Math.log(b.d), v));
    const u = Math.abs(b.d - a.d) < 1e-4 ? v : clamp((1 / d - 1 / a.d) / (1 / b.d - 1 / a.d));
    kk = { at: t, x: mix(a.x, b.x, u), y: mix(a.y, b.y, u), d };
  }
  return kk;
};

// 按宽度折行（中文逐字、英文按字符估宽）
const wrap = (s: string, size: number, first: number, rest: number) => {
  const lines: string[] = [''];
  let w = 0, room = first;
  for (const ch of Array.from(s)) {
    const cw = textWidth(ch, size);
    if (w + cw > room && lines[lines.length - 1] !== '') { lines.push(''); w = 0; room = rest; }
    lines[lines.length - 1] += ch; w += cw;
  }
  return lines;
};

export function YangMentionChip(props: Partial<YangMentionChipProps>) {
  const c = { ...yangMentionChipDefaults, ...props };
  const t = useT();
  const items = c.items.length ? c.items : yangMentionChipDefaults.items;
  const pick = clamp(Math.round(c.pick), 0, items.length - 1);
  const chosen = items[pick];
  const n = items.length;

  const IW = c.imageSize.w, IH = c.imageSize.h;
  const d0 = 1920 / IW;
  const B = c.crop;

  // —— 时间 ——
  const atAt = cueAt(c.cues, 0, 1.15);
  const pushA = Math.max(0.35, atAt - 0.8), pushB = Math.max(pushA + 0.45, atAt - 0.15);
  const enter = p(t, 0, 0.3);
  const liftV = quintic(t, pushA, pushB);
  const L = c.lift * liftV;
  const BY = B.y - L;
  const preStart = Math.min(pushA + 0.3, atAt - 0.2), preEnd = atAt - 0.04;
  const qLen = Array.from(c.query).length;
  const qEnd = atAt + 0.1 + qLen * 0.08;
  const listAt = atAt + 0.06;
  const pickAt = cueAt(c.cues, 1, Math.max(qEnd + 0.5, listAt + 0.8));
  const fly = q(t, pickAt + 0.05, pickAt + 0.42);
  const listOpen = p(t, listAt, listAt + 0.28);
  const listVis = 1 - q(t, pickAt + 0.02, pickAt + 0.16);
  const afterAt = cueAt(c.cues, 2, pickAt + 0.5);
  const afterLen = Array.from(c.after).length;
  const afterEnd = afterAt + Math.min(1.1, afterLen * 0.065);

  const preShown = t < preStart ? '' : take(c.prefix, Math.floor(clamp((t - preStart) / Math.max(0.01, preEnd - preStart)) * Array.from(c.prefix).length + 1e-6));
  const typedQ = t < atAt ? '' : '@' + take(c.query, Math.floor(clamp((t - atAt - 0.1) / Math.max(0.01, qEnd - atAt - 0.1)) * qLen + 1e-6));
  const afterShown = t < afterAt ? '' : take(c.after, Math.floor(clamp((t - afterAt) / Math.max(0.01, afterEnd - afterAt)) * afterLen + 1e-6));
  const chipOn = t >= pickAt + 0.42;

  // —— 输入框里的文字（源像素，输入框局部坐标）——
  const TX = c.textStart.x - B.x, TY = c.textStart.y - B.y;
  const availW = B.w - TX * 2 - 20;
  const dWhole = 1840 / (B.w + 60);
  const longCase = textWidth(c.prefix + '@' + chosen.label + c.after, c.textSize) > B.w * 0.62;
  const FS = longCase ? Math.max(c.textSize, 37 / dWhole) : c.textSize;
  const LINE = FS * 1.5;
  const chipLabel = '@' + chosen.label;
  const chipFS = FS * 0.86;
  const chipW = textWidth(chipLabel, chipFS) * MONO + chipFS * 0.9;
  const preW = textWidth(preShown, FS);
  const headW = preW + (chipOn ? chipW + 8 : textWidth(t < pickAt + 0.05 ? typedQ : '', FS));
  const lines = wrap(afterShown, FS, availW - headW, availW);
  const nLines = afterShown ? lines.length : 1;
  const scrollUp = Math.max(0, nLines - 2) * LINE;
  const fullHead = textWidth(c.prefix, FS) + chipW + 8;
  const fullLines = wrap(c.after, FS, availW - fullHead, availW);
  const finalExtent = fullLines.length > 1 ? availW : fullHead + textWidth(c.after, FS);

  // —— 联想列表（源像素尺度；左边对齐 @）——
  const RH = n <= 4 ? 58 : 50;
  const LFS = Math.round(RH * 0.44);
  const hasIcon = items.some((it) => it.icon);
  const LW = Math.max(...items.map((it) => textWidth(it.label, LFS) * MONO + (it.desc ? textWidth(it.desc, LFS * 0.8) + LFS * 1.1 : 0))) + LFS * 2.4 + (hasIcon ? RH * 0.7 : 0);
  const listH = n * RH + 20;
  const atLocalX = TX + textWidth(c.prefix, FS);
  const LX = clamp(B.x + atLocalX - 18, B.x + 10, B.x + B.w - LW - 10);
  const LY = BY - 12 - listH;
  const rowBox = (i: number): Box => ({ x: LX + 8, y: LY + 10 + i * RH, w: LW - 16, h: RH });
  const hover = q(t, listAt + 0.3, pickAt - 0.12);
  const hoverY = mix(rowBox(0).y, rowBox(pick).y, hover);

  // —— 镜头 ——
  const fitC = (x0: number, x1: number, y0: number, y1: number, d: number) => ({
    x: clamp((x0 + x1) / 2, 960 / d, IW - 960 / d),
    y: clamp((y0 + y1) / 2, 540 / d, IH - 540 / d),
  });
  const BYf = B.y - c.lift, LYf = BYf - 12 - listH;
  const r1 = { x0: B.x - 40, x1: Math.max(LX + LW, B.x + atLocalX + 420) + 50, y0: LYf - 40, y1: BYf + TY + LINE + 20 };
  const d1 = Math.min(2.0, 1800 / (r1.x1 - r1.x0), 1000 / (r1.y1 - r1.y0));
  const f1 = fitC(r1.x0, r1.x1, r1.y0, r1.y1, d1);
  const r2 = longCase ? { x0: B.x - 30, x1: B.x + B.w + 30, y0: BYf - 50, y1: BYf + B.h + 40 }
    : { x0: B.x - 50, x1: B.x + TX + Math.max(finalExtent, 420) + 70, y0: BYf - 50, y1: BYf + B.h + 40 };
  const d2 = Math.min(2.0, 1840 / (r2.x1 - r2.x0), 960 / (r2.y1 - r2.y0));
  const f2 = fitC(r2.x0, r2.x1, r2.y0, r2.y1, d2);
  const keys: Key[] = [
    { at: 0, x: IW / 2, y: IH / 2, d: d0 },
    { at: pushA, x: IW / 2, y: IH / 2, d: d0 },
    { at: pushB, x: f1.x, y: f1.y, d: d1 },
    { at: pickAt + 0.2, x: f1.x, y: f1.y, d: d1 },
    { at: pickAt + 0.85, x: f2.x, y: f2.y, d: d2 },
  ];
  const cam = camAt(keys, t);
  const z = cam.d / d0;
  const fx = cam.x * d0, fy = cam.y * d0;
  const scr = (x: number, y: number) => ({ x: 960 + (x * d0 - fx) * z, y: 540 + (y * d0 - fy) * z });

  // 选中的那一行 → 缩成框内标签（同一个对象；世界坐标）
  const lineY = BY + TY - scrollUp;
  const chipBox: Box = { x: B.x + TX + preW, y: lineY - FS * 0.7, w: chipW, h: FS * 1.4 };
  const fromRow = rowBox(pick);
  const flyFrom: Box = { x: fromRow.x + 6, y: fromRow.y + 8, w: textWidth(chipLabel, LFS) * MONO + LFS * 1.2, h: fromRow.h - 16 };
  const flyB = between(flyFrom, chipBox, fly);
  const flyFS = mix(LFS, chipFS, fly);

  // 光标：只在点选那一下出现（屏幕坐标，不随镜头放大）
  const rowPt = { x: fromRow.x + Math.min(fromRow.w * 0.45, 240), y: 0 };
  const curIn = p(t, listAt + 0.2, listAt + 0.45) * (1 - p(t, pickAt + 0.1, pickAt + 0.3));
  const sRow = scr(rowPt.x, hoverY + RH * 0.62);
  const sStart = scr(rowPt.x + 120, rowBox(0).y + RH * 2.2);
  const curMove = p(t, listAt + 0.2, listAt + 0.5);
  const cx = mix(sStart.x, sRow.x, curMove), cy = mix(sStart.y, sRow.y, curMove);
  const press = clamp(1 - Math.abs(t - pickAt) / 0.1);
  const ring = scr(rowPt.x, rowBox(pick).y + RH * 0.62);
  const caretOn = Math.floor(t * 3.2) % 2 === 0;
  const lx = (x: number) => x - B.x, ly = (y: number) => y - B.y;
  const lv = listOpen * listVis;
  const focusRects = [{ x: B.x, y: BY, w: B.w, h: B.h }];

  const caret = <span style={{ display: 'inline-block', width: 2, height: FS * 1.1, marginLeft: 1, background: S.ink, opacity: caretOn ? 1 : 0, verticalAlign: 'middle' }} />;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, opacity: enter, transformOrigin: '0 0', transform: cameraTransform(fx, fy, z, 1) }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: IW, height: IH, transformOrigin: '0 0', transform: `scale(${d0})` }}>
          {/* 窗口背景：输入框浮起时失焦、压暗 */}
          <SrcImg src={c.image} style={{ position: 'absolute', left: 0, top: 0, width: IW, height: IH, filter: liftV > 0.01 ? `blur(${4 * liftV}px)` : undefined }} />
          {(c.maskBoxes ?? []).map((mm, i) => <div key={i} style={{ position: 'absolute', left: mm.x, top: mm.y, width: mm.w, height: mm.h, background: '#fff' }} />)}
          <div style={{ position: 'absolute', left: B.x - 6, top: B.y - 6, width: B.w + 12, height: B.h + 12, borderRadius: c.cropRadius, background: '#fcfcfc', opacity: q(liftV, 0, 0.35), filter: 'blur(4px)' }} />
          <Spotlight rects={focusRects} amount={liftV} dim={0.3} pad={0} radius={c.cropRadius} feather={3} />

          {/* 浮起的真实输入框 */}
          <div style={{
            position: 'absolute', left: B.x, top: BY, width: B.w, height: B.h, borderRadius: c.cropRadius, overflow: 'hidden', background: '#fff',
            boxShadow: liftV > 0.01 ? `0 ${24 * liftV}px ${40 * liftV}px rgba(0,0,0,${0.16 * liftV})` : undefined,
          }}>
            <SrcImg src={c.image} style={{ position: 'absolute', left: -B.x, top: -B.y, width: IW, height: IH }} />
            {(c.maskBoxes ?? []).map((mm, i) => <div key={i} style={{ position: 'absolute', left: lx(mm.x), top: ly(mm.y), width: mm.w, height: mm.h, background: '#fff' }} />)}
            <div style={{ position: 'absolute', left: lx(c.placeholderBox.x), top: ly(c.placeholderBox.y), width: c.placeholderBox.w, height: c.placeholderBox.h, background: '#fff' }} />
            {/* 文字区：两行可见，超出时上卷 */}
            <div style={{ position: 'absolute', left: TX, top: TY - LINE / 2, width: availW + 40, height: LINE * 2, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: -scrollUp, width: availW + 40 }}>
                <div style={{ height: LINE, display: 'flex', alignItems: 'center', ...textBase(FS, 500), lineHeight: 1, color: S.ink }}>
                  <span style={{ whiteSpace: 'pre' }}>{preShown}</span>
                  {chipOn
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: chipW, height: FS * 1.4, borderRadius: FS * 0.3, background: S.ink, marginRight: 8 }}>
                      <span style={{ ...textBase(chipFS, 600), color: '#fff' }}>{chipLabel}</span></span>
                    : <span style={{ whiteSpace: 'pre' }}>{t < pickAt + 0.05 ? typedQ : ''}</span>}
                  <span style={{ whiteSpace: 'pre' }}>{lines[0]}</span>
                  {nLines <= 1 && caret}
                </div>
                {lines.slice(1).map((ln, i) => <div key={i} style={{ ...textBase(FS, 500), height: LINE, display: 'flex', alignItems: 'center', lineHeight: 1, whiteSpace: 'pre', color: S.ink }}>
                  {ln}{i === lines.length - 2 && caret}
                </div>)}
              </div>
            </div>
          </div>

          {/* 联想列表：从 @ 处向上弹出 */}
          {lv > 0.01 && <div style={{ position: 'absolute', left: LX - 60, top: LY - 60, width: LW + 120, height: listH + 90, overflow: 'hidden', opacity: listVis, clipPath: `inset(${60 + listH * (1 - listOpen)}px 0 0 0)` }}>
            <Surface box={{ x: 60, y: 60 + (1 - listOpen) * 14, w: LW, h: listH }} radius={18}>
              <div style={{ position: 'absolute', left: 8, top: hoverY - LY, width: LW - 16, height: RH, borderRadius: 12, background: S.ink, opacity: p(t, listAt + 0.2, listAt + 0.35) }} />
              {items.map((it, i) => {
                const on = Math.abs(rowBox(i).y - hoverY) < RH * 0.5 && t >= listAt + 0.28;
                const hideLabel = i === pick && t >= pickAt + 0.05;
                return <div key={i} style={{ position: 'absolute', left: 8, top: 10 + i * RH, width: LW - 16, height: RH, display: 'flex', alignItems: 'center', gap: LFS * 0.55, paddingLeft: LFS * 0.75 }}>
                  {it.icon && <Img src={staticFile(it.icon)} style={{ width: RH * 0.5, height: RH * 0.5, borderRadius: 8, objectFit: 'cover' }} />}
                  <span style={{ ...textBase(LFS, 600), color: on ? '#fff' : S.ink, opacity: hideLabel ? 0 : 1 }}>{it.label}</span>
                  {it.desc && <span style={{ ...textBase(LFS * 0.8, 500), color: on ? S.faint : S.muted, opacity: hideLabel ? 0 : 1 }}>{it.desc}</span>}
                </div>;
              })}
            </Surface>
          </div>}

          {/* 被选中的那一行在飞 */}
          {t >= pickAt + 0.05 && !chipOn && <div style={{ ...abs(flyB), borderRadius: mix(12, FS * 0.3, fly), background: S.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: S.shadow }}>
            <span style={{ ...textBase(flyFS, 600), color: '#fff' }}>{chipLabel}</span>
          </div>}
        </div>
      </div>
      <ClickRing x={ring.x} y={ring.y} t={t} at={pickAt} dark />
      {curIn > 0 && <Cursor x={cx - 6} y={cy - 4} scale={1.1} press={press} style={{ opacity: curIn }} />}
    </Handoff>
  </Frame>;
}
