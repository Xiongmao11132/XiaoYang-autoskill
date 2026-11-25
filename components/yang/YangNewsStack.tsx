// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T22b-NewsStack.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：新闻叠放（正版 T22b）——几条新闻标题卡 → 快速叠落，最后一张停在最前。
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

export type YangNewsItem = {
  image: string;      // 新闻页头截图（标题 + 署名日期），public 相对路径
  width: number;      // 源图像素宽
  height: number;     // 源图像素高
  source: string;     // 来源，例如 TechCrunch
  date: string;       // 日期，例如 10月1日
};

export type YangNewsStackProps = YangHandoffProps & {
  items: YangNewsItem[];  // 2–5 条，最后一条停在最前
  cues?: number[];    // [i]=第 i 张开始落下；[n]=最后一张摆正放大
};

// 默认：TechCrunch 2026 年 9–10 月的真实报道（无登录截图），最后一张是 Jev 相关
export const yangNewsStackDefaults: YangNewsStackProps = {
  items: [
    { image: '', width: 2640, height: 1180, source: 'TechCrunch', date: '10月8日' },
    { image: '', width: 2640, height: 1180, source: 'TechCrunch', date: '10月8日' },
    { image: '', width: 2640, height: 1180, source: 'TechCrunch', date: '9月30日' },
    { image: '', width: 2640, height: 1180, source: 'TechCrunch', date: '10月1日' },
  ],
};

// 叠放时每张的落点（相对画面中心的偏移、角度）；按顺序左右交替，最后一张靠中
const REST = [
  { dx: -150, dy: -34, r: -7 },
  { dx: 150, dy: -6, r: 5.5 },
  { dx: -70, dy: 40, r: -3.5 },
  { dx: 96, dy: 22, r: 4 },
  { dx: -20, dy: -16, r: -2 },
];
const CX = 960, CY = 560;
const PILE_W = 1060;     // 叠放时的卡宽
const FRONT_MAX = { w: 1600, h: 720 };   // 最后一张摆正后的上限（标题字高约 48px）

function Chip({ source, date, scale, opacity }: { source: string; date: string; scale: number; opacity: number }) {
  const size = 30 * scale, h = 64 * scale;
  const w = textWidth(source, size) + textWidth(date, size) + size * 0.7 + h * 0.9;
  return <div style={{
    position: 'absolute', left: 30 * scale, top: -h * 0.42, width: w, height: h, borderRadius: h / 2, background: S.dark,
    boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: size * 0.7, opacity,
  }}>
    <span style={{ ...textBase(size, 900), color: '#fff' }}>{source}</span>
    <span style={{ ...textBase(size, 500), color: S.faint }}>{date}</span>
  </div>;
}

export function YangNewsStack(props: Partial<YangNewsStackProps>) {
  const c = { ...yangNewsStackDefaults, ...props };
  const t = useT();
  const items = c.items.slice(0, 5);
  const n = items.length;

  // 默认节奏：间隔逐渐拉开（0.37 → 0.42s），不机械等距
  const dropAt = items.map((_, i) => cueAt(c.cues, i, 0.05 + i * 0.37 + i * i * 0.02));
  const frontAt = cueAt(c.cues, n, dropAt[n - 1] + 0.78);
  const front = q(t, frontAt, frontAt + 0.62);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {items.map((it, i) => {
        const last = i === n - 1;
        const rest = last ? { dx: 0, dy: 18, r: 2.5 } : REST[i % REST.length];
        const aspect = it.height / it.width;
        // 摆正后的尺寸：宽 1600 以内、高 720 以内
        const fw = Math.min(FRONT_MAX.w, FRONT_MAX.h / aspect);
        const fall = p(t, dropAt[i], dropAt[i] + 0.42);           // 位置 / 角度：ease-out 落到点上
        const thud = springAt(t, dropAt[i], 0.6);                  // 尺寸：从镜头前落到桌面，轻弹一下
        if (t < dropAt[i]) return null;
        // 起点：离镜头更近（更大）、更偏外侧、角度更大
        const x0 = CX + rest.dx * 1.55, y0 = CY + rest.dy - 90;
        let x = mix(x0, CX + rest.dx, fall), y = mix(y0, CY + rest.dy, fall);
        let rot = mix(rest.r * 2.4, rest.r, fall);
        let s = mix(1.18, 1, thud);
        let w = PILE_W;
        // 后落下的卡压上来时，下面的卡被轻轻压实（下沉 + 微缩）
        const pressed = items.slice(i + 1).reduce((a, _, j) => a + p(t, dropAt[i + 1 + j] + 0.3, dropAt[i + 1 + j] + 0.5), 0);
        y += pressed * 5; s *= 1 - pressed * 0.008;
        // 最后一张：摆正、放大、回到中心
        if (last) { x = mix(x, CX, front); y = mix(y, 540, front); rot = mix(rot, 0, front); w = mix(PILE_W, fw, front); }
        const h = w * aspect;
        // 来源胶囊只留最上面一张：下一张落下时收掉，避免几枚胶囊叠在同一个角
        const chipOn = i < n - 1 ? 1 - p(t, dropAt[i + 1] + 0.12, dropAt[i + 1] + 0.3) : 1;
        // 下面几张：最后一张接管时失焦退后
        const recede = last ? 0 : front;
        return <div key={i} style={{
          position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, zIndex: i,
          transform: `rotate(${rot}deg) scale(${s * mix(1, 0.94, recede)})`, opacity: Math.min(1, (t - dropAt[i]) / 0.05),
          filter: recede > 0.01 ? `blur(${6 * recede}px)` : undefined,
        }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: S.radius, overflow: 'hidden', boxShadow: S.shadow, background: '#fff' }}>
            <ImgFill src={it.image} style={{ width: '100%', height: '100%', display: 'block' }} />
            {recede > 0 && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.55 * recede }} />}
          </div>
          <Chip source={it.source} date={it.date} scale={Math.min(1.2, w / PILE_W)} opacity={chipOn} />
        </div>;
      })}
    </Handoff>
    
    
    
  </Frame>;
}
