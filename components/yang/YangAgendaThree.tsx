// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T02a-AgendaThree.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-native-16-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-native-16-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：本期 N 件事（正版 T02a）。
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

export type YangAgendaThreeProps = {
  items: string[];      // 2–5 项
  current: number;      // 0 起；-1 表示只预告、不聚焦
  mode: 'preview' | 'chapter';   // preview：逐张建立后聚焦；chapter：直接整排出现并聚焦（章节开头复用）
};

export const yangAgendaThreeDefaults: YangAgendaThreeProps = {
  items: ['装好 Codex 并登录', '让它读懂你的项目', '用一句话改出成品'],
  current: 0,
  mode: 'preview',
};

const GAP = 44, CARD_H = 420, PAD = 46;

// 比 kit textWidth 更保守：大写拉丁字母按 0.68 估（MiSans Heavy 大写偏宽）
const tw = (str: string, size: number) =>
  Array.from(str).reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.68 : /[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);

// 标题最多两行：拉丁词整体不拆，中文逐字；从大到小找能放进两行的字号
function wrap(title: string, size: number, inner: number): string[] {
  const tokens = title.match(/[A-Za-z0-9.\-_/+#]+|\s+|./gu) ?? [];
  const lines: string[] = [''];
  for (const tk of tokens) {
    const cur = lines[lines.length - 1];
    if (cur && tw(cur + tk, size) > inner) lines.push(tk.trim() ? tk : '');
    else lines[lines.length - 1] = cur + tk;
  }
  return lines.map((l) => l.trim()).filter(Boolean);
}
// 平衡折行：在能放下的前提下，把每行宽度收窄到接近平均，避免“改/出成品”这类断头
function balanced(title: string, size: number, inner: number): string[] {
  const k = wrap(title, size, inner).length;
  if (k <= 1) return [title.trim()];
  const total = tw(title, size);
  for (let w = total / k; w <= inner; w += size * 0.25) {
    const lines = wrap(title, size, w);
    if (lines.length === k) return lines;
  }
  return wrap(title, size, inner);
}
function layoutTitle(title: string, inner: number, maxLines: number) {
  for (let size = 84; size >= 48; size -= 2) {
    const lines = wrap(title, size, inner);
    if (lines.length <= maxLines && lines.every((l) => tw(l, size) <= inner)) return size;
  }
  return 48;
}

export function YangAgendaThree(props: Partial<YangAgendaThreeProps>) {
  const c = { ...yangAgendaThreeDefaults, ...props };
  const t = useT();
  const n = Math.max(1, c.items.length);
  // 2–3 项：横排竖卡（编号在上、标题在下）；4–5 项：卡太窄会把字压小，改为竖排横条（编号在左、标题单行）
  const stacked = n >= 4;
  const cardW = stacked ? 0 : Math.min(520, (1720 - GAP * (n - 1)) / n);
  const rowGap = 26;
  const rowH = stacked ? Math.min(150, (900 - rowGap * (n - 1)) / n) : 0;
  const pillW = stacked ? rowH * 0.95 : 136, pillH = stacked ? rowH - 2 * 30 : 92;
  const inner = stacked ? 1300 - PAD * 2 - pillW - 40 : cardW - PAD * 2;
  const maxLines = stacked ? 1 : 2;
  const size = stacked
    ? Math.min(72, rowH * 0.48, ...c.items.map((s) => inner / Math.max(1, tw(s, 1))))
    : Math.min(...c.items.map((s) => layoutTitle(s, inner, maxLines)));
  const linesOf = (s: string) => (stacked ? [s] : balanced(s, size, inner));
  const stackW = stacked ? Math.min(1300, PAD * 2 + pillW + 40 + Math.max(...c.items.map((s) => tw(s, size)))) : 0;
  const boxOf = (i: number) => stacked
    ? { x: (1920 - stackW) / 2, y: 540 + 20 - (n * rowH + (n - 1) * rowGap) / 2 + i * (rowH + rowGap), w: stackW, h: rowH }
    : { x: (1920 - (n * cardW + (n - 1) * GAP)) / 2 + i * (cardW + GAP), y: 540 - CARD_H / 2 + 20, w: cardW, h: CARD_H };

  const chapter = c.mode === 'chapter';
  const startAt = (i: number) => (chapter ? 0.02 : 0.12 + i * 0.34);
  const buildDur = chapter ? 0.4 : 0.5;
  const focusAt = chapter ? 0.55 : startAt(n - 1) + 0.95;
  const focus = c.current >= 0 && c.current < n ? q(t, focusAt, focusAt + 0.55) : 0;

  return <Frame>
    {c.items.map((title, i) => {
      const e = p(t, startAt(i), startAt(i) + buildDur);
      const num = p(t, startAt(i) + 0.12, startAt(i) + 0.45);
      const isCur = i === c.current;
      const lift = isCur ? focus : 0;
      const dim = !isCur ? focus : 0;
      const b = boxOf(i);
      return <div key={i} style={{
        position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none',
        opacity: e * mix(1, 0.35, dim), zIndex: isCur ? 2 : 1,
        transform: stacked ? `translateX(${(1 - e) * 120 + 30 * lift}px)` : `translateY(${(1 - e) * 80 - 40 * lift}px)`,
      }}>
        <Surface box={b} shadow={lift > 0 ? `0 ${16 + 18 * lift}px ${25 + 20 * lift}px 0 rgba(0,0,0,${0.133 + 0.07 * lift})` : S.shadow}
          style={{ transform: `scale(${mix(1, stacked ? 1.05 : 1.08, lift) * mix(1, 0.97, dim)})`, overflow: 'visible' }}>
          <Pill box={stacked ? { x: 30, y: 30, w: pillW, h: pillH } : { x: PAD, y: PAD, w: pillW, h: pillH }} style={{ opacity: num, transform: `scale(${mix(0.6, 1, num)})` }}>
            <span style={{ ...textBase(stacked ? pillH * 0.62 : 60, 900), color: S.accentDark }}>{String(i + 1).padStart(2, '0')}</span>
          </Pill>
          <div style={stacked
            ? { position: 'absolute', left: 30 + pillW + 40, top: (rowH - size * 1.16) / 2, color: S.ink }
            : { position: 'absolute', left: PAD, right: PAD, bottom: PAD + 4, color: S.ink }}>
            {linesOf(title).map((l, k) => <div key={k} style={{ ...textBase(size, 900), lineHeight: stacked ? 1.16 : 1.2 }}>{l}</div>)}
          </div>
        </Surface>
      </div>;
    })}
    
  </Frame>;
}
