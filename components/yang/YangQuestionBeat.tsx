// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T12i-QuestionBeat.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：一句问题砸下（快过渡）（正版 T12i）——一个问题 → 大字落定，问号弹出。
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

export type YangQuestionBeatProps = YangHandoffProps & {
  question: string;   // 问题；句尾的 ？/? 会被拿出来单独弹出（没写问号也会补一个）
  label: string;      // 左上小号步骤号（例：第二步）；留空不显示
  cues?: number[];    // [0]=大字开始砸下，[1]=问号弹出；不传用默认节奏
};

// 默认内容：第 114 期 S11“第二步，也是最多人卡住的：下载哪个？”
export const yangQuestionBeatDefaults: YangQuestionBeatProps = {
  question: '下载哪个？',
  label: '第二步',
};

// 先冲过目标一点、再回落（motion-craft §2）
const overshoot = (t: number, a: number, rise: number, settle: number, amount: number) =>
  p(t, a, a + rise) * (1 + amount) - amount * q(t, a + rise, a + rise + settle);

// 均衡折成两行：优先在标点/空格后断；行尾标点不上屏
const splitTwo = (s: string): string[] => {
  const chars = Array.from(s);
  const total = textWidth(s, 1);
  let best = Math.ceil(chars.length / 2), bestScore = Infinity, acc = 0;
  for (let i = 1; i < chars.length; i++) {
    acc += textWidth(chars[i - 1], 1);
    if (/[，,、。：:；;！!]/.test(chars[i])) continue;
    const soft = /[，,、：:；; ]/.test(chars[i - 1]) ? -2 : 0;
    const score = Math.abs(acc - total / 2) + soft;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  const tidy = (l: string) => l.trim().replace(/[，,、。：:；;]+$/, '');
  return [tidy(chars.slice(0, best).join('')), tidy(chars.slice(best).join(''))];
};

const MAX_TEXT_W = 1440;   // 大字最大行宽
const PAD_X = 112, PAD_Y = 92;
const CHIP_H = 76, CHIP_FS = 42, CHIP_GAP = 34;
const MARK_W = 0.92;       // 问号槽宽（以字号计）

export function YangQuestionBeat(props: Partial<YangQuestionBeatProps>) {
  const c = { ...yangQuestionBeatDefaults, ...props };
  const t = useT();
  const body = c.question.trim().replace(/[？?]+$/, '');

  // —— 版式：一行能放下 ≥124px 就一行，否则两行；问号槽跟在最后一行 ——
  const fit = (ls: string[]) => Math.min(ls.length > 1 ? 150 : 178,
    ...ls.map((l, i) => MAX_TEXT_W / Math.max(1, textWidth(l, 1) + (i === ls.length - 1 ? MARK_W : 0))));
  let lines = [body];
  let size = fit(lines);
  if (size < 124 && Array.from(body).length > 4) { lines = splitTwo(body); size = fit(lines); }
  const LH = size * (lines.length > 1 ? 1.28 : 1.14);   // 两行时拉开行距，下一行砸进来时不贴着上一行
  const lineW = (i: number) => textWidth(lines[i], size) + (i === lines.length - 1 ? MARK_W * size : 0);
  const contentW = Math.max(...lines.map((_, i) => lineW(i)));
  const chipW = c.label ? textWidth(c.label, CHIP_FS) + CHIP_FS * 1.3 : 0;
  const W = Math.max(contentW, chipW) + PAD_X * 2;
  const chipBlock = c.label ? CHIP_H + CHIP_GAP : 0;
  const H = PAD_Y * 2 + chipBlock + lines.length * LH;
  const X = 960 - W / 2, Y = 540 - H / 2 + 8;
  const textX = X + PAD_X;                  // 步骤号与大字共用左边界
  const textY = Y + PAD_Y + chipBlock;

  // —— 时间 ——
  const slamAt = cueAt(c.cues, 0, 0.2);
  const panel = p(t, 0, 0.3);
  const chip = p(t, 0.08, 0.42);
  const chars = lines.map((l) => Array.from(l));
  const total = chars.reduce((n, l) => n + l.length, 0);
  const step = Math.min(0.05, 0.3 / Math.max(1, total));
  const markAt = cueAt(c.cues, 1, slamAt + total * step + 0.3);
  const mark = springAt(t, markAt, 0.62);
  const markVis = clamp((t - markAt) / 0.08);

  let k = 0;
  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        ...abs({ x: X, y: Y, w: W, h: H }), background: S.dark, borderRadius: 48, boxShadow: S.capsuleShadow,
        opacity: clamp(panel * 1.8), transform: `scale(${mix(0.9, 1, panel)})`,
      }} />
      {c.label && <div style={{
        ...abs({ x: textX, y: Y + PAD_Y, w: chipW, h: CHIP_H }), borderRadius: CHIP_H / 2, background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: panel,
        clipPath: `inset(0 ${100 * (1 - chip)}% 0 0 round ${CHIP_H / 2}px)`, transform: `translateX(${(1 - chip) * -18}px)`,
      }}>
        <span style={{ ...textBase(CHIP_FS, 900), color: S.ink }}>{c.label}</span>
      </div>}
      {lines.map((l, li) => {
        const last = li === lines.length - 1;
        // 每行一条“槽”：字从这一行的上沿砸进来（槽不越过上一行，避免叠字），槽底多留一点给过冲
        return <div key={li} style={{
          position: 'absolute', left: textX, top: textY + li * LH, height: LH + size * 0.12,
          width: lineW(li) + size * 0.4, overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, display: 'flex', alignItems: 'flex-start' }}>
            {chars[li].map((ch, i) => {
              const a = slamAt + (k++) * step;
              const d = overshoot(t, a, 0.24, 0.16, 0.07);
              return <span key={i} style={{
                ...textBase(size, 400, S.display), lineHeight: 1.14, color: '#fff', display: 'inline-block',
                opacity: t >= a ? 1 : 0, transform: `translateY(${(1 - d) * -LH * 0.85}px) scale(${mix(1.18, 1, clamp(d))})`,
                transformOrigin: '50% 100%',
              }}>{ch}</span>;
            })}
            {last && <span style={{
              ...textBase(size, 400, S.display), lineHeight: 1.14, color: accentOn(true), display: 'inline-block',
              width: MARK_W * size, textAlign: 'center', opacity: markVis,
              transform: `translateY(${(1 - mark) * size * 0.22}px) scale(${Math.max(0, mark)}) rotate(${(1 - mark) * -28}deg)`,
              transformOrigin: '50% 78%',
            }}>？</span>}
          </div>
        </div>;
      })}
    </Handoff>
    
    
  </Frame>;
}
