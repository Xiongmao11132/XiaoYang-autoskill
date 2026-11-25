// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T05i-UnboxResult.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：打开下载包看到什么（正版 T05i）——两个下载包打开 → 一个直接是能用的软件，一个是一堆代码文件。
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

export type YangUnboxResultProps = YangHandoffProps & {
  appPack: string;        // 左边下载包的文件名
  codePack: string;       // 右边下载包的文件名
  appName: string;        // 弹出的 App 名
  appIcon?: string;       // public/ 下的真实 App 图标；不给就只显示名字
  appLabel: string;       // 左边胶囊
  files: string[];        // 右边涌出的文件名（文件夹以 / 结尾），2–9 个
  codeLabel: string;      // 右边胶囊
  conclusion: string;     // 最后的结论
  highlight: string;      // conclusion 里染紫的词
  cues?: number[];        // [0]=两个包打开 [1]=结论出现
};

export const yangUnboxResultDefaults: YangUnboxResultProps = {
  appPack: 'LosslessCut-mac-arm64.dmg',
  codePack: 'YangTalk-main.zip',
  appName: 'LosslessCut',
  appIcon: '',
  appLabel: '双击就能用',
  files: ['apps/', 'components/', 'docs/', 'scripts/', 'skills/', 'tests/', 'PLAN.md', 'README.md'],
  codeLabel: '要先跑起来',
  conclusion: '不是下错了，是要先跑起来',
  highlight: '要先跑起来',
};

const TOP = 160;
const BAR = 88;           // 标题栏（文件名条）高
const GAP = 110;
const mono = (s: string, f: number) => Array.from(s).reduce((w, ch) => w + (/[\u0000-ÿ]/.test(ch) ? 0.6 : 1.0) * f, 0);
const dUnits = (s: string) => Array.from(s).reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.68 : /[\u0000-ÿ]/.test(ch) ? 0.6 : 1), 0);

function DisplayText({ text, size, color, hl }: { text: string; size: number; color: string; hl?: string }) {
  const i = hl ? text.indexOf(hl) : -1;
  const segs = i < 0 ? [{ s: text, c: color }] : [{ s: text.slice(0, i), c: color }, { s: hl!, c: accentOn(true) }, { s: text.slice(i + hl!.length), c: color }];
  return <span style={{ ...textBase(size, 400, S.display), lineHeight: 1 }}>
    {segs.map((g, k) => (g.s.match(/[\u0000-ÿ]+|[^\u0000-ÿ]+/g) ?? []).map((r, j) => /^[\u0000-ÿ]+$/.test(r)
      ? <span key={`${k}-${j}`} style={{ fontFamily: S.body, fontWeight: 900, color: g.c }}>{r}</span>
      : <span key={`${k}-${j}`} style={{ color: g.c }}>{r}</span>))}
  </span>;
}

export function YangUnboxResult(props: Partial<YangUnboxResultProps>) {
  const c = { ...yangUnboxResultDefaults, ...props };
  const t = useT();
  const files = c.files.slice(0, 9);

  // —— 版式 ——
  const PW = 620;
  const LX = 960 - GAP / 2 - PW, RX = 960 + GAP / 2;
  const nameSize = Math.min(32, ...[c.appPack, c.codePack].map((s) => (PW - 80) / Math.max(1, mono(s, 1))));
  const rowSize = Math.min(34, (PW - 140) / Math.max(1, ...files.map((f) => mono(f, 1))));
  const rowH = Math.round(Math.min(56, 440 / Math.max(1, files.length)));
  const bodyH = Math.max(380, files.length * rowH + 56);
  const PH = BAR + bodyH;
  const pillSize = Math.min(48, ...[c.appLabel, c.codeLabel].map((s) => (PW - 60) / Math.max(1, dUnits(s) + 1.5)));
  const pillH = Math.round(pillSize * 1.8);
  const pillY = TOP + PH + 32;
  const iconD = Math.min(230, bodyH - 150);
  const appNameSize = Math.min(48, (PW - 80) / Math.max(1, textWidth(c.appName, 1)));

  // —— 时间线 ——
  const enter = p(t, 0, 0.4);
  const openAt = cueAt(c.cues, 0, 0.6);
  const openL = q(t, openAt, openAt + 0.55);
  const openR = q(t, openAt + 0.12, openAt + 0.67);
  const iconPop = springAt(t, openAt + 0.4, 0.6);
  const rowAt = (i: number) => openAt + 0.45 + i * 0.065;
  const pillL = p(t, openAt + 0.95, openAt + 1.3);
  const pillR = p(t, rowAt(files.length - 1) + 0.3, rowAt(files.length - 1) + 0.65);
  const conAt = cueAt(c.cues, 1, Math.max(openAt + 2.3, rowAt(files.length - 1) + 1.4));
  const recede = q(t, conAt, conAt + 0.5);
  const con = p(t, conAt + 0.05, conAt + 0.55) * 1.04 - 0.04 * q(t, conAt + 0.55, conAt + 0.85);

  const cSize = Math.min(76, 1500 / Math.max(1, dUnits(c.conclusion)));
  const cH = Math.round(cSize * 1.9), cW = dUnits(c.conclusion) * cSize + cSize * 1.8;
  const cY = TOP + PH / 2 - cH / 2 + 40;

  const TitleBar = ({ name }: { name: string }) => {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : '';
    return <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: BAR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ ...textBase(nameSize, 600, S.mono), color: S.muted }}>{base}</span>
      <span style={{ ...textBase(nameSize, 600, S.mono), color: S.ink }}>{ext}</span>
    </div>;
  };
  const panel = (x: number, open: number, body: React.ReactNode, name: string) => {
    const h = BAR + bodyH * open;
    const y = mix(540 - BAR / 2 - 30, TOP, open);   // 文件名条先在画面中部，展开时一边上移一边向下长出内容
    return <Surface box={{ x, y: y + (1 - enter) * 30, w: PW, h }} style={{ opacity: enter }}>
      <TitleBar name={name} />
      <div style={{ position: 'absolute', left: 24, right: 24, top: BAR - 1, height: 2, background: S.ink, opacity: 0.08 * open }} />
      <div style={{ position: 'absolute', left: 0, top: BAR, width: PW, height: bodyH }}>{body}</div>
    </Surface>;
  };

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 材料：两个打开的下载包（结论出现时退后） */}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '960px 500px', transform: `scale(${mix(1, 0.95, recede)})`, filter: recede > 0.01 ? `blur(${7 * recede}px)` : undefined }}>
        {panel(LX, openL, <>
          {c.appIcon && <ImgFill src={c.appIcon} style={{
            position: 'absolute', left: PW / 2 - iconD / 2, top: (bodyH - iconD - appNameSize * 1.5) / 2 + (1 - clamp(iconPop)) * 60,
            width: iconD, height: iconD, transform: `scale(${mix(0.3, 1, iconPop)})`, opacity: clamp((t - openAt - 0.4) / 0.1), filter: 'drop-shadow(0 14px 18px #0003)',
          }} />}
          <div style={{ position: 'absolute', left: 0, right: 0, top: c.appIcon ? (bodyH - iconD - appNameSize * 1.5) / 2 + iconD + 14 : bodyH / 2 - appNameSize * 0.6, textAlign: 'center',
            ...textBase(appNameSize, 900), color: S.ink, opacity: p(t, openAt + 0.6, openAt + 0.95) }}>{c.appName}</div>
        </>, c.appPack)}
        {panel(RX, openR, <>
          {files.map((f, i) => {
            const e = p(t, rowAt(i), rowAt(i) + 0.3);
            const folder = f.endsWith('/');
            return <div key={i} style={{
              position: 'absolute', left: 50, right: 50, top: 28 + i * rowH, height: rowH, display: 'flex', alignItems: 'center',
              opacity: e, transform: `translateY(${(1 - e) * -18}px)`, borderBottom: i < files.length - 1 ? '2px solid rgba(25,25,28,0.06)' : undefined,
            }}>
              <span style={{ ...textBase(rowSize, 600, S.mono), color: folder ? S.ink : '#3a3a40' }}>{f}</span>
            </div>;
          })}
        </>, c.codePack)}
        {/* 两边的判断：黑胶囊 */}
        {[{ x: LX, label: c.appLabel, e: pillL }, { x: RX, label: c.codeLabel, e: pillR }].map((it, i) => {
          if (it.e <= 0) return null;
          const w = dUnits(it.label) * pillSize + pillSize * 1.5;
          return <Pill key={i} box={{ x: it.x + PW / 2 - w / 2, y: pillY + (1 - it.e) * 16, w, h: pillH }} style={{ clipPath: `inset(0 ${50 * (1 - it.e)}% 0 ${50 * (1 - it.e)}% round ${pillH / 2}px)` }}>
            <DisplayText text={it.label} size={pillSize} color="#fff" />
          </Pill>;
        })}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.62 * recede }} />

      {/* 结论：前景横向展开 */}
      {con > 0 && <Pill box={{ x: 960 - (cW * con) / 2, y: cY, w: cW * con, h: cH }} style={{ overflow: 'hidden' }}>
        <div style={{ opacity: clamp((t - conAt - 0.22) / 0.25), whiteSpace: 'nowrap', minWidth: cW - cSize * 1.8, textAlign: 'center' }}>
          <DisplayText text={c.conclusion} size={cSize} color="#fff" hl={c.highlight} />
        </div>
      </Pill>}
    </Handoff>
    
    
    
    
  </Frame>;
}
