// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T09l-LinkCarry.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：复制地址交给 AI（正版 T09l）——一个地址被复制 → 带着走到对话框里粘贴发送。
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

type Rect = { x: number; y: number; w: number; h: number };
type Pt = { x: number; y: number };

export type YangLinkCarryProps = YangHandoffProps & {
  source: string;                 // 左侧真实截图
  sourceSize: { w: number; h: number };
  sourceCrop: Rect;               // 只显示这一块（源图像素）
  field: Rect;                    // 截图里地址行的框（源图像素）
  copyButton: Pt;                 // 截图里复制键的中心（源图像素）
  url: string;                    // 完整地址（截图里可能被截断，胶囊里显示完整的）
  target: string;                 // 右侧输入框截图
  targetSize: { w: number; h: number };
  targetCrop: Rect;               // 输入框本体（源图像素）
  placeholder: Rect;              // 输入框里占位文字的区域（盖白后写入文字）
  textStart: Pt;                  // 输入框第一行文字的起点（左端、行中线，源图像素）
  sendButton: Pt;                 // 发送键中心（源图像素）
  sendRadius: number;             // 发送键半径（源图像素）
  prefix: string;                 // 地址前已经写好的话，可留空
  maskBoxes?: Rect[];             // 输入框截图里要实心盖掉的区域（源图像素），如权限提示
  maskColor?: string;             // 盖块颜色，取输入框底色
  cues?: number[];                // [0]=点复制，[1]=拎起开走，[2]=点发送
};

// 默认内容：114 期 clone 地址（原作者的公开仓库 YangTalk，GitHub Code 菜单真实截图）→ Codex 真实输入框
export const yangLinkCarryDefaults: YangLinkCarryProps = {
  source: '',
  sourceSize: { w: 3840, h: 2160 },
  sourceCrop: { x: 1716, y: 606, w: 792, h: 322 },
  field: { x: 1744, y: 780, w: 664, h: 64 },
  copyButton: { x: 2448, y: 812 },
  url: 'https://github.com/njrhts2kvv-star/YangTalk.git',
  target: '',
  targetSize: { w: 1300, h: 202 },
  targetCrop: { x: 20, y: 12, w: 1266, h: 171 },
  placeholder: { x: 36, y: 28, w: 260, h: 56 },
  textStart: { x: 44, y: 56 },
  sendButton: { x: 1246, y: 144 },
  sendRadius: 25,
  prefix: '帮我下载这个项目：',
  // 盖掉左下角橙色“完全访问”（含图标）：平台安全规则里无安全语境的权限表达不上屏
  maskBoxes: [{ x: 100, y: 126, w: 134, h: 36 }],
  maskColor: '#fff',
};

const MONO_W = 0.6 / 0.58;

export function YangLinkCarry(props: Partial<YangLinkCarryProps>) {
  const c = { ...yangLinkCarryDefaults, ...props };
  const t = useT();

  // —— 版式：左上截图面板，右下输入框；都按“截图里的字能读清”定缩放 ——
  const SK = Math.min(1.2, 940 / c.sourceCrop.w, 420 / c.sourceCrop.h);
  const TK = Math.min(1.16, 1460 / c.targetCrop.w);
  const INPUT_W = c.targetCrop.w * TK, INPUT_H = c.targetCrop.h * TK;
  // 上下两块共用一条竖中线；整组在角标下方垂直居中
  const GAPY = 110;
  const groupH = c.sourceCrop.h * SK + GAPY + INPUT_H;
  const top = Math.max(150, 560 - groupH / 2);
  const PANEL: Box = { x: 960 - c.sourceCrop.w * SK / 2, y: top, w: c.sourceCrop.w * SK, h: c.sourceCrop.h * SK };
  const INPUT: Box = { x: 960 - INPUT_W / 2, y: top + PANEL.h + GAPY, w: INPUT_W, h: INPUT_H };
  const sp = (pt: Pt) => ({ x: PANEL.x + (pt.x - c.sourceCrop.x) * SK, y: PANEL.y + (pt.y - c.sourceCrop.y) * SK });
  const tp = (pt: Pt) => ({ x: INPUT.x + (pt.x - c.targetCrop.x) * TK, y: INPUT.y + (pt.y - c.targetCrop.y) * TK });
  const fieldTL = sp(c.field);
  const FIELD: Box = { x: fieldTL.x, y: fieldTL.y, w: c.field.w * SK, h: c.field.h * SK };
  const copy = sp(c.copyButton);
  const send = tp(c.sendButton);
  const sendR = c.sendRadius * TK;
  const ts0 = tp(c.textStart);

  // 输入框里的文字：前缀（正文）+ 地址（代码字体）；字号按输入框可用宽度收
  const availW = send.x - sendR - 40 - ts0.x;
  const units = textWidth(c.prefix, 1) + textWidth(c.url, 1) * MONO_W + 0.3;
  // 一行放不下（字号会小于 30）就把地址换到第二行
  const twoLines = !!c.prefix && availW / units < 30;   // 两行时整体上移一点，避开下排按钮
  const FS = twoLines ? Math.min(32, availW / (textWidth(c.url, 1) * MONO_W), availW / textWidth(c.prefix, 1)) : Math.min(36, availW / units);
  const prefixW = twoLines ? 0 : textWidth(c.prefix, FS) + (c.prefix ? FS * 0.15 : 0);
  const urlW = textWidth(c.url, FS) * MONO_W;
  const ts = { x: ts0.x, y: ts0.y - (twoLines ? FS * 0.3 : 0) };
  const urlY = twoLines ? ts.y + FS * 1.2 : ts.y;

  // 胶囊（拎起后的样子）：完整地址，字号略大于输入框里的字
  const PS = Math.min(40, 1480 / (textWidth(c.url, 1) * MONO_W));
  const PH = PS * 2.1, PW = textWidth(c.url, PS) * MONO_W + PH;
  const liftBox: Box = { x: Math.min(FIELD.x - 6, 1840 - PW), y: FIELD.y - PH - 26, w: PW, h: PH };
  const landBox: Box = { x: ts.x + prefixW, y: urlY - FS * 0.7, w: urlW, h: FS * 1.4 };

  // —— 时间 ——
  const enter = p(t, 0, 0.42);
  const enter2 = p(t, 0.1, 0.52);
  const copyAt = cueAt(c.cues, 0, 1.0);
  const liftAt = copyAt + 0.12;
  const goAt = cueAt(c.cues, 1, liftAt + 0.5);
  const FLY = 0.85;
  const landAt = goAt + FLY;
  const sendAt = cueAt(c.cues, 2, landAt + 0.55);
  const lift = p(t, liftAt, liftAt + 0.4);
  const fly = q(t, goAt, landAt);
  const landed = t >= landAt;                                 // 落进输入框：胶囊换成输入框里的字（同起点同字号）
  const pasteGlow = landed ? 1 - p(t, landAt + 0.12, landAt + 0.6) : 0;   // 刚粘贴的那段带一下浅紫选区，随即退掉
  const copied = p(t, copyAt + 0.04, copyAt + 0.3);

  // 胶囊路径：拎起（原位→上方）→ 二次贝塞尔弧线飞到落点
  const liftFrom: Box = { ...FIELD };
  const startB = between(liftFrom, liftBox, lift);
  const p0 = { x: liftBox.x + liftBox.w / 2, y: liftBox.y + liftBox.h / 2 };
  const p2 = { x: landBox.x + landBox.w / 2, y: landBox.y + landBox.h / 2 };
  const ctrl = { x: Math.max(p0.x, p2.x) + 360, y: Math.min(p0.y, p2.y) + 40 };
  const bez = (u: number) => ({
    x: (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * ctrl.x + u * u * p2.x,
    y: (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * ctrl.y + u * u * p2.y,
  });
  const along = bez(fly);
  const sizeK = mix(1, FS / PS, q(t, goAt + FLY * 0.35, landAt));   // 飞行后半段缩到输入框字号
  const curW = mix(liftBox.w, landBox.w + PH * 0.9 * (FS / PS), fly <= 0 ? 0 : q(t, goAt + FLY * 0.35, landAt));
  const curH = PH * sizeK;
  const flying = t >= goAt;
  const pillBox: Box = flying
    ? { x: along.x - curW / 2, y: along.y - curH / 2, w: curW, h: curH }
    : startB;
  const pillFS = flying ? PS * sizeK : mix(c.field.h * SK * 0.42, PS, lift);
  const box = pillBox;
  const fs = Math.min(pillFS, (box.w - box.h * 0.6) / (textWidth(c.url, 1) * MONO_W));   // 拎起途中字跟着框长，不被裁

  // 光标：从右下进场 → 复制键 → 抓住胶囊左端随它走 → 发送键
  let cx = 1500, cy = 1150;
  const toCopy = p(t, 0.35, copyAt - 0.04);
  cx = mix(cx, copy.x, toCopy); cy = mix(cy, copy.y, toCopy);
  const grab = { x: box.x + Math.min(box.h * 0.9, 60), y: box.y + box.h * 0.62 };
  const toGrab = p(t, liftAt + 0.1, goAt);
  cx = mix(cx, grab.x, toGrab); cy = mix(cy, grab.y, toGrab);
  const toSend = p(t, landAt + 0.06, sendAt - 0.04);
  cx = mix(cx, send.x, toSend); cy = mix(cy, send.y, toSend);
  const press = Math.max(clamp(1 - Math.abs(t - copyAt) / 0.1), clamp(1 - Math.abs(t - sendAt) / 0.1));
  const sendPress = clamp(1 - Math.abs(t - sendAt - 0.03) / 0.12);
  const cursorOut = q(t, sendAt + 0.35, sendAt + 0.75);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 左上：GitHub 克隆面板（真实截图） */}
      <div style={{ ...abs({ ...PANEL, y: PANEL.y + (1 - enter) * 36 }), borderRadius: S.radius, overflow: 'hidden', background: '#fff', boxShadow: S.shadow, opacity: enter }}>
        <ImgFill src={c.source} style={{ position: 'absolute', left: -c.sourceCrop.x * SK, top: -c.sourceCrop.y * SK, width: c.sourceSize.w * SK, height: c.sourceSize.h * SK }} />
        {/* 复制键 → 勾（GitHub 真实反馈） */}
        {copied > 0 && <div style={{ position: 'absolute', left: copy.x - PANEL.x - 26 * SK, top: copy.y - PANEL.y - 26 * SK, width: 52 * SK, height: 52 * SK, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={40 * SK} height={40 * SK} viewBox="0 0 24 24" style={{ transform: `scale(${mix(0.6, 1, copied)})` }}>
            <path d="M5 12.5 L10 17 L19 7.5" stroke={S.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="22" strokeDashoffset={22 * (1 - copied)} />
          </svg>
        </div>}
        {/* 地址行被拎走后留下的浅色空位 */}
        {lift > 0 && <div style={{ position: 'absolute', left: FIELD.x - PANEL.x, top: FIELD.y - PANEL.y, width: FIELD.w, height: FIELD.h, borderRadius: 10 * SK, background: '#fff', opacity: 0.72 * lift }} />}
      </div>

      {/* 右下：Codex 输入框（真实截图） */}
      <div style={{ ...abs({ ...INPUT, y: INPUT.y + (1 - enter2) * 36 }), borderRadius: 28 * TK, overflow: 'hidden', background: '#fff', boxShadow: S.shadow, opacity: enter2 }}>
        <ImgFill src={c.target} style={{ position: 'absolute', left: -c.targetCrop.x * TK, top: -c.targetCrop.y * TK, width: c.targetSize.w * TK, height: c.targetSize.h * TK }} />
        {(c.maskBoxes ?? []).map((m, i) => <div key={i} style={{ position: 'absolute', left: (m.x - c.targetCrop.x) * TK, top: (m.y - c.targetCrop.y) * TK, width: m.w * TK, height: m.h * TK, background: c.maskColor ?? '#fff' }} />)}
        {/* 盖住占位字，写入真实要发的话 */}
        <div style={{ position: 'absolute', left: (c.placeholder.x - c.targetCrop.x) * TK, top: (c.placeholder.y - c.targetCrop.y) * TK, width: c.placeholder.w * TK, height: c.placeholder.h * TK, background: '#fff' }} />
        <div style={{ position: 'absolute', left: ts.x - INPUT.x, top: ts.y - INPUT.y - FS * 0.7, height: FS * 1.4, display: 'flex', alignItems: 'center', ...textBase(FS, 500), lineHeight: 1, color: S.ink }}>{c.prefix}</div>
        {/* 发送键：输入框有字时是上箭头（盖住截图里的语音键），点下时按下去 */}
        <div style={{
          position: 'absolute', left: send.x - INPUT.x - sendR, top: send.y - INPUT.y - sendR, width: sendR * 2, height: sendR * 2, borderRadius: sendR,
          background: S.dark, transform: `scale(${1 - 0.14 * sendPress})`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width={sendR * 1.1} height={sendR * 1.1} viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>

      {/* 地址：截图里的那一行 → 黑胶囊 → 输入框里的字 */}
      {landed && <div style={{ ...abs({ x: landBox.x - 6, y: landBox.y, w: landBox.w + 12, h: landBox.h }), borderRadius: 8, background: S.accent, opacity: 0.16 * pasteGlow, zIndex: 689 }} />}
      {landed && <div style={{ ...abs(landBox), display: 'flex', alignItems: 'center', ...textBase(FS, 600, S.mono), lineHeight: 1, color: S.ink, zIndex: 690 }}>{c.url}</div>}
      {lift > 0 && !landed && <div style={{
        ...abs(box), borderRadius: box.h / 2, zIndex: 700, background: S.dark,
        boxShadow: `30px 22px 25px rgba(0,0,0,${0.33 * clamp(lift * 2)})`,
        overflow: 'hidden',
      }}>
        {/* 文字左端按估算宽度对中；落定时与输入框里那层墨色字同起点、同字号，反色交接不叠影 */}
        <span style={{ position: 'absolute', left: (box.w - textWidth(c.url, fs) * MONO_W) / 2, top: 0, height: box.h, display: 'flex', alignItems: 'center', ...textBase(fs, 600, S.mono), lineHeight: 1, color: '#fff', opacity: clamp(lift * 3 - 0.6) }}>{c.url}</span>
      </div>}

      <ClickRing x={copy.x} y={copy.y} t={t} at={copyAt} />
      <ClickRing x={send.x} y={send.y} t={t} at={sendAt} />
      {cursorOut < 1 && <Cursor x={cx - 6} y={cy - 4} scale={1.1} press={press} style={{ opacity: clamp(p(t, 0.3, 0.55)) * (1 - cursorOut) }} />}
    </Handoff>
    
    
    
  </Frame>;
}
