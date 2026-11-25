// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T09j-DeviceCode.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：验证码从一个窗口交给另一个（正版 T09j）——终端里出现一次性验证码 → 码飞进浏览器输入格逐格填好 → 授权成功。
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

export type YangDeviceCodeProps = YangHandoffProps & {
  command: string;        // 终端里打出的命令
  hint: string;           // 命令后的提示行
  code: string;           // 一次性示例码，如 A1B2-C3D4（4–10 位，可含一个 -）
  footer: string;         // 提示码之后的一行
  doneLine: string;       // 授权成功后终端落下的一行
  url: string;            // 浏览器地址栏
  pageTitle: string;      // 浏览器卡标题
  pageSub: string;        // 标题下的说明
  button: string;         // 按钮文字
  status: string;         // 授权成功后的状态
  cues?: number[];        // [0]=码从终端拎起 [1]=按下按钮
};

export const yangDeviceCodeDefaults: YangDeviceCodeProps = {
  command: 'gh auth login',
  hint: '! First copy your one-time code:',
  code: 'A1B2-C3D4',
  footer: 'Press Enter to open github.com',
  doneLine: '✓ Authentication complete',
  url: 'github.com/login/device',
  pageTitle: 'Device Activation',
  pageSub: 'Enter the code displayed on your device',
  button: 'Continue',
  status: '已授权',
};

const TERM = { x: 90, y: 170, w: 820, h: 680 };
const WEB = { x: 1000, y: 170, w: 830, h: 680 };
const BAR = 90;
const MONO_W = 0.6;   // Source Code Pro 字宽比

export function YangDeviceCode(props: Partial<YangDeviceCodeProps>) {
  const c = { ...yangDeviceCodeDefaults, ...props };
  const t = useT();
  const enter = p(t, 0, 0.5);

  const chars = Array.from(c.code.replace(/-/g, ''));
  const groupAt = c.code.includes('-') ? c.code.indexOf('-') : -1;   // 第一组位数
  const n = chars.length;

  const liftAt = cueAt(c.cues, 0, 2.1);
  const flyDur = 0.8;
  const fillAt = liftAt + flyDur;
  const STEP = 0.15;
  const fillEnd = fillAt + n * STEP;
  const pressAt = cueAt(c.cues, 1, fillEnd + 0.55);
  const authAt = pressAt + 0.35;

  // ---------- 终端 ----------
  const PAD = 50;
  const cmdSize = Math.min(44, (TERM.w - PAD * 2) / Math.max(1, textWidth('$ ' + c.command, 1) * MONO_W / 0.58 + 1));
  const lineSize = (s: string) => Math.min(34, (TERM.w - PAD * 2) / Math.max(1, Array.from(s).length * MONO_W));
  const codeSize = Math.min(78, (TERM.w - PAD * 2 - 60) / Math.max(1, Array.from(c.code).length * MONO_W));
  const typeEnd = 0.35 + Array.from(c.command).length * 0.07;
  const hintAt = typeEnd + 0.2, hintEnd = hintAt + Math.min(0.5, Array.from(c.hint).length * 0.016);
  const codeAt = hintEnd + 0.15;
  const codeIn = springAt(t, codeAt, 0.5);
  const footerIn = p(t, codeAt + 0.3, codeAt + 0.7);
  const doneAt = authAt + 0.25;
  const doneIn = p(t, doneAt, doneAt + 0.5);

  const codeLineY = TERM.y + BAR + 250;                // 码文字行顶
  const codeW = Array.from(c.code).length * codeSize * MONO_W;
  const capsuleFrom = { x: TERM.x + PAD - 28, y: codeLineY - 18, w: codeW + 56, h: codeSize * 1.16 + 36 };

  // ---------- 浏览器 ----------
  const CELL_H = 96, GROUP_GAP = 38, CGAP = 10;
  const usable = WEB.w - 130;
  const gapsTotal = (n - 1) * CGAP + (groupAt > 0 && groupAt < n ? GROUP_GAP - CGAP : 0);
  const CELL_W = Math.min(84, (usable - gapsTotal) / n);
  const rowW = n * CELL_W + gapsTotal;
  const rowX = WEB.x + (WEB.w - rowW) / 2;
  const rowY = WEB.y + BAR + 300;
  const cellX = (i: number) => rowX + i * (CELL_W + CGAP) + (groupAt > 0 && i >= groupAt ? GROUP_GAP - CGAP : 0);
  const cellFont = Math.min(60, CELL_W * 0.78);

  // 胶囊：原位 → 飞到输入格上方 → 一个字符落一格 → 空胶囊淡出
  const fly = q(t, liftAt, fillAt);
  const hover: { x: number; y: number; w: number; h: number } = (() => {
    const w = codeW * 0.78 + 56 * 0.78, h = capsuleFrom.h * 0.78;
    return { x: rowX + rowW / 2 - w / 2, y: rowY - h - 36, w, h };
  })();
  const box = between(capsuleFrom, hover, fly);
  const arc = -60 * Math.sin(Math.PI * fly);
  const capScale = box.w / capsuleFrom.w;
  const capAlpha = clamp((t - liftAt) * 12) * (1 - q(t, fillEnd - 0.05, fillEnd + 0.3));
  const dropped = (i: number) => p(t, fillAt + i * STEP, fillAt + i * STEP + 0.3);
  const lifted = p(t, liftAt - 0.02, liftAt + 0.15);   // 终端里的码文字让位给胶囊

  // 按钮 → 状态胶囊（同一个对象变形）
  const BTN = { w: 540, h: 96 };
  const btnX = WEB.x + (WEB.w - BTN.w) / 2, btnY = WEB.y + BAR + 450;
  const auth = q(t, authAt, authAt + 0.55);
  const statusSize = Math.min(48, 300 / Math.max(1, textWidth(c.status, 1)));
  const stW = textWidth(c.status, statusSize) + statusSize * 2.4 + 50;
  const bw = mix(BTN.w, stW, auth);
  const bump = 1 + 0.07 * Math.sin(Math.PI * clamp((t - authAt - 0.3) / 0.4));
  const press = clamp(1 - Math.abs(t - pressAt - 0.06) / 0.1);
  const check = p(t, authAt + 0.3, authAt + 0.7);
  const btnIn = p(t, 0.3, 0.8);

  // 光标
  const target = { x: btnX + BTN.w * 0.62, y: btnY + BTN.h * 0.62 };
  const g = p(t, pressAt - 1.0, pressAt - 0.08);
  const cx = mix(1560, target.x, g), cy = mix(960, target.y, g);
  const cursorA = clamp((t - (pressAt - 1.0)) * 6) * (1 - q(t, authAt + 0.1, authAt + 0.4));

  const mono = (size: number, color: string): React.CSSProperties => ({ ...textBase(size, 600, S.mono), color, letterSpacing: 0, whiteSpace: 'pre' });

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 终端 */}
      <MacWindow box={{ ...TERM, y: TERM.y + (1 - enter) * 40 }} bar={BAR} style={{ opacity: enter }} title="zsh">
        <div style={{ position: 'absolute', left: PAD, top: 52, ...mono(cmdSize, '#fff') }}>
          <span style={{ color: S.accentDark }}>$ </span>{typed(c.command, t, 0.35, typeEnd)}
          {t < typeEnd + 0.1 && <span style={{ display: 'inline-block', width: cmdSize * 0.5, height: cmdSize * 0.95, background: '#fff', verticalAlign: 'text-bottom', marginLeft: 4, opacity: Math.floor(t * 3) % 2 }} />}
        </div>
        <div style={{ position: 'absolute', left: PAD, top: 160, ...mono(lineSize(c.hint), '#c9c9cf') }}>{typed(c.hint, t, hintAt, hintEnd)}</div>
        <div style={{ position: 'absolute', left: PAD, top: 250, ...mono(codeSize, S.accentDark), opacity: codeIn * (1 - lifted * 0.65), transform: `scale(${mix(0.9, 1, codeIn)})`, transformOrigin: '0 50%' }}>{c.code}</div>
        <div style={{ position: 'absolute', left: PAD, top: 400, ...mono(lineSize(c.footer), '#c9c9cf'), opacity: footerIn }}>{c.footer}</div>
        <div style={{ position: 'absolute', left: PAD, top: 480, ...mono(lineSize(c.doneLine), S.accentDark), opacity: doneIn, transform: `translateY(${(1 - doneIn) * 14}px)` }}>{c.doneLine}</div>
      </MacWindow>

      {/* 浏览器卡：干净重建 */}
      <MacWindow light box={{ ...WEB, y: WEB.y + (1 - enter) * 40 }} bar={BAR} style={{ opacity: enter }} title={c.url.length > 34 ? c.url.slice(0, 33) + '…' : c.url}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', ...textBase(Math.min(62, (WEB.w - 100) / Math.max(1, textWidth(c.pageTitle, 1) * 1.1)), 900), color: S.ink }}>{c.pageTitle}</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 122, textAlign: 'center', ...textBase(Math.min(32, (WEB.w - 100) / Math.max(1, textWidth(c.pageSub, 1) * 1.1)), 500), color: S.muted }}>{c.pageSub}</div>
      </MacWindow>

      {/* 输入格 */}
      {chars.map((ch, i) => {
        const d = dropped(i);
        const active = t >= fillAt + i * STEP - 0.02 && t < fillAt + (i + 1) * STEP - 0.02 ? 1 : 0;
        const y = rowY + (1 - enter) * 40;
        return <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: cellX(i), top: y, width: CELL_W, height: CELL_H, borderRadius: 16, background: '#f2f2f5', opacity: enter, ...center }}>
            <span style={{ ...textBase(cellFont, 600, S.mono), color: S.ink, opacity: d, transform: `translateY(${(1 - d) * -50}px) scale(${mix(1.25, 1, d)})` }}>{ch}</span>
          </div>
          <div style={{ position: 'absolute', left: cellX(i) + 8, top: y + CELL_H - 6, width: CELL_W - 16, height: 6, borderRadius: 3, background: accentOn(false), opacity: active * enter }} />
        </React.Fragment>;
      })}

      {/* 按钮 → 已授权 */}
      <div style={{
        position: 'absolute', left: btnX + (BTN.w - bw) / 2, top: btnY + (1 - btnIn) * 20, width: bw, height: BTN.h, borderRadius: BTN.h / 2, background: S.dark, boxShadow: S.capsuleShadow,
        opacity: btnIn * enter, transform: `scale(${(1 - 0.04 * press) * bump})`, overflow: 'hidden', zIndex: 20,
      }}>
        <div style={{ position: 'absolute', inset: 0, ...center, opacity: 1 - clamp(auth * 2.5) }}>
          <span style={{ ...textBase(42, 900), color: '#fff' }}>{c.button}</span></div>
        <div style={{ position: 'absolute', inset: 0, ...center, gap: 18, opacity: clamp((auth - 0.45) * 2.2), transform: `translateY(${(1 - clamp((auth - 0.45) * 2.2)) * 14}px)` }}>
          <svg width={statusSize * 0.95} height={statusSize * 0.95} viewBox="0 0 24 24">
            <path d="M4 12.5 L9.5 18 L20 6.5" fill="none" stroke={S.accentDark} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={26} strokeDashoffset={26 * (1 - check)} />
          </svg>
          <span style={{ ...textBase(statusSize, 900), color: S.accentDark }}>{c.status}</span>
        </div>
      </div>

      {/* 码胶囊：从终端原位拎起，飞到输入格上方，字符逐个落进格里 */}
      {capAlpha > 0.001 && <div style={{
        position: 'absolute', left: box.x, top: box.y + arc, width: capsuleFrom.w, height: capsuleFrom.h, transform: `scale(${box.w / capsuleFrom.w})`, transformOrigin: '0 0',
        borderRadius: capsuleFrom.h / 2, background: '#fff', boxShadow: S.capsuleShadow, opacity: capAlpha, zIndex: 40, ...center,
      }}>
        <div style={{ display: 'flex', ...mono(codeSize, S.ink) }}>
          {(() => { let k = 0; return Array.from(c.code).map((ch, idx) => {
            const isDash = ch === '-';
            const o = isDash ? 1 - dropped(Math.max(0, k - 1)) * 0 : 1 - dropped(k++);
            return <span key={idx} style={{ opacity: isDash ? 1 : o, width: codeSize * MONO_W, textAlign: 'center' }}>{ch}</span>;
          }); })()}
        </div>
      </div>}

      <ClickRing x={target.x} y={target.y} t={t} at={pressAt} dark={false} />
      {cursorA > 0 && <Cursor x={cx - 6} y={cy - 4} scale={1.1} press={press} style={{ opacity: cursorA }} />}
    </Handoff>
    
    
    
    
  </Frame>;
}
