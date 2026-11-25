// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T19a-PainPoint.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-native-16-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-native-16-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：痛点小人（正版 T19a）。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT（等宽走系统等宽栈）；
// Brand 角标未集成（Frame 的 brand 入参仅兼容、忽略）；kit 的 theme/ui 已内嵌移植（见下），逻辑与原版一致；
// defaults 保留原包示例数据（原版节目示例），使用时请传真实数据。
// 媒体注记：原包 defaults 里的原版素材路径已置空串——空串时由 ImgFill/Media 内置的中性骨架占位面顶替，
// 使用时传自己的真实素材（及对应像素框/尺寸）即走原逻辑。
// 舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。调色板保留原版设计。
import React from 'react';
import { AbsoluteFill, Easing, Img, OffthreadVideo, staticFile, Freeze, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
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

export type YangPainPointProps = {
  character: string;        // 透明 webm（VP9 alpha）或透明 PNG
  pains: string[];          // 2–4 条，最后一条最重
  keyword?: string;         // 最后一条里染紫的词
  summary: string;          // 黑胶囊结论
  summaryKey?: string;      // 胶囊里染紫的片段
  holdAt?: number;          // 人物视频在该秒定格（默认 4.25：原片 4.4s 后手会放下，定格保住苦恼姿态）
};

export const yangPainPointDefaults: YangPainPointProps = {
  character: '',
  pains: ['每次都要重新交代背景', '改完一处又坏一处', '聊久了它就忘了前面', '项目规则全靠我记'],
  keyword: '全靠我记',
  summary: '问题：AI 记不住你的项目',
  summaryKey: '记不住',
  holdAt: 4.25,
};

const LEFT_EDGE = 880, RIGHT_EDGE = 1830;
const HEAD = { x: 690, y: 400 };            // 小人头部大致位置：气泡从这里“冒出”

function Highlight({ text, keyword, color }: { text: string; keyword?: string; color: string }) {
  if (!keyword || !text.includes(keyword)) return <>{text}</>;
  const i = text.indexOf(keyword);
  return <>{text.slice(0, i)}<span style={{ color }}>{keyword}</span>{text.slice(i + keyword.length)}</>;
}

export function YangPainPoint(props: Partial<YangPainPointProps>) {
  const c = { ...yangPainPointDefaults, ...props };
  const t = useT();
  const frame = useCurrentFrame();
  const holdFrame = Math.round((c.holdAt ?? 99) * 60);
  const pains = c.pains.slice(0, 4);
  const n = pains.length;
  const isVideo = /\.(webm|mov|mp4)$/i.test(c.character);

  // —— 时间线 ——
  const popAt = (i: number) => 0.3 + i * (1.86 / Math.max(1, n - 1));   // 最后一条约 2.16s 冒出
  const sqAt = (i: number) => 3.15 + i * 0.06;          // 先冒出的先被挤进去
  const sumIn = p(t, 3.35, 3.8);
  const sumPop = springAt(t, 3.35, 0.6);
  const charIn = p(t, 0, 0.45);

  // 结论胶囊
  let sumSize = 88;
  while (sumSize > 56 && textWidth(c.summary, sumSize) > 860) sumSize -= 2;
  const sumW = textWidth(c.summary, sumSize) + 140, sumH = sumSize * 1.9;
  const sumCx = clamp(1355, LEFT_EDGE + sumW / 2, RIGHT_EDGE - sumW / 2), sumCy = 560;

  // 气泡布局：前几条左右交错往下排，最后一条居中最大
  const bubbles = pains.map((text, i) => {
    const last = i === n - 1;
    let size = last ? 96 : 66;
    const maxW = last ? RIGHT_EDGE - LEFT_EDGE : 760;
    while (size > 40 && textWidth(text, size) + size * 1.6 > maxW) size -= 2;
    const w = textWidth(text, size) + size * 1.6, h = size * 2.3;
    let cx: number, cy: number;
    if (last) { cx = clamp(1360, LEFT_EDGE + w / 2, RIGHT_EDGE - w / 2); cy = n <= 2 ? 640 : 800; }
    else { cx = i % 2 === 0 ? LEFT_EDGE + w / 2 : RIGHT_EDGE - w / 2; cy = (n <= 2 ? 360 : 250) + i * 172; }
    return { text, last, size, w, h, cx, cy };
  });

  return <Frame>
    {/* 小人：贴底，左侧 */}
    <div style={{ position: 'absolute', left: -150, top: 90, width: 990, height: 990, opacity: charIn, transform: `translateY(${(1 - charIn) * 40}px)` }}>
      {isVideo
        ? <Freeze frame={holdFrame} active={frame >= holdFrame}><OffthreadVideo muted transparent src={staticFile(c.character)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></Freeze>
        : <ImgFill src={c.character} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom' }} />}
    </div>

    {bubbles.map((b, i) => {
      const at = popAt(i);
      const v = springAt(t, at, 0.55);
      const squeeze = q(t, sqAt(i), sqAt(i) + 0.4);
      const op = clamp((t - at) / 0.12) * (1 - clamp((squeeze - 0.3) / 0.3));
      const textOp = 1 - clamp(squeeze / 0.4);              // 挤压一开始字就先退，避免和胶囊字叠在一起
      // 冒出：从小人头部方向飞出放大；收拢：被挤向结论胶囊并缩小
      const x = mix(mix(HEAD.x, b.cx, clamp(v)), sumCx, squeeze);
      const y = mix(mix(HEAD.y, b.cy, clamp(v)), sumCy, squeeze);
      const s = mix(0.35, 1, v);
      const sx = mix(1, 0.18, squeeze), sy = mix(1, 0.5, squeeze);   // 横向被挤扁，收进胶囊那一行
      return <div key={i} style={{
        position: 'absolute', left: x - b.w / 2, top: y - b.h / 2, width: b.w, height: b.h, borderRadius: S.radius,
        background: '#fff', boxShadow: S.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: op, transform: `scale(${s * sx}, ${s * sy})`, zIndex: 10 + i,
      }}>
        <span style={{ ...textBase(b.size, 900), color: S.ink, lineHeight: 1, opacity: textOp }}>
          {b.last ? <Highlight text={b.text} keyword={c.keyword} color={S.accent} /> : b.text}
        </span>
      </div>;
    })}

    <div style={{
      position: 'absolute', left: sumCx - sumW / 2, top: sumCy - sumH / 2, width: sumW, height: sumH, borderRadius: sumH / 2,
      background: S.ink, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: sumIn, transform: `scale(${mix(0.3, 1, sumPop)}, ${mix(0.6, 1, sumPop)})`, zIndex: 5,
    }}>
      <span style={{ ...textBase(sumSize, 900), color: '#fff', lineHeight: 1, opacity: p(t, 3.62, 3.95) }}>
        <Highlight text={c.summary} keyword={c.summaryKey} color={S.accentDark} />
      </span>
    </div>

    
    
  </Frame>;
}
