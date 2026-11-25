// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T09m-Keycap.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：快捷键（正版 T09m）——几颗键帽 → 依次按下（按住不放），组合完成后落出一个动作名。
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

export type YangKeycapKey = {
  label: string;   // 键面主符号/字符
  sub?: string;    // 键面下方小字（如 command、shift），可省
};

export type YangKeycapProps = YangHandoffProps & {
  keys: YangKeycapKey[];     // 2–4 颗
  action: string;        // 组合落成的动作名
  highlight?: string;    // action 里染紫的词（深底 #D6BEFF），留空不强调
  cues?: number[];       // [i]=第 i 颗按下；[keys.length]=动作名落下。不传用默认节奏
};

// 默认内容：macOS 截屏与录屏工具栏 ⌘ ⇧ 5
export const yangKeycapDefaults: YangKeycapProps = {
  keys: [{ label: '⌘', sub: 'command' }, { label: '⇧', sub: 'shift' }, { label: '5' }],
  action: '截屏与录屏',
  highlight: '',
};

const ICONS: Record<string, string[]> = {
  '⌘': ['M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3'],
  '⇧': ['M9 19v-6H4.5L12 5l7.5 8H15v6H9z'],
  '⌥': ['M3 5h5.5l7 14H21', 'M14.5 5H21'],
  '⌃': ['M5.5 14.5 12 8l6.5 6.5'],
};

const ink = (v: number) => {
  // 白 → 黑面 #19191c（同一进度插值，避免跳色）
  const ch = (a: number, b: number) => Math.round(mix(a, b, v));
  return `rgb(${ch(255, 0x19)},${ch(255, 0x19)},${ch(255, 0x1c)})`;
};

function Highlighted({ text, hl, color }: { text: string; hl?: string; color: string }) {
  const i = hl ? text.indexOf(hl) : -1;
  if (!hl || i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<span style={{ color }}>{hl}</span>{text.slice(i + hl.length)}</>;
}

export function YangKeycap(props: Partial<YangKeycapProps>) {
  const c = { ...yangKeycapDefaults, ...props };
  const t = useT();
  const keys = (c.keys.length ? c.keys : yangKeycapDefaults.keys).slice(0, 4);
  const n = keys.length;

  // —— 终态版式（先按 1 倍算，再整体缩到放得下）——
  const H0 = 214;
  const keyW0 = (k: YangKeycapKey) => {
    const hasSub = !!k.sub;
    const glyph = ICONS[k.label] ? H0 * 0.42 : textWidth(k.label, H0 * 0.42);
    const sub = hasSub ? textWidth(k.sub!, H0 * 0.15) : 0;
    return Math.max(H0, glyph + 110, sub + 90, hasSub ? H0 * 1.24 : 0);
  };
  const PLUS0 = 92;
  const keysW0 = keys.reduce((s, k) => s + keyW0(k), 0) + PLUS0 * (n - 1);
  const pillTextSize0 = 112;
  const pillW0 = textWidth(c.action, pillTextSize0) + 170;
  const GAP0 = 96;
  const total0 = keysW0 + GAP0 + pillW0;
  // 一排放得下（缩放不小于 0.8）就左右排；否则改成上下排：键帽一排在上，动作名胶囊落在下面，各自按宽度定大小
  const stacked = 1580 / total0 < 0.8;
  const sc = stacked ? Math.min(1, 1600 / keysW0) : Math.min(1, 1580 / total0);
  const pillSize = stacked ? Math.min(112, 1400 / Math.max(1, textWidth(c.action, 1))) : pillTextSize0 * sc;
  const H = H0 * sc, PLUS = PLUS0 * sc, GAP = GAP0 * sc;
  const pillW = stacked ? textWidth(c.action, pillSize) + 170 * (pillSize / pillTextSize0) : pillW0 * sc;
  const keysW = keysW0 * sc;
  const DEPTH = 17 * sc;
  const GAPV = 64;
  const pillHs = stacked ? Math.max(150, pillSize * 1.9) : H;
    const cy = 540;

  // —— 时间 ——
  const pressAt = keys.map((_, i) => cueAt(c.cues, i, 0.58 + i * 0.36 + (i === 2 ? 0.02 : 0)));
  const lastPress = pressAt[n - 1];
  const actAt = cueAt(c.cues, n, lastPress + 0.34);
  const shift = q(t, actAt - 0.16, actAt + 0.22);          // 整排先让位，胶囊再落进空出来的位置
  const drop = springAt(t, actAt + 0.16, 0.7);             // 胶囊落下（一次轻回弹）
  const dropIn = clamp((t - actAt - 0.16) / 0.06);
  const releaseAt = actAt + 0.36;                           // 胶囊落定的那一下，键帽一起松开

  const keysX0 = stacked ? 960 - keysW / 2 : mix(960 - keysW / 2, 960 - (keysW + GAP + pillW) / 2, shift);
  const keysCy = stacked ? mix(cy, cy - (pillHs + GAPV) / 2, shift) : cy;
  let cursor = keysX0;
  const boxes = keys.map((k, i) => {
    const w = keyW0(k) * sc;
    const b = { x: cursor, y: keysCy - H / 2, w, h: H };
    cursor += w + (i < n - 1 ? PLUS : 0);
    return b;
  });
  const pillX = stacked ? 960 - pillW / 2 : 960 - (keysW + GAP + pillW) / 2 + keysW + GAP;   // 终态位置；落下时整排已基本让开
  const pillH = pillHs;
  const pillCy = stacked ? cy - (pillHs + GAPV) / 2 + H / 2 + GAPV + pillHs / 2 + DEPTH : cy + DEPTH * 0.4;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {keys.map((k, i) => {
        const b = boxes[i];
        const appear = p(t, i * 0.06, i * 0.06 + 0.36);
        // 按下：0.07s 到底；松开：0.16s 回弹
        const down = clamp((t - pressAt[i]) / 0.07) * (1 - p(t, releaseAt + i * 0.04, releaseAt + i * 0.04 + 0.22));
        const dark = clamp((t - pressAt[i]) / 0.06) * (1 - clamp((t - releaseAt - i * 0.04) / 0.06));
        const sink = down * DEPTH * 0.82;
        const face = ink(dark);
        const glyphColor = dark > 0.5 ? '#fff' : S.ink;
        const subColor = dark > 0.5 ? '#a3a3ab' : S.muted;
        const icon = ICONS[k.label];
        const gs = H * 0.42;
        const radius = 34 * sc;
        return <div key={i} style={{ ...abs({ x: b.x, y: b.y + (1 - appear) * 46, w: b.w, h: b.h + DEPTH }), opacity: clamp(appear * 1.6) }}>
          {/* 键帽侧面（厚度）+ 落地阴影：按下时阴影收紧 */}
          <div style={{
            position: 'absolute', left: 0, top: DEPTH, width: b.w, height: b.h, borderRadius: radius, background: '#d2d2d7',
            boxShadow: `0 ${mix(22, 8, down) * sc}px ${mix(30, 12, down) * sc}px rgba(0,0,0,${mix(0.16, 0.1, down)})`,
          }} />
          {/* 帽面 */}
          <div style={{
            position: 'absolute', left: 0, top: sink, width: b.w, height: b.h, borderRadius: radius, background: face,
            boxShadow: `inset 0 ${-5 * sc}px 0 rgba(0,0,0,${0.05 * (1 - dark)})`,
          }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: k.sub ? H * 0.17 : 0, bottom: k.sub ? undefined : 0, height: k.sub ? gs : undefined, ...center }}>
              {icon
                ? <svg width={gs} height={gs} viewBox="0 0 24 24" fill="none" stroke={glyphColor} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
                  {icon.map((d, j) => <path key={j} d={d} />)}
                </svg>
                : <span style={{ ...textBase(gs, 900), lineHeight: 1, color: glyphColor }}>{k.label}</span>}
            </div>
            {k.sub && <div style={{ position: 'absolute', left: 0, right: 0, bottom: H * 0.12, textAlign: 'center', ...textBase(H * 0.15, 500), color: subColor }}>{k.sub}</div>}
          </div>
        </div>;
      })}
      {/* 键与键之间的 + */}
      {keys.slice(1).map((_, i) => {
        const b = boxes[i];
        const appear = p(t, 0.1 + i * 0.06, 0.45 + i * 0.06);
        return <div key={i} style={{ ...abs({ x: b.x + b.w, y: keysCy - H / 2 + DEPTH * 0.4, w: PLUS, h: H }), ...center, opacity: appear }}>
          <span style={{ ...textBase(H * 0.3, 500), lineHeight: 1, color: '#a3a3ab' }}>+</span>
        </div>;
      })}
      {/* 动作名胶囊：从上方落到右侧 */}
      {dropIn > 0 && <div style={{
        ...abs({ x: pillX, y: pillCy - pillH / 2 - (1 - drop) * 150, w: pillW, h: pillH }), borderRadius: pillH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, ...center, opacity: dropIn,
      }}>
        <span style={{ ...textBase(pillSize, 400, S.display), lineHeight: 1, color: '#fff' }}>
          <Highlighted text={c.action} hl={c.highlight} color={S.accentDark} />
        </span>
      </div>}
    </Handoff>
    
    
  </Frame>;
}
