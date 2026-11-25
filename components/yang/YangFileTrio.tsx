// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T02h-FileTrio.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：几个必备文件（正版 T02h）——几个文件卡依次立起 → 每张翻面露出一句用途。
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

export type YangTrioFile = {
  name: string;          // 文件名（Source Code Pro）
  preview: string[];     // 正面露出的真实开头几行（1–4 行，退后的灰字）
  purpose: string;       // 翻面后的一句用途
  highlight?: string;    // purpose 里染紫的词
};

export type YangFileTrioProps = YangHandoffProps & {
  files: YangTrioFile[];     // 2–4 张
  cues?: number[];       // [i]=第 i 张翻面；不传用默认节奏
};

// 默认内容：114 期 S19。README.md / .gitignore 的开头取自原作者的 YangTalk 仓库真实文件；LICENSE 用 MIT 原文开头
export const yangFileTrioDefaults: YangFileTrioProps = {
  files: [
    { name: 'README.md', preview: ['# YangTalk', '用 Codex，把口播稿', '变成动态视频。'], purpose: '这是什么、怎么用', highlight: '怎么用' },
    { name: 'LICENSE', preview: ['MIT License', 'Copyright (c) 2026', 'Permission is hereby'], purpose: '别人能不能用、能不能改', highlight: '能不能改' },
    { name: '.gitignore', preview: ['node_modules/', '.env', 'media/'], purpose: '密码、密钥不要传上去', highlight: '不要传上去' },
  ],
};

const MONO_W = 0.6 / 0.58;

// 把一句话折成 n 行：在所有断法里挑“最长一行最短”的，标点后断行不罚分，其他位置断行罚 1.5 个字宽
// （优先按顿号、逗号自然断开；没有标点时再均分）。返回每行在原文里的起止下标，方便跨行染色。
function splitLines(text: string, lines: number): [number, number][] {
  const chars = Array.from(text);
  const n = chars.length;
  if (lines <= 1 || n < 2) return [[0, n]];
  const w = (a: number, b: number) => textWidth(chars.slice(a, b).join('').trim(), 1);
  const pen = (i: number) => /[，,、：:；;。 ]/.test(chars[i - 1]) ? 0
    : /[的时了和与就]/.test(chars[i - 1]) ? 0.8          // 虚词后面断，读起来顺
    : /[不的和与在把给让就都也还要能]/.test(chars[i]) ? 1.0 : 1.5;
  let best: [number, number][] = [[0, n]], bestCost = Infinity;
  const rec = (start: number, left: number, acc: [number, number][], maxW: number, cost: number) => {
    if (left === 1) {
      const m = Math.max(maxW, w(start, n));
      if (m + cost < bestCost) { bestCost = m + cost; best = [...acc, [start, n]]; }
      return;
    }
    for (let i = start + 1; i <= n - left + 1; i++) rec(i, left - 1, [...acc, [start, i]], Math.max(maxW, w(start, i)), cost + pen(i));
  };
  rec(0, lines, [], 0, 0);
  return best;
}

// 一行文字里，落在强调词范围内的字染紫（强调词被折到两行也能连续染色）
function LineText({ chars, from, to, hl, color }: { chars: string[]; from: number; to: number; hl: [number, number] | null; color: string }) {
  const seg = (a: number, b: number) => chars.slice(a, b).join('');
  if (!hl || hl[1] <= from || hl[0] >= to) return <>{seg(from, to).trim()}</>;
  const a = Math.max(from, hl[0]), b = Math.min(to, hl[1]);
  return <>{seg(from, a).trimStart()}<span style={{ color }}>{seg(a, b)}</span>{seg(b, to).trimEnd()}</>;
}

export function YangFileTrio(props: Partial<YangFileTrioProps>) {
  const c = { ...yangFileTrioDefaults, ...props };
  const t = useT();
  const files = (c.files.length ? c.files : yangFileTrioDefaults.files).slice(0, 4);
  const n = files.length;

  // —— 终态版式 ——
  const GAP = n >= 4 ? 48 : 64;
  const cardW = Math.min(500, (1660 - GAP * (n - 1)) / n);
  const cardH = Math.min(620, cardW * 1.3);
  const PAD = cardW * 0.1;
  const FOLD = cardW * 0.15;
  const x0 = 960 - (cardW * n + GAP * (n - 1)) / 2;
  const y0 = 556 - cardH / 2;
  const avail = cardW - PAD * 2;
  const nameSize = Math.min(54, ...files.map((f) => (avail - FOLD * 0.2) / Math.max(1, textWidth(f.name, 1) * MONO_W)));
  const prevSize = Math.min(34, avail / Math.max(1, ...files.flatMap((f) => f.preview.map((l) => textWidth(l, 1) * MONO_W))));
  // 用途：先试一行，太小就折成两三行；三张统一字号
  const layout = files.map((f) => {
    for (const k of [1, 2, 3]) {   // 一行放得下大字就一行，否则两行、三行
      const chars = Array.from(f.purpose);
      const ls = splitLines(f.purpose, k).map(([a, b]) => chars.slice(a, b).join('').trim());
      const size = Math.min(70, avail / Math.max(...ls.map((l) => textWidth(l, 1))));
      if (size >= 56 || k === 3) return { lines: ls, size };
    }
    return { lines: [f.purpose], size: 40 };
  });
  const purposeSize = Math.min(...layout.map((l) => l.size));

  // —— 时间 ——
  const standAt = (i: number) => i * 0.13;
  const flipAt = (i: number) => cueAt(c.cues, i, 1.45 + i * 1.05);
  const FLIP = 0.62;

  const shape = `polygon(0 0, ${cardW - FOLD}px 0, ${cardW}px ${FOLD}px, ${cardW}px ${cardH}px, 0 ${cardH}px)`;
  const fold = (dark: boolean) => <div style={{
    position: 'absolute', left: cardW - FOLD, top: 0, width: FOLD, height: FOLD,
    background: dark ? '#3a3a40' : '#e4e4e8', clipPath: 'polygon(0 0, 0 100%, 100% 100%)', borderBottomLeftRadius: FOLD * 0.18,
  }} />;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {files.map((f, i) => {
        const x = x0 + i * (cardW + GAP);
        const s = springAt(t, standAt(i), 0.78);             // 从平躺立起，轻回弹一次
        const vis = clamp((t - standAt(i)) / 0.12);
        const tilt = (1 - s) * 82;
        const v = q(t, flipAt(i), flipAt(i) + FLIP);          // 翻面进度
        const lift = Math.sin(Math.PI * v);
        const angle = 180 * v;
        const lay = layout[i];
        const ranges = splitLines(f.purpose, lay.lines.length);
        const chars = Array.from(f.purpose);
        const hlAt = f.highlight ? f.purpose.indexOf(f.highlight) : -1;
        const hl: [number, number] | null = hlAt >= 0 ? [Array.from(f.purpose.slice(0, hlAt)).length, Array.from(f.purpose.slice(0, hlAt)).length + Array.from(f.highlight as string).length] : null;
        const lines = ranges;
        const blockH = lines.length * purposeSize * 1.22;
        return <div key={i} style={{
          position: 'absolute', left: x, top: y0, width: cardW, height: cardH, perspective: 1800, opacity: vis,
          transform: `translateY(${-lift * 26}px) scale(${1 + 0.05 * lift})`,
        }}>
          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transformOrigin: '50% 100%', transform: `rotateX(${tilt}deg)` }}>
            <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${angle}deg)` }}>
              {/* 正面：白色文件 */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', filter: `drop-shadow(0 ${16 + lift * 14}px ${25 + lift * 10}px rgba(0,0,0,${0.1333 + lift * 0.05}))` }}>
                <div style={{ position: 'absolute', inset: 0, background: '#fff', clipPath: shape, borderRadius: 26 }}>
                  {fold(false)}
                  <div style={{ position: 'absolute', left: PAD, top: PAD * 1.05, right: FOLD + 8 }}>
                    {f.preview.slice(0, 4).map((l, j) => <div key={j} style={{ ...textBase(prevSize, 600, S.mono), lineHeight: 1.62, color: j === 0 ? S.muted : '#a3a3ab' }}>{l}</div>)}
                  </div>
                  <div style={{ position: 'absolute', left: PAD, right: PAD, bottom: PAD * 1.05, height: 3, background: '#ececef', transform: `translateY(${-nameSize * 1.7}px)` }} />
                  <div style={{ position: 'absolute', left: PAD, bottom: PAD * 0.95, ...textBase(nameSize, 600, S.mono), lineHeight: 1.16, color: S.ink }}>{f.name}</div>
                </div>
              </div>
              {/* 背面：黑卡，文件名 + 一句用途 */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', filter: `drop-shadow(30px 22px 25px rgba(0,0,0,${0.33 * clamp(v * 2 - 1)}))` }}>
                <div style={{ position: 'absolute', inset: 0, background: S.dark, clipPath: shape, borderRadius: 26 }}>
                  {fold(true)}
                  <div style={{ position: 'absolute', left: PAD, top: PAD * 1.05, ...textBase(Math.min(36, nameSize * 0.72), 600, S.mono), color: '#a3a3ab' }}>{f.name}</div>
                  <div style={{ position: 'absolute', left: PAD, right: PAD, top: (cardH - blockH) / 2 + cardH * 0.06 }}>
                    {lines.map((l, j) => <div key={j} style={{ ...textBase(purposeSize, 900), lineHeight: 1.22, color: '#fff' }}>
                      <LineText chars={chars} from={l[0]} to={l[1]} hl={hl} color={S.accentDark} />
                    </div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>;
      })}
    </Handoff>
    
    
  </Frame>;
}
