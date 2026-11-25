// YangDragIntoChat — drag files into a chat box: files in a kit folder window are picked one by one, the cursor grabs them (thumbnails stack in hand with a count badge, ghosts stay behind), the real input box lights up as the drop target, and on release the photos land inside it as attachments while the box stretches open upward (YangTalk T09t). The folder is a kit window (not a fake Finder screenshot); the input box is the caller's real screenshot, split at splitY so attachments slide into the opened gap.
// Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
// Source: member package fred-recording-8-20261018
//   source/src/components/T09t-DragIntoChat.tsx (+ kit/theme.ts, kit/ui.tsx)
//   package first public release: 2026-10-18 (early-access window ended 2026-11-01); downloaded 2026-11-02 via the
//   public visual-library route (fred-fu.com, anonymous, authorization: not-required).
//   Package ZIP: 34,039,291 bytes, SHA-256 b06d66380b266d927a91b1ddcc1de01f0ae32e4681f19e792585776549c76329
//   archived at ~/workspace/tools/FredTalk/downloads-b/fred-recording-8-20261018-source.zip
// Integration notes: Sfx and Brand NOT integrated. Original fonts replaced by the library FONT
//   (../src/theme); kit colors kept as the original 109-spec palette constants (S). All copy/numbers/media
//   are props with neutral example defaults (the original chapter titles, screenshots and recordings
//   are NOT bundled). target and thumbs default to empty strings: neutral placeholder surfaces then stand in for the screenshot and the photos.
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
export type DragFile = { name: string; thumb: string };
export type YangDragIntoChatProps = YangHandoffProps & {
  files: DragFile[];            // 文件夹里显示的文件（thumb 留空用中性占位图）
  drag: number[];               // 要拖走的是哪几个（下标）
  sourceWindowTitle: string;
  folderIcon?: string;          // 窗口标题旁的真实图标（可留空）
  target: string;               // 输入框所在的真实截图；留空用中性占位面
  targetSize: { w: number; h: number };
  targetCrop: Rect;             // 输入框本体（源像素，贴着边线取）
  targetRadius: number;         // 输入框圆角（源像素）
  splitY: number;               // 从这一行把输入框上下分开，附件放进撑开的空隙（源像素）
  placeholderBox: Rect;         // 要盖掉重写的占位字区域（源像素）
  placeholder: string;
  boxInnerX: [number, number];  // 输入框左右边线之间的内侧范围（源像素）
  dropLabel: string;            // 拖到框上时，占位字换成这句
  cues?: number[];              // [0]=按下开始拖，[1]=松手
};

export const yangDragIntoChatDefaults: YangDragIntoChatProps = {
  files: [
    { name: '示例图片-1.png', thumb: '' },
    { name: '示例图片-2.png', thumb: '' },
    { name: '示例图片-3.png', thumb: '' },
    { name: '示例图片-4.png', thumb: '' },
  ],
  drag: [0, 1],
  sourceWindowTitle: '示例文件夹',
  folderIcon: '',
  target: '',
  targetSize: { w: 1920, h: 1080 },
  targetCrop: { x: 360, y: 900, w: 1200, h: 150 },
  targetRadius: 36,
  splitY: 975,
  placeholderBox: { x: 390, y: 925, w: 330, h: 46 },
  placeholder: '输入消息…',
  boxInnerX: [370, 1550],
  dropLabel: '松手，放进对话框',
};

const INPUT_W = 1500;

// 文件名太长时中间省略：保留开头几个字和结尾（序号、扩展名）
const fitName = (name: string, size: number, maxW: number) => {
  if (textWidth(name, size) <= maxW) return name;
  const ch = Array.from(name);
  const headN = ch.slice(0, 4).join('');
  let tail = '';
  for (let i = ch.length - 1; i > 4; i--) {
    const next = ch[i] + tail;
    if (textWidth(headN + '…' + next, size) > maxW) break;
    tail = next;
  }
  return headN + '…' + tail;
};

// 相机关键帧（设计坐标 1920×1080）：x/y 焦点，z 倍数；段间 quintic，倍数按对数插值
type Key = { at: number; x: number; y: number; z: number };
const camAt = (keys: Key[], t: number) => {
  let kk = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= a.at) break;
    const v = quintic(t, a.at, b.at);
    const z = Math.exp(mix(Math.log(a.z), Math.log(b.z), v));
    kk = { at: t, x: mix(a.x, b.x, v), y: mix(a.y, b.y, v), z };
  }
  return kk;
};

export function YangDragIntoChat(props: Partial<YangDragIntoChatProps>) {
  const c = { ...yangDragIntoChatDefaults, ...props };
  const t = useT();
  const files = c.files.length ? c.files : yangDragIntoChatDefaults.files;
  const drag = (c.drag.length ? c.drag : [0]).filter((i) => i >= 0 && i < files.length);
  const nd = drag.length;

  // —— 版式（设计坐标）：上方文件夹窗口，下方真实输入框 ——
  const nf = files.length;
  const GAP_T = 36;
  const TILE = Math.min(300, (1560 - 120 - (nf - 1) * GAP_T) / nf);
  const NAME = 30;
  const BAR = 72;
  const WIN: Box = { w: nf * TILE + (nf - 1) * GAP_T + 120, h: BAR + 36 + TILE + 18 + NAME * 1.4 + 34, x: 0, y: 46 };
  WIN.x = 960 - WIN.w / 2;
  const tileBox = (i: number): Box => ({ x: WIN.x + 60 + i * (TILE + GAP_T), y: WIN.y + BAR + 36, w: TILE, h: TILE });

  const TC = c.targetCrop;
  const k = INPUT_W / TC.w;
  const topH = (c.splitY - TC.y) * k;
  const botH = (TC.y + TC.h - c.splitY) * k;
  const AT = Math.min(230, (INPUT_W - 100) / Math.max(1, nd) - 22);   // 附件缩略图边长
  const GAP_MAX = AT + 34;
  const INPUT_X = 960 - INPUT_W / 2;
  const INPUT_BOTTOM = 1046;

  // —— 时间 ——
  const grabAt = cueAt(c.cues, 0, 1.4);
  const dropAt = cueAt(c.cues, 1, grabAt + 1.2);
  const enter = p(t, 0, 0.3);
  const selAt = (j: number) => grabAt - 0.42 + j * Math.min(0.14, 0.3 / Math.max(1, nd));
  const lift = p(t, grabAt, grabAt + 0.28);
  const travel = q(t, grabAt + 0.12, dropAt - 0.04);
  const hover = p(t, dropAt - 0.42, dropAt - 0.1) * (1 - p(t, dropAt + 0.05, dropAt + 0.3));
  const open = q(t, dropAt - 0.02, dropAt + 0.26);   // 先撑开，照片再落进去，不压工具栏
  const land = q(t, dropAt, dropAt + 0.45);
  const gap = GAP_MAX * open;
  const INPUT_TOP = INPUT_BOTTOM - topH - botH - gap;
  const folderOut = q(t, dropAt - 0.35, dropAt + 0.25);   // 文件夹退后（不留半截在画里）

  // 拖拽轨迹：从被拖文件的中心，沿弧线到输入框中部
  const srcC = (() => { const b = tileBox(drag[0]); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; })();
  const dst = { x: 760, y: INPUT_BOTTOM - botH - 120 };
  const ctl = { x: (srcC.x + dst.x) / 2 + 300, y: (srcC.y + dst.y) / 2 - 40 };
  const bez = (u: number) => ({
    x: (1 - u) ** 2 * srcC.x + 2 * (1 - u) * u * ctl.x + u * u * dst.x,
    y: (1 - u) ** 2 * srcC.y + 2 * (1 - u) * u * ctl.y + u * u * dst.y,
  });
  const hand = bez(travel);
  const DS = Math.min(240, TILE * 0.82);   // 跟手时的缩略图边长
  const slot = (j: number): Box => ({ x: INPUT_X + 34 + j * (AT + 18), y: INPUT_TOP + topH + 6, w: AT, h: AT });

  // —— 镜头 ——
  const zF = Math.min(1.9, 1840 / (WIN.w + 40), 1000 / (WIN.h + 40));
  const finalTop = INPUT_BOTTOM - topH - botH - GAP_MAX;
  const zI = Math.min(1.3, 1840 / (INPUT_W + 60));
  const slotsW = nd * AT + (nd - 1) * 18 + 34;
  const zC = Math.max(zI, Math.min(1.8, 1780 / (slotsW + 160)));
  const keys: Key[] = [
    { at: 0, x: 960, y: 540, z: 1 },
    { at: 0.4, x: 960, y: 540, z: 1 },
    { at: Math.max(0.9, grabAt - 0.45), x: WIN.x + WIN.w / 2, y: WIN.y + WIN.h / 2, z: zF },
    { at: grabAt + 0.1, x: WIN.x + WIN.w / 2, y: WIN.y + WIN.h / 2, z: zF },
    // 拖动途中镜头拉回全貌：文件夹和输入框都完整在画内，那一摞从上走到下
    { at: dropAt - 0.12, x: 960, y: 540, z: 1 },
    { at: dropAt + 0.55, x: 960, y: (finalTop + INPUT_BOTTOM) / 2, z: zI },
    // 落定后再推近一档：附件 + 输入框左段成为画面主体，停读
    { at: dropAt + 1.25, x: INPUT_X - 70 / zC + 960 / zC, y: (finalTop + INPUT_BOTTOM) / 2, z: zC },
  ];
  const cam = camAt(keys, t);
  const camX = cam.x, camY = cam.y, z = cam.z;
  const scr = (x: number, y: number) => ({ x: 960 + (x - camX) * z, y: 540 + (y - camY) * z });

  // 光标（屏幕坐标）：进场 → 逐张点选 → 按住拖 → 松手后离开
  const tileC = (i: number) => { const b = tileBox(i); return { x: b.x + b.w * 0.55, y: b.y + b.h * 0.6 }; };
  let wx = tileC(drag[0]).x + 260, wy = tileC(drag[0]).y + 300;
  const toFirst = p(t, 0.55, selAt(0) - 0.05);
  wx = mix(wx, tileC(drag[0]).x, toFirst); wy = mix(wy, tileC(drag[0]).y, toFirst);
  for (let j = 1; j < nd; j++) {
    const v = p(t, selAt(j - 1) + 0.03, selAt(j) - 0.02);
    wx = mix(wx, tileC(drag[j]).x, v); wy = mix(wy, tileC(drag[j]).y, v);
  }
  const back = p(t, selAt(nd - 1) + 0.04, grabAt - 0.02);
  wx = mix(wx, srcC.x + 20, back); wy = mix(wy, srcC.y + 20, back);
  if (t >= grabAt) { wx = hand.x + 30; wy = hand.y + 30; }
  const away = p(t, dropAt + 0.25, dropAt + 0.85);
  const cs = scr(wx, wy);
  const cx = cs.x + away * 300, cy = cs.y + away * 200;
  const press = t >= grabAt - 0.05 && t < dropAt ? 1 : Math.max(0, ...drag.map((_, j) => clamp(1 - Math.abs(t - selAt(j)) / 0.08)));

  const textY = INPUT_TOP + (c.placeholderBox.y + c.placeholderBox.h / 2 - TC.y) * k;
  const phSize = Math.round(c.placeholderBox.h * k * 0.52);
  const dropSize = Math.max(phSize, 38);   // 落点提示在全貌镜头里也要 ≥36px
  const showDrop = hover > 0.5;
  const imgStyle = (offsetY: number): React.CSSProperties => ({ position: 'absolute', left: -TC.x * k, top: -offsetY * k, width: c.targetSize.w * k, height: c.targetSize.h * k });
  const R = c.targetRadius * k;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, opacity: enter, transformOrigin: '0 0', transform: cameraTransform(camX, camY, z, 1) }}>
        {/* 文件夹窗口（kit 窗口，内容是 props 给的图片）；松手前后整只退后淡出 */}
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - folderOut, transform: `scale(${mix(1, 0.94, folderOut)})`, transformOrigin: `${WIN.x + WIN.w / 2}px ${WIN.y}px` }}>
          <MacWindow light box={WIN} bar={BAR}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: -BAR, height: BAR, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              {c.folderIcon && <Img src={staticFile(c.folderIcon)} style={{ width: 36, height: 36 }} />}
              <span style={{ ...textBase(28, 500), color: S.muted }}>{c.sourceWindowTitle}</span>
            </div>
            {files.map((f, i) => {
              const b = tileBox(i);
              const j = drag.indexOf(i);
              const picked = j >= 0;
              const sel = picked ? p(t, selAt(j), selAt(j) + 0.12) : 0;
              const name = fitName(f.name, NAME, TILE + 10);
              const nameW = Math.min(TILE + 24, textWidth(name, NAME) + NAME * 0.9);
              return <div key={i} style={{ position: 'absolute', left: b.x - WIN.x, top: b.y - WIN.y - BAR, width: TILE }}>
                <div style={{
                  width: TILE, height: TILE, borderRadius: 18, overflow: 'hidden', boxShadow: S.shadow,
                  opacity: picked ? mix(1, 0.35, lift) : 1, transform: `scale(${1 + 0.03 * sel * (1 - lift)})`,
                }}>
                  <SrcImg src={f.thumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ position: 'relative', marginTop: 14, height: NAME * 1.4, width: TILE }}>
                  <div style={{ position: 'absolute', left: (TILE - nameW) / 2, width: nameW, height: NAME * 1.4, borderRadius: NAME * 0.7, background: S.ink, opacity: sel * (1 - 0.6 * lift) }} />
                  <div style={{ ...textBase(NAME, sel > 0.5 ? 600 : 500), position: 'absolute', left: 0, width: TILE, top: NAME * 0.2, textAlign: 'center', color: sel > 0.5 ? '#fff' : S.muted }}>{name}</div>
                </div>
              </div>;
            })}
          </MacWindow>
        </div>

        {/* 真实输入框：上下两段之间撑开放附件（底边不动，向上长） */}
        <div style={{
          position: 'absolute', left: INPUT_X, top: INPUT_TOP, width: INPUT_W, height: topH + gap + botH, borderRadius: R, overflow: 'hidden',
          transform: `scale(${1 + 0.012 * hover})`, transformOrigin: '50% 50%', boxShadow: `0 ${16 * hover}px ${30 * hover}px rgba(0,0,0,${0.12 * hover})`,
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: INPUT_W, height: topH, overflow: 'hidden' }}>
            <SrcImg src={c.target} style={imgStyle(TC.y)} />
            <div style={{ position: 'absolute', left: (c.placeholderBox.x - TC.x) * k, top: (c.placeholderBox.y - TC.y) * k, width: c.placeholderBox.w * k, height: c.placeholderBox.h * k, background: '#fff' }} />
          </div>
          {/* 撑开的空隙：用分界处几行真实像素拉伸，左右边线保持连续 */}
          <div style={{ position: 'absolute', left: 0, top: topH - 1, width: INPUT_W, height: gap + 2, overflow: 'hidden' }}>
            <SrcImg src={c.target} style={{ ...imgStyle(c.splitY - 3), transformOrigin: `0 ${(c.splitY - 3) * k}px`, transform: `scaleY(${Math.max(0.01, (gap + 2) / (3 * k))})` }} />
            <div style={{ position: 'absolute', left: (c.boxInnerX[0] - TC.x) * k, top: 0, width: (c.boxInnerX[1] - c.boxInnerX[0]) * k, height: gap + 2, background: '#fff' }} />
          </div>
          <div style={{ position: 'absolute', left: 0, top: topH + gap, width: INPUT_W, height: botH, overflow: 'hidden' }}>
            <SrcImg src={c.target} style={imgStyle(c.splitY)} />
          </div>
          <div style={{ ...textBase(showDrop ? dropSize : phSize, showDrop ? 900 : 500), position: 'absolute', left: (c.placeholderBox.x + 8 - TC.x) * k, top: textY - INPUT_TOP - (showDrop ? dropSize : phSize) * 0.6, color: showDrop ? S.ink : S.faint }}>
            {showDrop ? c.dropLabel : <span style={{ opacity: 1 - Math.sin(Math.PI * clamp((t - dropAt) / 0.55)) * (t > dropAt ? 1 : 0) }}>{c.placeholder}</span>}
          </div>
        </div>
        {/* 落点：其余画面局部压暗，只留输入框 */}
        <Spotlight rects={[{ x: INPUT_X, y: INPUT_TOP, w: INPUT_W, h: topH + gap + botH }]} amount={hover} dim={0.35} radius={R} pad={4} />

        {/* 跟手的一摞 → 落成附件 */}
        {lift > 0 && drag.map((fi, j) => {
          const f = files[fi];
          const backN = nd - 1 - j;
          const flyB: Box = { x: hand.x - DS / 2 + backN * 16, y: hand.y - DS / 2 - backN * 12, w: DS, h: DS };
          const from = tileBox(fi);
          const carried = t < dropAt ? between(from, flyB, lift) : between(flyB, slot(j), land);
          const rot = (backN - (nd - 1) / 2) * 6 * (t < dropAt ? lift : 1 - land);
          return <div key={fi} style={{
            ...abs(carried), borderRadius: mix(18, 16, land), overflow: 'hidden', zIndex: 700 + j,
            boxShadow: t < dropAt ? S.capsuleShadow : S.shadow, transform: `rotate(${rot}deg)`, opacity: t < dropAt ? mix(1, 0.94, lift) : 1,
          }}>
            <SrcImg src={f.thumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>;
        })}
        {/* 多张时，叠在一起的那一摞带数量 */}
        {nd > 1 && lift > 0 && t < dropAt + 0.05 && <div style={{
          position: 'absolute', left: hand.x + DS / 2 - 10, top: hand.y - DS / 2 - 44, width: 64, height: 64, borderRadius: 32, background: S.ink, zIndex: 760,
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: S.shadow, transform: `scale(${lift * (1 - p(t, dropAt - 0.05, dropAt + 0.05))})`,
        }}><span style={{ ...textBase(36, 900), color: '#fff', lineHeight: 1 }}>{nd}</span></div>}
      </div>

      {drag.map((fi, j) => { const s2 = scr(tileC(fi).x, tileC(fi).y); return <ClickRing key={fi} x={s2.x} y={s2.y} t={t} at={selAt(j)} />; })}
      {away < 1 && <Cursor x={cx - 6} y={cy - 4} scale={1.1} press={press} style={{ opacity: p(t, 0.5, 0.75) * (1 - away), zIndex: 800 }} />}
    </Handoff>
  </Frame>;
}
