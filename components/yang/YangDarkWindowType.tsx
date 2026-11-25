// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T01g-DarkWindowType.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：黑窗打字（正版 T01g，升级自 X019）：背景界面先看清、随后失焦白蒙退后 → 深色 Mac 窗从右侧滑入 →
// 大标题逐字打出 → 规则 1–4 行逐行打出，实心块光标停在当前行末；一行里一处关键词染紫。窗口宽高按文字自适应。
// 与近名件区别：YangTermDefine（正版 T01b）是术语卡＋释义卡；本件是「真实界面背景＋黑窗逐行打规则」，不是重复集成。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成（版式仍按原版避开右上角标区）；kit 的 p/q/cueAt/textWidth 与 Frame/Handoff/MacWindow/Media
// 已内嵌移植，逻辑与原版一致；background 走 props（宿主 public 路径），原包默认的原版界面截图已置空——
// 空串时 Media 渲染中性骨架占位。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', windowBody: '#212123', windowBar: '#161618', faint: '#a3a3ab', muted: '#6c6c72',
  accent: '#8554E8', accentDark: '#D6BEFF', radius: 24, capsuleShadow: '30px 22px 25px #0005',
  shadow: '0 16px 25px 0 rgba(0,0,0,0.1333)', textShadowDark: '8px 9px 5px #000',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, v: number) => a + (b - a) * v;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const q = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * (3 - 2 * v); };
const cueAt = (cues: readonly number[] | undefined, i: number, fb: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fb;
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
const accentOn = (dark: boolean) => (dark ? '#D6BEFF' : '#8554E8');
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900): React.CSSProperties => ({
  fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
type Box = { x: number; y: number; w: number; h: number };
function Frame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const { width } = useVideoConfig();
  return <AbsoluteFill style={{
    background: dark ? S.dark : '#fff', overflow: 'hidden', fontFamily: FONT,
    fontWeight: 500, fontSynthesis: 'none', color: dark ? '#fff' : S.ink,
  }}>
    <div style={{ position: 'absolute', width: 1920, height: 1080, transform: `scale(${width / 1920})`, transformOrigin: '0 0', overflow: 'hidden' }}>
      {children}
    </div>
  </AbsoluteFill>;
}
export type YangEnter = 'cut' | 'fade' | 'rise' | 'grow';
export type YangExit = 'none' | 'recede' | 'fade' | 'cut' | 'slide-left' | 'slide-up';
export type YangHandoffProps = { enter?: YangEnter; exit?: YangExit; exitAt?: number };
function Handoff({ enter = 'cut', exit = 'none', enterAt = 0, enterDur = 0.45, exitAt, exitDur = 0.5, children }: {
  enter?: YangEnter; exit?: YangExit; enterAt?: number; enterDur?: number; exitAt?: number; exitDur?: number; children: React.ReactNode;
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
const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
function Media({ src, start = 0, box, radius = 0, style }: { src?: string; start?: number; box: Box; radius?: number; style?: React.CSSProperties }) {
  const { fps } = useVideoConfig();
  if (!src) return <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: radius, background: 'linear-gradient(135deg,#ededf1,#dcdce2)', overflow: 'hidden', ...style }}>
    <div style={{ position: 'absolute', inset: Math.max(10, Math.min(18, box.h * 0.08)), border: '3px dashed #b9b9c0', borderRadius: Math.max(8, radius - 6) }} />
  </div>;
  const common: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: radius, overflow: 'hidden', background: '#fff', ...style }}>
    {IMG_EXT.test(src)
      ? <Img src={staticFile(src)} style={common} />
      : <OffthreadVideo muted src={staticFile(src)} startFrom={Math.round(start * fps)} style={common} />}
  </div>;
}
function MacWindow({ box, bar = 90, children }: { box: Box; bar?: number; children?: React.ReactNode }) {
  return <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 36, background: S.windowBody, boxShadow: S.shadow, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: box.w, height: bar, background: S.windowBar }}>
      <div style={{ position: 'absolute', left: 36, top: (bar - 26) / 2, display: 'flex', gap: 14 }}>
        {['#8554E8', '#aaa', '#eee'].map((col, i) => <div key={i} style={{ width: 26, height: 26, borderRadius: 13, background: col }} />)}
      </div>
    </div>
    <div style={{ position: 'absolute', left: 0, top: bar, width: box.w, height: box.h - bar }}>{children}</div>
  </div>;
}

export type YangDarkWindowTypeProps = YangHandoffProps & {
  title: string;        // 黑窗大标题（可留空）
  lines: string[];      // 规则 1–4 行
  highlight: string;    // 某一行里染紫的一处关键词（深底 #D6BEFF）；留空不染
  background: string;   // 退后的真实界面截图（宿主 public 路径）；空串 = 中性骨架占位
  cues?: number[];      // [0]=黑窗进入，[1]=标题开始打，[2..]=第 1..n 行开始打
};

export const yangDarkWindowTypeDefaults: YangDarkWindowTypeProps = {
  title: '使用规则',
  lines: ['先确认需求，再开始动手', '做完一步就存一次档', '交付之前自己先检查一遍'],
  highlight: '存一次档',
  background: '',
};

const BAR = 90;
const MAX_W = 1500, MIN_W = 1100;
const BRAND_SAFE_TOP = 150;

function Caret({ h, w }: { h: number; w: number }) {
  return <span style={{ position: 'relative', display: 'inline-block', width: 0, height: '1em', verticalAlign: 'baseline' }}>
    <span style={{ position: 'absolute', left: w * 0.12, top: '50%', width: w, height: h, transform: 'translateY(-50%)', background: S.faint }} />
  </span>;
}

export const YangDarkWindowType: React.FC<Partial<YangDarkWindowTypeProps>> = (props) => {
  const c = { ...yangDarkWindowTypeDefaults, ...props };
  const t = useT();
  const lines = c.lines.slice(0, 4);
  const n = lines.length;
  const hasTitle = c.title.trim().length > 0;

  const padX = 110;
  const maxUnits = Math.max(1, ...lines.map((l) => textWidth(l, 1)));
  let L = Math.min(n <= 2 ? 96 : 84, (MAX_W - padX * 2) / maxUnits);
  let T = Math.min(180, (MAX_W - padX * 2) * 0.9 / Math.max(1, textWidth(c.title, 1)));
  const pitchK = 1.9, gapK = 0.3;
  const padY = 70;
  const natural = (tt: number, ll: number) => padY * 2 + (hasTitle ? tt * 1.04 + tt * gapK : 0) + (n - 1) * ll * pitchK + ll * 1.2;
  const bodyMax = 1080 - BRAND_SAFE_TOP - 26 - BAR;
  const k = Math.min(1, (bodyMax - padY * 2) / (natural(T, L) - padY * 2));
  T *= k; L *= k;
  const bodyH = natural(T, L);
  const W = clamp(Math.max(textWidth(c.title, T), maxUnits * L) + padX * 2, MIN_W, MAX_W);
  const H = BAR + bodyH;
  const X = (1920 - W) / 2;
  const reachesBrand = X + W > 1540;
  const Y = reachesBrand ? Math.max(BRAND_SAFE_TOP, (1080 - H) / 2) : (1080 - H) / 2;

  const a0 = cueAt(c.cues, 0, 0.1);
  const recede = q(t, a0 - 0.05, a0 + 0.55);
  const slide = p(t, a0, a0 + 0.7);
  const titleN = Array.from(c.title).length;
  const titleAt = cueAt(c.cues, 1, a0 + 0.78);
  const titleEnd = hasTitle ? titleAt + Math.min(titleN * (10 / 60), 0.9) : titleAt;
  const lineStart0 = hasTitle ? titleEnd + 0.12 : titleAt;
  const counts = lines.map((l) => Array.from(l).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const budget = Math.max(0.8, 5.2 - lineStart0 - 0.12 * (n - 1));
  const perChar = Math.max(2.5 / 60, Math.min(6.5 / 60, budget / Math.max(1, total)));
  const starts: number[] = [];
  const ends: number[] = [];
  let cursor = lineStart0;
  lines.forEach((_, i) => {
    const s0 = cueAt(c.cues, 2 + i, cursor);
    starts.push(s0);
    ends.push(s0 + counts[i] * perChar);
    cursor = ends[i] + 0.12;
  });

  const shown = (len: number, a: number, b: number) => Math.floor(clamp((t - a) / Math.max(0.001, b - a)) * len);
  const hlLine = c.highlight ? lines.findIndex((l) => l.includes(c.highlight)) : -1;

  const renderRow = (text: string, size: number, a: number, b: number, caretUntil: number, mark: boolean, isTitle: boolean) => {
    const arr = Array.from(text);
    const k2 = shown(arr.length, a, b);
    const hlFrom = mark ? Array.from(text.slice(0, text.indexOf(c.highlight))).length : -1;
    const hlTo = mark ? hlFrom + Array.from(c.highlight).length : -1;
    const caretOn = t >= a && t < caretUntil;
    return <div style={{ ...textBase(size, 400), lineHeight: 1, color: '#fff', textAlign: 'center', textShadow: S.textShadowDark, whiteSpace: 'nowrap' }}>
      {arr.map((ch, i) => <React.Fragment key={i}>
        {caretOn && i === k2 && <Caret h={size * (isTitle ? 1.02 : 1.38)} w={size * (isTitle ? 0.34 : 0.7)} />}
        <span style={{ opacity: i < k2 ? 1 : 0, color: i >= hlFrom && i < hlTo ? accentOn(true) : '#fff' }}>{ch}</span>
      </React.Fragment>)}
      {caretOn && k2 >= arr.length && <Caret h={size * (isTitle ? 1.02 : 1.38)} w={size * (isTitle ? 0.34 : 0.7)} />}
    </div>;
  };

  const lastCaret = ends.length ? ends[n - 1] + 14 / 60 : titleEnd + 14 / 60;
  return <Frame>
    <div style={{ position: 'absolute', inset: 0, filter: `blur(${recede * 16}px)`, transform: `scale(${mix(1, 1.04, recede)})` }}>
      <Media src={c.background} box={{ x: 0, y: 0, w: 1920, h: 1080 }} radius={0} />
    </div>
    <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.74 * recede }} />
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <MacWindow box={{ x: mix(1920 + 40, X, slide), y: Y, w: W, h: H }} bar={BAR}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: padY, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {hasTitle && <div style={{ height: T * 1.04 + T * gapK }}>
            {renderRow(c.title, T, titleAt, titleEnd, n ? starts[0] : lastCaret, false, true)}
          </div>}
          {lines.map((l, i) => <div key={i} style={{ height: i < n - 1 ? L * pitchK : L * 1.2, display: 'flex', alignItems: 'flex-start' }}>
            {renderRow(l, L, starts[i], ends[i], i < n - 1 ? starts[i + 1] : lastCaret, i === hlLine, false)}
          </div>)}
        </div>
      </MacWindow>
    </Handoff>
  </Frame>;
};
