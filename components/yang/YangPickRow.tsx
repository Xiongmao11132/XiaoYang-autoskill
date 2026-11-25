// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T09i-PickRow.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：按条件选中一行（正版 T09i）——一列选项 → 条件胶囊连到匹配的那一行，其余退灰。
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

export type YangPickCondition = {
  label: string;     // 条件，例如“苹果芯片 Mac”
  row: Box;          // 匹配行在截图里的像素框（整行）
};

export type YangPickRowProps = YangHandoffProps & {
  image: string;
  imageWidth: number;
  imageHeight: number;
  crop: Box;                    // 要展示的列表区域（源图像素），上下边落在行间分隔线
  conditions: YangPickCondition[];  // 1–3 组，按讲解顺序
  cues?: number[];              // [i]=第 i 个条件胶囊出现
};

export const yangPickRowDefaults: YangPickRowProps = {
  image: '',
  imageWidth: 3840,
  imageHeight: 2160,
  crop: { x: 710, y: 717, w: 890, h: 882 },   // 文件名一列（右边界在 sha256 列之前），10 行，上下边落在分隔线
  conditions: [
    { label: '苹果芯片 Mac', row: { x: 740, y: 805, w: 2360, h: 90 } },   // LosslessCut-mac-arm64.dmg
    { label: 'Windows', row: { x: 740, y: 1509, w: 2360, h: 90 } },       // LosslessCut-win-x64.7z
  ],
};

const SAFE_TOP = 140;        // 角标下方
const SAFE_BOTTOM = 890;     // 字幕上方：被选中的行（含提起放大）不低于这里
const LIFT = 1.14;           // 选中行原位放大
const GAP = 110;             // 胶囊列与列表之间（引线长度）

// 锐字真言只用于中文；拉丁片段换 MiSans Heavy，同字号同基线（T02e 写法）
function DisplayText({ text, size, color }: { text: string; size: number; color: string }) {
  const runs = text.match(/[\u0000-ÿ]+|[^\u0000-ÿ]+/g) ?? [text];
  return <span style={{ ...textBase(size, 400, S.display), color, lineHeight: 1 }}>
    {runs.map((r, i) => /^[\u0000-ÿ]+$/.test(r)
      ? <span key={i} style={{ fontFamily: S.body, fontWeight: 900 }}>{r}</span>
      : <React.Fragment key={i}>{r}</React.Fragment>)}
  </span>;
}
const labelUnits = (s: string) => Array.from(s).reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.68 : /[\u0000-ÿ]/.test(ch) ? 0.6 : 1), 0);

export function YangPickRow(props: Partial<YangPickRowProps>) {
  const c = { ...yangPickRowDefaults, ...props };
  const t = useT();
  const conds = c.conditions.slice(0, 3);
  const n = conds.length;

  // —— 胶囊尺寸：统一字号，宽度按最长条件 ——
  const size = Math.max(36, Math.min(50, ...conds.map((cd) => 440 / (labelUnits(cd.label) + 1.6))));
  const pillH = Math.round(size * 1.85);
  const pillW = conds.map((cd) => labelUnits(cd.label) * size + size * 1.6);
  const colW = Math.max(...pillW);

  // —— 列表缩放：高度放进安全区，最低选中行（放大后）不低于 SAFE_BOTTOM ——
  const lowest = Math.max(...conds.map((cd) => cd.row.y + cd.row.h)) - c.crop.y;
  const kFit = Math.min(1.0, (SAFE_BOTTOM - SAFE_TOP) / c.crop.h, (1700 - colW - GAP) / c.crop.w);
  const k = kFit;
  const W = c.crop.w * k, H = c.crop.h * k;
  // 纵向：先居中于安全区，再保证最低选中行（含放大余量）在 SAFE_BOTTOM 之上
  const rowHmax = Math.max(...conds.map((cd) => cd.row.h)) * k;
  let Y = SAFE_TOP + (SAFE_BOTTOM - SAFE_TOP - H) / 2;
  Y = Math.min(Y, SAFE_BOTTOM - lowest * k - rowHmax * (LIFT - 1) / 2);
  Y = Math.max(SAFE_TOP, Y);
  const groupW = colW + GAP + W;
  const X0 = (1920 - groupW) / 2;                // 胶囊列左边
  const X = X0 + colW + GAP;                     // 列表左边
  const imgL = X - c.crop.x * k, imgT = Y - c.crop.y * k;
  const rowBox = conds.map((cd): Box => {        // 行框裁到展示区域内（右边的列已裁掉）
    const x1 = Math.max(cd.row.x, c.crop.x), x2 = Math.min(cd.row.x + cd.row.w, c.crop.x + c.crop.w);
    return { x: X + (x1 - c.crop.x) * k, y: Y + (cd.row.y - c.crop.y) * k, w: (x2 - x1) * k, h: cd.row.h * k };
  });

  // 胶囊纵向对准各自那一行；相邻两行太近时依次往下让，保证不叠
  const cy = conds.map((_, i) => rowBox[i].y + rowBox[i].h / 2);
  const order = conds.map((_, i) => i).sort((a, b) => cy[a] - cy[b]);
  const pillCy = [...cy];
  order.forEach((i, j) => { if (j > 0) pillCy[i] = Math.max(pillCy[i], pillCy[order[j - 1]] + pillH + 22); });

  // —— 时间线 ——
  const step = n === 3 ? 1.35 : 1.8;
  const at = conds.map((_, i) => cueAt(c.cues, i, 0.6 + i * step));
  const pill = at.map((a) => springAt(t, a, 0.6));
  const line = at.map((a) => p(t, a + 0.3, a + 0.62));
  const lift = at.map((a) => p(t, a + 0.55, a + 1.0));
  const dim = Math.max(0, ...lift);
  const enter = p(t, 0, 0.45);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 真实列表：其余行退后（轻失焦 + 白蒙版） */}
      <Surface box={{ x: X, y: Y + (1 - enter) * 40, w: W, h: H }} style={{ opacity: enter }}>
        <ImgFill src={c.image} style={{ position: 'absolute', left: imgL - X, top: imgT - Y, width: c.imageWidth * k, height: c.imageHeight * k, maxWidth: 'none', filter: dim > 0.01 ? `blur(${2.5 * dim}px)` : undefined }} />
        <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.72 * dim }} />
      </Surface>

      {/* 引线：胶囊右端 → 匹配行左端（短横线；行被让位时斜接） */}
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 5 }}>
        {conds.map((_, i) => {
          if (line[i] <= 0) return null;
          const x1 = X0 + colW + 10, x2 = rowBox[i].x - (rowBox[i].w * (LIFT - 1)) / 2 * lift[i] - 6;
          const y1 = pillCy[i], y2 = cy[i];
          const xe = mix(x1, x2, line[i]), ye = mix(y1, y2, line[i]);
          return <g key={i}>
            <path d={`M ${x1} ${y1} L ${xe} ${ye}`} stroke={S.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
            <circle cx={xe} cy={ye} r={8 * clamp(line[i] * 1.5)} fill={S.ink} />
          </g>;
        })}
      </svg>

      {/* 匹配行：同一行的真实像素，原位提起放大 */}
      {conds.map((_, i) => {
        if (lift[i] <= 0.001) return null;
        const r = rowBox[i];
        const e = lift[i];
        return <div key={i} style={{
          position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden', background: '#fff',
          borderRadius: mix(0, 14, e), transform: `scale(${mix(1, LIFT, e)})`, transformOrigin: '50% 50%',
          boxShadow: `0 ${mix(2, 20, e)}px ${mix(6, 34, e)}px rgba(0,0,0,${mix(0.04, 0.18, e)})`, zIndex: 10 + i,
        }}>
          <ImgFill src={c.image} style={{ position: 'absolute', left: imgL - r.x, top: imgT - r.y, width: c.imageWidth * k, height: c.imageHeight * k, maxWidth: 'none' }} />
        </div>;
      })}

      {/* 条件胶囊：右对齐成一列，从引线起点处弹出 */}
      {conds.map((cd, i) => {
        if (t < at[i]) return null;
        const pp = pill[i];
        return <div key={i} style={{
          position: 'absolute', left: X0 + colW - pillW[i], top: pillCy[i] - pillH / 2, width: pillW[i], height: pillH, borderRadius: pillH / 2,
          background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: clamp((t - at[i]) / 0.1), transform: `translateX(${(1 - clamp(pp)) * 36}px) scale(${mix(0.72, 1, pp)})`, transformOrigin: '100% 50%', zIndex: 20,
        }}>
          <DisplayText text={cd.label} size={size} color="#fff" />
        </div>;
      })}
    </Handoff>
    
    
  </Frame>;
}
