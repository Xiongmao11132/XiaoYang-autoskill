// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T09d-TaskRunStatus.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-native-16-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-native-16-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：发任务看运行（正版 T09d）。
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

export type YangTaskRunStatusProps = {
  image: string;                       // 背景真实界面截图
  imageSize: { w: number; h: number };
  inputBox: { x: number; y: number; w: number; h: number }; // 截图里输入框位置（源像素）——提起的起点
  placeholder: string;
  prompt: string;
  steps: string[];                     // 2–5 条
  runningLabel: string;
  doneLabel: string;
};

export const yangTaskRunStatusDefaults: YangTaskRunStatusProps = {
  image: '',
  imageSize: { w: 3024, h: 1712 },
  inputBox: { x: 1066, y: 1476, w: 1471, h: 196 },
  placeholder: '随心输入',
  prompt: '把这期口播整理成分镜和字幕',
  steps: ['读取逐字稿和录音', '按句切分镜头', '生成字幕并对齐时间'],
  runningLabel: '运行中',
  doneLabel: '完成',
};

const FULL: Box = { x: 60, y: 33.222106, w: 1800, h: 1013.555787 };
const CARD_W = 1400, CARD_H = 216, CARD_X = 260;
const AREA_TOP = 140, AREA_BOTTOM = 1030, CARD_GAP = 64;

function SendButton({ size, press }: { size: number; press: number }) {
  return <div style={{
    width: size, height: size, borderRadius: size / 2, background: S.dark, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transform: `scale(${1 - 0.12 * press})`,
  }}>
    <svg width={size * 0.44} height={size * 0.44} viewBox="0 0 24 24">
      <path d="M12 20 V5 M5.5 11 L12 4.5 L18.5 11" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>;
}

export function YangTaskRunStatus(props: Partial<YangTaskRunStatusProps>) {
  const c = { ...yangTaskRunStatusDefaults, ...props };
  const steps = (c.steps.length ? c.steps : yangTaskRunStatusDefaults.steps).slice(0, 5);
  const t = useT();

  // 时间轴：背景退后 + 输入框提起 → 打字 → 发送 → 步骤按节奏接入/完成
  const recede = q(t, 0.12, 0.8);
  const lift = p(t, 0.22, 0.95);
  const chars = Array.from(c.prompt).length;
  const typeStart = 0.95, typeEnd = typeStart + Math.min(1.15, chars * 0.07);
  const sendAt = typeEnd + 0.22;
  const RUN = 0.75, lastDone = 4.3;
  const firstAppear = sendAt + 0.25;
  const gap = steps.length > 1 ? Math.max(0.3, (lastDone - RUN - firstAppear) / (steps.length - 1)) : 0;
  const appearAt = (i: number) => firstAppear + i * gap;
  const doneAt = (i: number) => appearAt(i) + RUN;

  // 步骤行尺寸随条数自适应；输入框＋步骤整组在角标下方的区域内垂直居中
  const n = steps.length;
  const rowGap = n > 3 ? 22 : 30;
  const rowH = Math.min(128, (AREA_BOTTOM - AREA_TOP - CARD_H - CARD_GAP - rowGap * (n - 1)) / n);
  const groupH = CARD_H + CARD_GAP + n * rowH + (n - 1) * rowGap;
  const CARD: Box = { x: CARD_X, y: AREA_TOP + (AREA_BOTTOM - AREA_TOP - groupH) / 2, w: CARD_W, h: CARD_H };
  const ROWS_TOP = CARD.y + CARD_H + CARD_GAP;
  // 输入框：从截图原位（统一缩放）提到上方
  const k = Math.max(FULL.w / c.imageSize.w, FULL.h / c.imageSize.h);
  const ox = FULL.x + (FULL.w - c.imageSize.w * k) / 2, oy = FULL.y + (FULL.h - c.imageSize.h * k) / 2;
  const origin = { x: ox + c.inputBox.x * k, y: oy + c.inputBox.y * k, w: c.inputBox.w * k, h: c.inputBox.h * k };
  const s0 = origin.w / CARD.w;
  const sc = mix(s0, 1, lift);
  const tx = mix(origin.x, CARD.x, lift), ty = mix(origin.y + (origin.h - CARD.h * s0) / 2, CARD.y, lift);
  const pressSend = clamp(1 - Math.abs(t - sendAt - 0.05) / 0.1);

  // 输入文字自适应：单行放不下就缩字号
  const PROMPT_W = CARD_W - 64 - 180;
  const promptSize = Math.min(56, PROMPT_W / Math.max(1, textWidth(c.prompt, 1)));
  const shown = typed(c.prompt, t, typeStart, typeEnd);
  const caretOn = t >= typeStart - 0.3 && t < sendAt;

  const statusW = Math.max(textWidth(c.runningLabel, rowH * 0.36), textWidth(c.doneLabel, rowH * 0.42)) + 40;
  const labelMax = CARD.w - rowH * 0.6 - statusW - 60;
  const longest = steps.reduce((m, s) => Math.max(m, textWidth(s, 1)), 1);
  const labelSize = Math.min(rowH * 0.42, labelMax / longest);

  return <Frame>
    {/* 真实界面：失焦 + 白蒙退后，作为“在哪里发任务”的上下文 */}
    <div style={{
      position: 'absolute', left: FULL.x, top: FULL.y, width: FULL.w, height: FULL.h, borderRadius: S.radius, overflow: 'hidden', boxShadow: S.shadow,
      transform: `scale(${mix(1, 1.04, recede)})`,
    }}>
      <ImgFill src={c.image} style={{ position: 'absolute', left: ox - FULL.x, top: oy - FULL.y, width: c.imageSize.w * k, height: c.imageSize.h * k, filter: `blur(${16 * recede}px)` }} />
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.6 * recede }} />
    </div>

    {/* 提起的输入框（白卡、软阴影随提起加深） */}
    <div style={{
      position: 'absolute', left: 0, top: 0, width: CARD.w, height: CARD.h, borderRadius: 36, background: '#fff',
      boxShadow: `0 ${mix(2, 22, lift)}px ${mix(8, 44, lift)}px rgba(0,0,0,${mix(0.04, 0.16, lift)})`,
      transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${sc})`, zIndex: 50,
    }}>
      <div style={{ position: 'absolute', left: 64, top: 0, height: CARD.h, display: 'flex', alignItems: 'center', ...textBase(promptSize, 500), color: shown ? S.ink : '#b4b4bb' }}>
        {caretOn && <span style={{ display: 'inline-block', width: 4, height: promptSize * 1.1, background: S.ink, marginRight: shown ? 0 : 6, order: shown ? 2 : 0 }} />}
        <span style={{ order: 1 }}>{shown || c.placeholder}</span>
      </div>
      <div style={{ position: 'absolute', right: 44, top: (CARD.h - 104) / 2 }}>
        <SendButton size={104} press={pressSend} />
      </div>
    </div>

    {/* 步骤：黑胶囊逐条接入，内部进度条推进 → 完成 */}
    {steps.map((label, i) => {
      const a = appearAt(i), d = doneAt(i);
      const enter = p(t, a, a + 0.38);
      if (enter <= 0) return null;
      const done = p(t, d, d + 0.3);
      const y = ROWS_TOP + i * (rowH + rowGap);
      // 运行进度：先快后慢推进到 86%，完成时补满再淡出
      const run = clamp((t - a - 0.12) / (RUN - 0.12));
      const fill = mix(0.86 * (1 - Math.pow(1 - run, 2)), 1, done);
      const fillAlpha = 1 - p(t, d + 0.1, d + 0.5);
      const shimmerX = ((t - a) * 1.6) % 1;
      return <div key={i} style={{
        position: 'absolute', left: CARD.x, top: y + (1 - enter) * 34, width: CARD.w, height: rowH, borderRadius: rowH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, overflow: 'hidden', opacity: enter,
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fill * 100}%`, background: '#2e2e34', opacity: fillAlpha, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, bottom: 0, width: 220, left: `${shimmerX * 120 - 20}%`,
            background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.09), rgba(255,255,255,0))', opacity: 1 - done,
          }} />
        </div>
        <div style={{ position: 'absolute', left: rowH * 0.5, top: 0, height: rowH, display: 'flex', alignItems: 'center', ...textBase(labelSize, 900), color: '#fff' }}>{label}</div>
        <div style={{ position: 'absolute', right: rowH * 0.42, top: 0, height: rowH, width: statusW, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ ...textBase(rowH * 0.36, 500), color: '#a3a3ab', position: 'absolute', right: 0, opacity: 1 - done }}>{c.runningLabel}</span>
          <span style={{ ...textBase(rowH * 0.42, 900), color: S.accentDark, position: 'absolute', right: 0, opacity: done, transform: `translateY(${(1 - done) * 14}px)` }}>{c.doneLabel}</span>
        </div>
      </div>;
    })}

    
    
    
    
    
  </Frame>;
}
