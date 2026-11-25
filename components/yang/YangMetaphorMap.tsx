// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T04a-MetaphorMap.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-native-16-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-native-16-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：比喻映射（正版 T04a）。
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

export type YangMetaphorPair = { left: string; right: string };
export type YangMetaphorMapProps = {
  concept: string;          // 左列名（真实概念）
  metaphor: string;         // 右列名（生活比喻）
  pairs: YangMetaphorPair[];    // 2–4 对
  summary: string;          // 合成的一句，'≈' 后半句染紫
  yang?: string;            // 可选：透明 Yang 侧边探头（PNG），空字符串关闭
};

export const yangMetaphorMapDefaults: YangMetaphorMapProps = {
  concept: '程序世界',
  metaphor: '餐厅',
  pairs: [
    { left: 'API', right: '服务员' },
    { left: '发请求', right: '点菜' },
    { left: '返回结果', right: '上菜' },
  ],
  summary: 'API ≈ 餐厅服务员',
  yang: '',
};

const L_CX = 640;          // 左列中心
const R_CX_FINAL = 1240;   // 配对后右卡中心（贴近左侧）
const R_CX_START = 1300;   // 未配对时右卡中心（稍远、变淡）

// 未配对时右列的打乱顺序：把第 i 项放到 order[i] 行
const shuffled = (n: number) => Array.from({ length: n }, (_, i) => (i + 1) % n);

export function YangMetaphorMap(props: Partial<YangMetaphorMapProps>) {
  const c = { ...yangMetaphorMapDefaults, ...props };
  const t = useT();
  const pairs = c.pairs.slice(0, 5);
  const n = Math.max(1, pairs.length);
  const order = shuffled(n);

  // 行几何：整组在标题下居中
  const rowH = n <= 3 ? 150 : n === 4 ? 128 : 108;
  const gap = n <= 3 ? 46 : 32;
  const listH = n * rowH + (n - 1) * gap;
  const top = 300 + (720 - listH) / 2;
  const rowY = (i: number) => top + i * (rowH + gap);

  // 字号：同列同字号，按最长项与可用宽度自适应
  const capW = 500, cardW = 500;
  const size = Math.min(rowH * 0.42, 74, ...pairs.flatMap((pr) => [(capW - 90) / Math.max(1, textWidth(pr.left, 1)), (cardW - 90) / Math.max(1, textWidth(pr.right, 1))]));

  // 时序
  const intro = p(t, 0.02, 0.5);
  const step = Math.min(0.6, 1.9 / n);
  const linkDur = Math.min(0.62, step + 0.04);
  const pairAt = (i: number) => 0.55 + i * step;
  // 全部配好后留约 0.8s 读完整映射，再合拢
  const mergeAt = Math.min(3.4, pairAt(n - 1) + linkDur + 0.8);
  // 合拢：先收字 → 右卡贴到左胶囊 → 每行收向中线 → 形状化成一个合成胶囊
  const merge = q(t, mergeAt, mergeAt + 0.3);              // 列名退场
  const textOut = q(t, mergeAt, mergeAt + 0.2);
  const dock = p(t, mergeAt, mergeAt + 0.38);
  const gather = p(t, mergeAt + 0.2, mergeAt + 0.66);
  const shapeOut = q(t, mergeAt + 0.4, mergeAt + 0.62);
  const sumIn = p(t, mergeAt + 0.4, mergeAt + 0.82);
  const sumText = p(t, mergeAt + 0.6, mergeAt + 0.95);

  // 右卡位置模拟：第 i 步把比喻 i 换到第 i 行，原来占着这一行的卡换到它空出的位置（交换，不画箭头）
  const slotAt = (j: number) => {
    const slots = [...order];
    for (let i = 0; i < n; i++) {
      const v = p(t, pairAt(i), pairAt(i) + linkDur);
      const from = slots[i];
      const k = slots.indexOf(i);           // 当前占着第 i 行的卡
      if (v < 1) {                          // 这一步还没做完：只有参与交换的两张卡在动
        if (j === i) return { slot: mix(from, i, v), x: 0 };
        if (j === k) return { slot: mix(i, from, v), x: Math.sin(Math.PI * v) * 70 };
        return { slot: slots[j], x: 0 };
      }
      slots[k] = from; slots[i] = i;
    }
    return { slot: slots[j], x: 0 };
  };

  // 当前正在配的那一对（用于紫色）
  const current = pairs.findIndex((_, i) => t >= pairAt(i) && (i === n - 1 ? t < mergeAt : t < pairAt(i + 1)));

  // 合成句
  const [sumA, sumB] = c.summary.includes('≈') ? [c.summary.slice(0, c.summary.indexOf('≈') + 1), c.summary.slice(c.summary.indexOf('≈') + 1)] : [c.summary, ''];
  const sumSize = Math.min(124, 1340 / Math.max(1, textWidth(c.summary, 1)));
  const sumW = textWidth(c.summary, sumSize) + sumSize * 1.6;
  const sumH = sumSize * 2.1;

  const headSize = 52;
  const yangIn = q(t, 0.9, 1.5) * (1 - q(t, mergeAt, mergeAt + 0.4));

  return <Frame>
    {/* 列名：概念 / 比喻（随合拢淡出） */}
    {[{ text: c.concept, cx: L_CX }, { text: c.metaphor, cx: R_CX_FINAL }].map((h, k) => <div key={k} style={{
      ...textBase(headSize, 900), position: 'absolute', left: h.cx - textWidth(h.text, headSize) / 2, top: top - 112 + (1 - intro) * 20,
      color: S.faint, opacity: intro * (1 - merge),
    }}>{h.text}</div>)}

    {pairs.map((pr, i) => {
      const enter = p(t, 0.05 + i * 0.08, 0.5 + i * 0.08);
      const link = p(t, pairAt(i), pairAt(i) + linkDur);           // 右卡移动对齐
      const light = q(t, pairAt(i), pairAt(i) + 0.3);           // 左侧点亮成黑胶囊
      const isCur = i === current;
      const y = rowY(i);
      // 合拢：整行（左胶囊 + 贴上的右卡）收向画面中心
      const dockX = L_CX + capW / 2 + cardW / 2 - 30;
      const rowCx = L_CX + (cardW - 30) / 2;
      const mx = (960 - rowCx) * gather, my = (540 - (y + rowH / 2)) * gather;
      const fade = 1 - shapeOut;
      const pos = slotAt(i);
      const rx = mix(mix(R_CX_START, R_CX_FINAL, link) + pos.x, dockX, dock) + mx, ry = top + pos.slot * (rowH + gap);
      return <React.Fragment key={i}>
        {/* 左：概念（未点亮为白卡，点亮为黑胶囊） */}
        <div style={{
          position: 'absolute', left: L_CX - capW / 2 + mx, top: y + my + (1 - enter) * 30, width: capW, height: rowH,
          borderRadius: rowH / 2, background: `rgb(${mix(255, 25, light)},${mix(255, 25, light)},${mix(255, 28, light)})`,
          boxShadow: light > 0.5 ? S.capsuleShadow : S.shadow, opacity: enter * fade, transform: `scale(${mix(1, 0.86, gather)})`, ...center, zIndex: 30,
        }}>
          <span style={{ ...textBase(size, 900), opacity: 1 - textOut, color: light > 0.5 ? (isCur ? S.accentDark : '#fff') : S.muted }}>{pr.left}</span>
        </div>
        {/* 右：比喻白卡，从打乱的位置移到与左侧同一行 */}
        <div style={{
          position: 'absolute', left: rx - cardW / 2, top: ry + my + (1 - enter) * 30, width: cardW, height: rowH,
          borderRadius: S.radius, background: '#fff', boxShadow: S.shadow, ...center, zIndex: link > 0 && link < 1 ? 20 : 10,
          opacity: enter * mix(0.42, 1, link) * fade, transform: `scale(${mix(1, 0.86, gather)})`,
        }}>
          <span style={{ ...textBase(size, link > 0.5 ? 900 : 500), opacity: 1 - textOut, color: isCur && link > 0.5 ? S.accent : S.ink }}>{pr.right}</span>
        </div>
      </React.Fragment>;
    })}

    {/* 合成句：黑胶囊 */}
    <div style={{
      position: 'absolute', left: 960 - sumW / 2, top: 540 - sumH / 2 + (1 - sumIn) * 24, width: sumW, height: sumH, borderRadius: sumH / 2,
      background: S.dark, boxShadow: S.capsuleShadow, opacity: sumIn, transform: `scale(${mix(0.8, 1, sumIn)})`, ...center, zIndex: 40,
    }}>
      <span style={{ ...textBase(sumSize, 900), color: '#fff', opacity: sumText, transform: `translateY(${(1 - sumText) * 14}px)` }}>{sumA}<span style={{ color: S.accentDark }}>{sumB}</span></span>
    </div>

    {/* 可选：Yang 从右下探头看配对过程，合拢前退出 */}
    {c.yang ? <ImgFill src={c.yang} style={{
      position: 'absolute', right: -6 - (1 - yangIn) * 330, bottom: -40, height: 560, opacity: yangIn,
    }} /> : null}

    
    
    
    
  </Frame>;
}
