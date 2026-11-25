// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T13b-MetaphorMorph.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：比喻变形（正版 T13b）——一个抽象概念 → 变成一个生活里的东西。
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

export type YangMetaphorSymbol = 'lock' | 'cloche' | 'gpu' | 'table' | 'book' | 'key';
export type YangMetaphorSide = {
  name: string;            // 卡上的大字
  sub?: string;            // 一行补充（可省）
  symbol?: YangMetaphorSymbol; // 没有真实图片时用干净的图形符号
  image?: string;          // 有真实素材时优先用图片（public 路径）
};
export type YangMetaphorMorphProps = YangHandoffProps & {
  concept: YangMetaphorSide;   // 抽象概念（白卡）
  object: YangMetaphorSide;    // 生活里的东西（黑卡）
  link: string;            // 中间胶囊：就像
  line: string;            // 最后一句对应关系
  highlight: string;       // line 里染紫的词
  cues?: number[];         // [0]=分身变形开始；[1]=对应关系出现
};

// 113 期第 3 段：闭源，就像去餐厅吃饭——只能点菜、按份付钱，菜谱拿不到
export const yangMetaphorMorphDefaults: YangMetaphorMorphProps = {
  concept: { name: '闭源模型', sub: '只能付费调官方接口', symbol: 'lock' },
  object: { name: '去餐厅吃饭', sub: '厨房在别人那里', symbol: 'cloche' },
  link: '就像',
  line: '只能点菜、按份付钱，菜谱拿不到',
  highlight: '菜谱拿不到',
};

// 干净的实心图形（240×240 视图），fg 为主色、bg 为挖空色
function Symbol({ kind, fg, bg, size }: { kind: YangMetaphorSymbol; fg: string; bg: string; size: number }) {
  const body = (() => {
    switch (kind) {
      case 'lock': return <>
        <path d="M74 112 V82 a46 46 0 0 1 92 0 V112" fill="none" stroke={fg} strokeWidth={26} strokeLinecap="round" />
        <rect x={40} y={104} width={160} height={118} rx={28} fill={fg} />
        <circle cx={120} cy={152} r={17} fill={bg} />
        <rect x={111} y={158} width={18} height={36} rx={9} fill={bg} />
      </>;
      case 'cloche': return <>
        <path d="M34 182 a86 86 0 0 1 172 0 Z" fill={fg} />
        <circle cx={120} cy={88} r={15} fill={fg} />
        <path d="M70 160 a52 52 0 0 1 30 -44" fill="none" stroke={bg} strokeWidth={10} strokeLinecap="round" />
        <rect x={14} y={190} width={212} height={20} rx={10} fill={fg} />
      </>;
      case 'gpu': return <>
        <rect x={8} y={70} width={206} height={100} rx={16} fill={fg} />
        <rect x={214} y={58} width={18} height={126} rx={5} fill={fg} />
        {[70, 152].map((cx) => <g key={cx}>
          <circle cx={cx} cy={120} r={38} fill={bg} />
          {[0, 72, 144, 216, 288].map((a) => <path key={a} transform={`rotate(${a} ${cx} 120)`}
            d={`M${cx} 120 C${cx + 6} 104 ${cx + 20} 92 ${cx + 30} 96 C${cx + 22} 108 ${cx + 12} 116 ${cx} 120 Z`} fill={fg} />)}
          <circle cx={cx} cy={120} r={9} fill={fg} />
        </g>)}
        {[0, 1, 2, 3, 4, 5, 6].map((k) => <rect key={k} x={40 + k * 22} y={170} width={12} height={22} rx={3} fill={fg} />)}
      </>;
      case 'table': return <>
        <path d="M44 86 H196 L224 112 H16 Z" fill={fg} />
        <rect x={16} y={110} width={208} height={18} rx={6} fill={fg} />
        <rect x={34} y={126} width={18} height={92} rx={6} fill={fg} />
        <rect x={188} y={126} width={18} height={92} rx={6} fill={fg} />
        <rect x={72} y={126} width={14} height={62} rx={5} fill={fg} opacity={0.55} />
        <rect x={154} y={126} width={14} height={62} rx={5} fill={fg} opacity={0.55} />
      </>;
      case 'book': return <>
        <path d="M120 70 C96 54 56 50 22 58 V190 C56 182 96 186 120 202 Z" fill={fg} />
        <path d="M120 70 C144 54 184 50 218 58 V190 C184 182 144 186 120 202 Z" fill={fg} />
        <path d="M120 74 V198" stroke={bg} strokeWidth={6} />
        {[0, 1, 2].map((k) => <path key={k} d={`M44 ${92 + k * 26} C66 ${88 + k * 26} 86 ${90 + k * 26} 102 ${96 + k * 26}`} fill="none" stroke={bg} strokeWidth={7} strokeLinecap="round" />)}
      </>;
      case 'key': return <>
        <circle cx={78} cy={120} r={50} fill={fg} /><circle cx={78} cy={120} r={20} fill={bg} />
        <rect x={116} y={108} width={110} height={24} rx={8} fill={fg} />
        <rect x={180} y={128} width={18} height={34} rx={5} fill={fg} /><rect x={206} y={128} width={18} height={24} rx={5} fill={fg} />
      </>;
    }
  })();
  return <svg width={size} height={size} viewBox="0 0 240 240">{body}</svg>;
}

const CW = 500, CH = 560, TOP = 150;
const AX = 560, BX = 1360;         // 终态：概念卡 / 物件卡中心

export function YangMetaphorMorph(props: Partial<YangMetaphorMorphProps>) {
  const c = { ...yangMetaphorMorphDefaults, ...props };
  const t = useT();

  const enter = p(t, 0, 0.5);
  const at = cueAt(c.cues, 0, 1.2);
  const lineAt = cueAt(c.cues, 1, at + 1.3);
  const split = q(t, at, at + 0.85);                                     // 两卡分开
  const travel = p(t, at, at + 0.85) * 1.03 - 0.03 * q(t, at + 0.85, at + 1.1); // 物件卡落位带一点过冲
  const sweep = wipe(t, at + 0.05, at + 0.75);                         // 黑面擦过物件卡
  const pillOpen = p(t, at + 0.45, at + 0.9) * 1.055 - 0.055 * q(t, at + 0.9, at + 1.15);
  const lineIn = p(t, lineAt, lineAt + 0.5);

  // 字号按真实文字宽度算
  const nameSize = Math.min(78, ...[c.concept.name, c.object.name].map((s) => (CW - 70) / Math.max(1, textWidth(s, 1))));
  const subSize = Math.max(30, Math.min(40, ...[c.concept.sub ?? '', c.object.sub ?? ''].filter(Boolean).map((s) => (CW - 70) / Math.max(1, textWidth(s, 1)))));
  const linkSize = Math.min(64, 200 / Math.max(1, textWidth(c.link, 1)));
  const linkW = textWidth(c.link, linkSize) + linkSize * 1.4, linkH = linkSize * 1.85;
  const lineSize = Math.min(66, 1640 / Math.max(1, textWidth(c.line, 1)));
  const lineW = textWidth(c.line, lineSize) + 40;

  const hi = c.highlight && c.line.includes(c.highlight) ? c.highlight : '';
  const [lb, la = ''] = hi ? c.line.split(hi) : [c.line, ''];

  const face = (side: YangMetaphorSide, dark: boolean) => {
    const fg = dark ? '#fff' : S.ink;
    return <div style={{ position: 'absolute', inset: 0, background: dark ? S.dark : '#fff', borderRadius: S.radius, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 40, right: 40, top: 46, height: 270, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {side.image
          ? <ImgFill src={side.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18 }} />
          : <Symbol kind={side.symbol ?? 'lock'} fg={fg} bg={dark ? S.dark : '#fff'} size={250} />}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 350, textAlign: 'center', ...textBase(nameSize, 900), color: fg }}>{side.name}</div>
      {side.sub ? <div style={{ position: 'absolute', left: 0, right: 0, top: 350 + nameSize * 1.16 + 18, textAlign: 'center', ...textBase(subSize, 500), color: dark ? '#a3a3ab' : S.muted }}>{side.sub}</div> : null}
    </div>;
  };

  const ghost = p(t, at + 0.2, at + 0.7);
  const bx = mix(960, BX, travel);
  const y = TOP + (1 - enter) * 50;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 概念卡的身份留在左边：分身走开后，从原位旁边浮现（与移动卡不重叠时才完全不透明） */}
      {ghost > 0 && <div style={{ position: 'absolute', left: AX - CW / 2 + (1 - ghost) * 70, top: y, width: CW, height: CH, borderRadius: S.radius, boxShadow: S.shadow,
        opacity: ghost, transform: `scale(${mix(0.95, 1, ghost)})` }}>
        {face(c.concept, false)}
      </div>}
      {/* 同一张卡：向右走，同时被黑面从左向右擦过，变成生活物件 */}
      <div style={{ position: 'absolute', left: bx - CW / 2, top: y, width: CW, height: CH, borderRadius: S.radius, opacity: enter,
        boxShadow: sweep > 0.5 ? S.capsuleShadow : S.shadow, transform: `scale(${mix(0.96, 1, enter) + 0.03 * Math.sin(Math.PI * split)})` }}>
        {face(c.concept, false)}
        {sweep > 0 && <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${CW * (1 - sweep)}px 0 0 round ${S.radius}px)` }}>{face(c.object, true)}</div>}
      </div>
      {/* 就像 */}
      {pillOpen > 0 && <Pill box={{ x: 960 - (linkW * pillOpen) / 2, y: TOP + CH / 2 - linkH / 2, w: linkW * pillOpen, h: linkH }} style={{ zIndex: 5 }}>
        <span style={{ ...textBase(linkSize, 400, S.display), color: '#fff', opacity: clamp((pillOpen - 0.5) / 0.25) }}>{c.link}</span>
      </Pill>}
      {/* 对应关系 */}
      {lineIn > 0 && <div style={{ position: 'absolute', left: 960 - lineW / 2, width: lineW, top: TOP + CH + 64 + (1 - lineIn) * 20, textAlign: 'center',
        ...textBase(lineSize, 900), color: S.ink, opacity: clamp(lineIn * 3), clipPath: `inset(0 ${100 * (1 - lineIn)}% 0 0)` }}>
        {lb}{hi && <span style={{ color: accentOn(false) }}>{hi}</span>}{la}
      </div>}
    </Handoff>
    
    
    
    
  </Frame>;
}
