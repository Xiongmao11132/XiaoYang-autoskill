// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T09n-WaitSkip.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：等待快进（正版 T09n）——一段等待 → 时间胶囊快速翻过，直接到完成。
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

export type YangWaitSkipProps = YangHandoffProps & {
  image: string;        // 录屏截图或视频（public 相对路径）
  imageSize?: { w: number; h: number };   // 源图尺寸，用来把 maskBoxes 换算到画面（铺满方式同 Media cover）
  maskBoxes?: { x: number; y: number; w: number; h: number }[];   // 源图里要实心盖掉的区域（源图像素）
  maskColor?: string;
  label: string;        // 在等什么，如“安装依赖”
  minutes: number;      // 等了多久（整数分钟）
  prefix?: string;      // 数字前的字，默认“约”
  suffix?: string;      // 数字后的字，默认“分钟后”
  brand?: boolean;      // 录屏全屏时默认不加角标
  cues?: number[];      // [0]=开始快进，[1]=到头完成，[2]=恢复清晰
};

// 默认内容：Codex 桌面端真实界面（114 期“装依赖要等一会儿”）
export const yangWaitSkipDefaults: YangWaitSkipProps = {
  image: '',
  imageSize: { w: 3024, h: 1712 },
  // 盖掉输入框左下橙色“完全访问”（含图标）：平台安全规则里无安全语境的权限表达不上屏
  maskBoxes: [{ x: 1156, y: 1606, w: 158, h: 44 }],
  maskColor: '#fff',
  label: '安装依赖',
  minutes: 8,
  prefix: '约',
  suffix: '分钟后',
  brand: false,
};

// 里程表：每一位是 0–9 的竖列，按连续数值滚动；低位走完一圈时高位才进一格
function Odometer({ value, digits, size, color }: { value: number; digits: number; size: number; color: string }) {
  const cellW = size * 0.62, cellH = size * 1.16;   // 数字用 MiSans Heavy（锐字真言的数字不好认）
  return <div style={{ display: 'flex', height: cellH, overflow: 'hidden' }}>
    {Array.from({ length: digits }, (_, i) => {
      const k = digits - 1 - i;              // 位权
      const unit = Math.pow(10, k);
      const lower = value % unit;
      const carry = k === 0 ? 0 : clamp(lower - (unit - 1));
      const pos = k === 0 ? value % 10 : (Math.floor(value / unit) + carry) % 10;
      const lead = k > 0 && value < unit ? clamp(value / unit * 4) : 1; // 前导 0 不显示
      return <div key={i} style={{ position: 'relative', width: cellW * lead, height: cellH, opacity: lead, overflow: 'hidden' }}>   {/* 前导位还没出现时不占宽度，不留空洞 */}
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translateY(${-pos * cellH}px)` }}>
          {Array.from({ length: 11 }, (_, d) => <div key={d} style={{
            ...textBase(size, 900), width: cellW, height: cellH, lineHeight: `${cellH}px`, textAlign: 'center', color,
          }}>{d % 10}</div>)}
        </div>
      </div>;
    })}
  </div>;
}

export function YangWaitSkip(props: Partial<YangWaitSkipProps>) {
  const c = { ...yangWaitSkipDefaults, ...props };
  const t = useT();
  const minutes = Math.max(1, Math.round(c.minutes));
  const digits = String(minutes).length;
  const prefix = c.prefix ?? '约', suffix = c.suffix ?? '分钟后';

  // —— 时间 ——
  const ffAt = cueAt(c.cues, 0, 0.42);
  const doneAt = cueAt(c.cues, 1, Math.max(ffAt + 0.9, 1.72));
  const backAt = cueAt(c.cues, 2, doneAt + 0.3);
  const recede = q(t, 0.18, 0.5) * (1 - q(t, backAt, backAt + 0.4));
  const cardIn = p(t, 0.2, 0.55);                       // 和虚化同步进来，不在清晰画面上先出现
  const cardOut = q(t, backAt, backAt + 0.24);
  const ff = q(t, ffAt, doneAt);                         // 快进：先加速再减速，到头停住
  const value = ff * minutes;
  const check = p(t, doneAt, doneAt + 0.32);

  // —— 黑卡版式：大字一行按宽度自适应 ——
  const BIG = Math.min(168, 1180 / (textWidth(prefix, 1) + digits * 0.62 + textWidth(suffix, 1) + 0.4));
  const LAB = Math.min(64, 1180 / Math.max(1, textWidth(c.label, 1) + 1.2));
  const rowW = textWidth(prefix, BIG) + (prefix ? BIG * 0.2 : 0) + digits * BIG * 0.62 + BIG * 0.2 + textWidth(suffix, BIG);
  const PAD = 84;
  const cardW = Math.max(880, rowW + PAD * 2, textWidth(c.label, LAB) + LAB * 1.2 + PAD * 2);
  const BAR_H = 14, DOT = 54;
  const cardH = PAD * 0.85 + LAB * 1.16 + 34 + BIG * 1.16 + 46 + DOT + PAD * 0.75;
  const card = { x: 960 - cardW / 2, y: 540 - cardH / 2, w: cardW, h: cardH };
  const barY = PAD * 0.85 + LAB * 1.16 + 34 + BIG * 1.16 + 46 + DOT / 2;
  const barX0 = PAD, barW = cardW - PAD * 2 - DOT / 2;
  const headX = barX0 + barW * ff;
  const hold = clamp((t - doneAt) / 0.08);

  return <Frame brand={c.brand ?? false} dark>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 录屏：先看清，再虚化暗下；完成后恢复 */}
      <div style={{ position: 'absolute', inset: 0, filter: `blur(${16 * recede}px)`, transform: `scale(${1 + 0.05 * recede})`, transformOrigin: '50% 50%' }}>
        <Media src={c.image} box={{ x: 0, y: 0, w: 1920, h: 1080 }} radius={0} />
        {c.imageSize && (c.maskBoxes ?? []).map((m, i) => {
          const k = Math.max(1920 / c.imageSize!.w, 1080 / c.imageSize!.h);
          const ox = (1920 - c.imageSize!.w * k) / 2, oy = (1080 - c.imageSize!.h * k) / 2;
          return <div key={i} style={{ position: 'absolute', left: ox + m.x * k, top: oy + m.y * k, width: m.w * k, height: m.h * k, background: c.maskColor ?? '#fff' }} />;
        })}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0.58 * recede }} />

      {/* 中央黑卡 */}
      {cardIn > 0 && cardOut < 1 && <div style={{
        ...abs(card), borderRadius: 48, background: S.dark, boxShadow: S.capsuleShadow, overflow: 'hidden',
        opacity: clamp(cardIn * 1.5) * (1 - cardOut) * (1 - cardOut), transform: `translateY(${(1 - cardIn) * 36 - cardOut * 20}px) scale(${mix(0.94, 1, cardIn) * mix(1, 0.86, cardOut)})`,
      }}>
        {/* 第一行：快进符号 + 在等什么 */}
        <div style={{ position: 'absolute', left: PAD, top: PAD * 0.85, height: LAB * 1.16, display: 'flex', alignItems: 'center', gap: LAB * 0.36 }}>
          <svg width={LAB * 0.86} height={LAB * 0.62} viewBox="0 0 28 20" style={{ opacity: 0.55 + 0.45 * Math.abs(Math.sin(value * Math.PI * 0.5)) * (1 - hold) + 0.45 * hold }}>
            <path d="M1 1 L13 10 L1 19 Z M14 1 L26 10 L14 19 Z" fill="#fff" />
          </svg>
          <span style={{ ...textBase(LAB, 900), color: '#fff' }}>{c.label}</span>
        </div>
        {/* 第二行：约 [N] 分钟后 */}
        <div style={{ position: 'absolute', left: PAD, top: PAD * 0.85 + LAB * 1.16 + 34, height: BIG * 1.16, display: 'flex', alignItems: 'center' }}>
          {prefix && <><span style={{ ...textBase(BIG, 400, S.display), color: '#fff' }}>{prefix}</span><div style={{ width: BIG * 0.2 }} /></>}
          <Odometer value={value} digits={digits} size={BIG} color={accentOn(true)} />
          <div style={{ width: BIG * 0.2 }} />
          <span style={{ ...textBase(BIG, 400, S.display), color: '#fff' }}>{suffix}</span>
        </div>
        {/* 第三行：进度条，条头圆点到头后长成完成勾 */}
        <div style={{ position: 'absolute', left: barX0, top: barY - BAR_H / 2, width: barW, height: BAR_H, borderRadius: BAR_H / 2, background: 'rgba(255,255,255,0.16)' }} />
        <div style={{ position: 'absolute', left: barX0, top: barY - BAR_H / 2, width: Math.max(BAR_H, barW * ff), height: BAR_H, borderRadius: BAR_H / 2, background: '#fff', opacity: clamp((t - ffAt) / 0.08) }} />
        {(() => {
          const r = mix(BAR_H * 1.1, DOT / 2, check);
          return <div style={{ position: 'absolute', left: headX - r, top: barY - r, width: r * 2, height: r * 2, borderRadius: r, background: check > 0 ? accentOn(true) : '#fff', opacity: clamp((t - ffAt) / 0.08) }}>
            <svg width={r * 2} height={r * 2} viewBox="0 0 24 24" style={{ position: 'absolute', inset: 0, opacity: check }}>
              <path d="M6.5 12.5 L10.5 16.2 L17.5 8.3" stroke={S.dark} strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="18" strokeDashoffset={18 * (1 - check)} />
            </svg>
          </div>;
        })()}
      </div>}
    </Handoff>
    
    
    
  </Frame>;
}
