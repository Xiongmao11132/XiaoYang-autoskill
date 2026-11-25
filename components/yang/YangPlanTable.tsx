// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T15i-PlanTable.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：套餐对比（正版 T15i）——几个套餐并排 → 价格落定，推荐的那个抬起。
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

export type YangPlan = {
  name: string;          // 套餐名
  price: number;         // 主价格（滚动到这个数）
  prefix?: string;       // 价格前缀，如 "$"、"¥"
  decimals?: number;     // 小数位；不传时整数不带小数、其余保留两位
  unit?: string;         // 价格下面的说明，如 "输入价"
  rows: string[];        // 权益行（每行一个对勾）
};
export type YangPlanTableProps = YangHandoffProps & {
  plans: YangPlan[];         // 2–4 个套餐
  recommend: number;     // 推荐第几个（从 0 起）
  tag: string;           // 推荐胶囊上的字
  cues?: number[];       // [0]=价格开始滚动，[1]=权益开始打勾，[2]=推荐抬起
};

export const yangPlanTableDefaults: YangPlanTableProps = {
  plans: [
    { name: 'Astra', price: 10, prefix: '$', unit: '输入价', rows: ['最聪明的模型', '输出 $50', '缓存输入 $1'] },
    { name: 'Sol', price: 2, prefix: '$', unit: '输入价', rows: ['接近 Astra 的智能', '输出 $10', '缓存输入 $0.10'] },
    { name: 'Luna', price: 0.1, prefix: '$', unit: '输入价', rows: ['快速的日常批量', '输出 $0.50', '缓存输入 $0.01'] },
  ],
  recommend: 1,
  tag: '推荐',
};

const Check = ({ size, v, color }: { size: number; v: number; color: string }) => <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', overflow: 'visible', flex: 'none' }}>
  <path d="M3.5 12.8 L9.6 18.6 L20.5 5.4" pathLength={1} fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"
    strokeDasharray={1} strokeDashoffset={1 - v} />
</svg>;

export function YangPlanTable(props: Partial<YangPlanTableProps>) {
  const c = { ...yangPlanTableDefaults, ...props };
  const t = useT();
  const plans = c.plans.slice(0, 4);
  const n = Math.max(1, plans.length);
  const rec = clamp(Math.round(c.recommend), 0, n - 1);
  const maxRows = Math.max(1, ...plans.map((x) => x.rows.length));

  // ---------- 终态版式 ----------
  const gap = n >= 4 ? 32 : 44;
  const cardW = Math.min(470, (1700 - gap * (n - 1)) / n);
  const pad = 48;
  const inner = cardW - pad * 2;
  const fmt = (pl: YangPlan, v: number) => v.toFixed(pl.decimals ?? (Number.isInteger(pl.price) ? 0 : 2));
  const nameSize = Math.min(54, inner / Math.max(1, ...plans.map((x) => textWidth(x.name, 1))));
  const priceSize = Math.min(124, inner / Math.max(1, ...plans.map((x) => textWidth(`${x.prefix ?? ''}${fmt(x, x.price)}`, 0.82))));
  // 权益行：先求“每行一行字”的最大字号（≤38）；放不下 30 就固定 30 并允许换到第二行
  const allRows = plans.flatMap((x) => x.rows);
  const textW = inner - 38 - 16;
  const linesAt = (sz: number) => Math.max(1, ...allRows.map((r) => Math.ceil(textWidth(r, sz) / textW - 0.001)));
  let rowSize = 38;
  while (rowSize > 30 && linesAt(rowSize) > 1) rowSize -= 1;
  const rowLines = Math.min(2, linesAt(rowSize));
  const rowH = Math.round(rowSize * 1.25 * rowLines + rowSize * 0.75);
  const nameH = Math.round(nameSize * 1.3), priceH = Math.round(priceSize * 1.1), unitH = 44;
  const cardH = pad + nameH + 14 + priceH + unitH + 26 + maxRows * rowH + pad - 6;
  const totalW = cardW * n + gap * (n - 1);
  const x0 = (1920 - totalW) / 2;
  const y0 = Math.max(190, (1080 - cardH) / 2 + 36);

  // ---------- 时间线 ----------
  const priceAt = cueAt(c.cues, 0, 0.75);
  const rowsAt = cueAt(c.cues, 1, priceAt + 1.25);
  const liftAt = cueAt(c.cues, 2, rowsAt + (maxRows - 1) * 0.3 + 0.95);
  const lift = p(t, liftAt, liftAt + 0.7);
  const priceOn = q(t, liftAt + 0.3, liftAt + 0.65);
  const tagOpen = p(t, liftAt + 0.2, liftAt + 0.75);
  const tagPop = 1 + 0.06 * Math.sin(clamp((t - liftAt - 0.2) / 0.6) * Math.PI);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {plans.map((pl, j) => {
        const isRec = j === rec;
        const inAt = 0.05 + j * 0.11;
        const enter = p(t, inAt, inAt + 0.55);
        const pa = priceAt + j * 0.12;
        const pv = p(t, pa, pa + 0.95);
        const x = x0 + j * (cardW + gap);
        const scale = isRec ? mix(1, 1.07, lift) : mix(1, 0.97, lift);
        const dy = isRec ? -26 * lift : 0;
        const op = enter * (isRec ? 1 : mix(1, 0.55, lift));
        const shadow = isRec ? `0 ${16 + 14 * lift}px ${25 + 20 * lift}px 0 rgba(0,0,0,${0.1333 + 0.09 * lift})` : S.shadow;
        const priceColor = isRec && priceOn > 0 ? `rgb(${[0x19, 0x19, 0x1c].map((a, k) => Math.round(mix(a, [0x85, 0x54, 0xe8][k], priceOn))).join(',')})` : S.ink;
        return <div key={j} style={{ position: 'absolute', left: x, top: y0 + (1 - enter) * 56 + dy, width: cardW, height: cardH, opacity: op, transform: `scale(${scale})`, transformOrigin: '50% 50%', zIndex: isRec ? 5 : 1 }}>
          <Surface box={{ x: 0, y: 0, w: cardW, h: cardH }} shadow={shadow} style={{ overflow: 'visible' }}>
            <div style={{ position: 'absolute', left: pad, top: pad, ...textBase(nameSize, 900) }}>{pl.name}</div>
            <div style={{ position: 'absolute', left: pad, top: pad + nameH + 14, height: priceH, display: 'flex', alignItems: 'baseline', color: priceColor, ...textBase(priceSize, 900), fontVariantNumeric: 'tabular-nums' }}>
              {pl.prefix && <span style={{ fontSize: priceSize * 0.5, marginRight: 4 }}>{pl.prefix}</span>}{fmt(pl, pl.price * pv)}
            </div>
            {pl.unit && <div style={{ position: 'absolute', left: pad, top: pad + nameH + 14 + priceH + 2, ...textBase(rowSize * 0.9, 500), color: S.muted }}>{pl.unit}</div>}
            {pl.rows.map((r, i) => {
              const ra = rowsAt + i * 0.3 + j * 0.07;
              const rv = p(t, ra, ra + 0.4);
              return <div key={i} style={{ position: 'absolute', left: pad, top: pad + nameH + 14 + priceH + unitH + 26 + i * rowH, height: rowH, display: 'flex', alignItems: 'center', gap: 16 }}>
                <Check size={rowSize * 1.0} v={rv} color={S.ink} />
                <span style={{ ...textBase(rowSize, 500), whiteSpace: 'normal', lineHeight: 1.25, width: textW, opacity: rv, transform: `translateX(${(1 - rv) * 14}px)` }}>{r}</span>
              </div>;
            })}
          </Surface>
          {isRec && lift > 0 && <div style={{ position: 'absolute', left: 0, top: 0, width: cardW, height: 0 }}>
            {(() => {
              const fs = 40, w = textWidth(c.tag, fs) + 72, h = 64;
              return <Pill box={{ x: cardW / 2 - w / 2, y: -h / 2, w, h }} style={{ clipPath: tagOpen < 0.999 ? `inset(-40px ${50 * (1 - tagOpen)}% -40px ${50 * (1 - tagOpen)}% round ${h / 2}px)` : undefined, transform: `scale(${tagPop})`, overflow: 'visible' }}>
                <span style={{ ...textBase(fs, 400, S.display), color: '#fff' }}>{c.tag}</span>
              </Pill>;
            })()}
          </div>}
        </div>;
      })}
    </Handoff>
    
    
    
  </Frame>;
}
