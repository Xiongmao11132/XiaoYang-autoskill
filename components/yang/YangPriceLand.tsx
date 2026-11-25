// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T14c-PriceLand.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-native-16-20261012
// （Fred 官网视觉库公开下载，公开日 2026-10-27；2026-10-30 下载归档于 ~/workspace/tools/FredTalk/downloads-b/fred-native-16-source.zip）。
// 用途：价格落定（正版 T14c）——大号价格像里程表一样逐位滚到最终值，随后旧价格在旁边被划掉，黑胶囊给出差额。
// 集成注记：原包 Sfx 音效文件未随 MIT 集成（已剔除，本件静音）；原包字体（MiSans/锐字）未集成，字体走本库 FONT；
// Brand 角标（品牌素材）未集成；kit 的 p/q/springAt/textWidth 与 Frame/Surface/Pill 已内嵌移植，逻辑与原版一致。
// 舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。调色板默认保留原版浅底设计，可用 props 覆盖。
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

// —— kit/theme 最小移植（MIT，逻辑逐字） ——
const S = {
  ink: '#19191c',
  dark: '#19191c',
  faint: '#a3a3ab',
  accent: '#8554E8',
  accentDark: '#D6BEFF',
  shadow: '0 16px 25px 0 rgba(0,0,0,0.1333333333)',
  capsuleShadow: '30px 22px 25px #0005',
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
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);

// —— kit/ui 最小移植（Frame/Surface/Pill/textBase，去 Brand 与 Fonts） ——
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900): React.CSSProperties => ({
  fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
type Box = { x: number; y: number; w: number; h: number };
function Frame({ children, dark = false, background }: { children: React.ReactNode; dark?: boolean; background?: string }) {
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
function Surface({ box, dark = false, radius = 24, shadow = S.shadow, style, children }: {
  box: Box; dark?: boolean; radius?: number; shadow?: string; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  return <div style={{
    position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h,
    background: dark ? S.dark : '#fff', color: dark ? '#fff' : S.ink, border: 'none',
    borderRadius: radius, boxShadow: shadow, overflow: 'hidden', ...style,
  }}>{children}</div>;
}
function Pill({ box, dark = true, shadow = S.capsuleShadow, style, children }: {
  box: Box; dark?: boolean; shadow?: string; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  return <Surface box={box} dark={dark} radius={Math.min(box.w, box.h) / 2} shadow={shadow}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>{children}</Surface>;
}

export type YangPriceLandProps = {
  label: string;            // 新价格是什么（例：GPT-6.1 Sol 输出价）
  value: number;            // 新价格数值
  decimals: number;         // 小数位
  prefix: string;           // 货币符号，可为空
  unit: string;             // 单位（例：/ 百万 token）
  compareLabel: string;     // 旧/贵的那一档
  compareValue: number;
  deltaText: string;        // 黑胶囊结论
  deltaKey?: string;        // 胶囊里染紫的关键片段；缺省时自动取数字/百分比
  background?: string | null; // 可选真实截图（宿主 public 路径），作为失焦上下文；传了整屏转深底
  stageColor?: string;      // 无截图背景时的舞台底色（默认原版浅底 #fff）
};

export const yangPriceLandDefaults: YangPriceLandProps = {
  label: 'GPT-6.1 Sol 输出价',
  value: 10,
  decimals: 2,
  prefix: '$',
  unit: '/ 百万 token',
  compareLabel: 'GPT-6 Astra',
  compareValue: 50,
  deltaText: '便宜 80%',
  background: null,
};

const fmt = (v: number, d: number) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// 一位里程表数字：只渲染窗口附近的格子，滚动越快越虚
function DigitColumn({ pos, size, cellW }: { pos: number; size: number; cellW: number }) {
  const base = Math.floor(pos);
  const frac = pos - base;
  const H = size;
  const STEP = size * 1.15;           // 相邻数字间距：静止时上下邻位完全藏在窗外
  return <span style={{
    position: 'relative', display: 'inline-block', width: cellW, height: H * 1.24, marginTop: -H * 0.08, overflow: 'hidden', verticalAlign: 'top',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 7%, #000 93%, transparent 100%)',
    maskImage: 'linear-gradient(to bottom, transparent 0%, #000 7%, #000 93%, transparent 100%)',
  }}>
    {[-1, 0, 1, 2].map((k) => {
      const idx = base + k;
      const n = ((idx % 10) + 10) % 10;
      return <span key={k} style={{
        position: 'absolute', left: 0, width: cellW, textAlign: 'center', top: H * 0.12 + (k - frac) * STEP, lineHeight: 1, height: H,
      }}>{n}</span>;
    })}
  </span>;
}

export const YangPriceLand: React.FC<Partial<YangPriceLandProps>> = (props) => {
  const c = { ...yangPriceLandDefaults, ...props };
  const t = useT();

  const text = fmt(c.value, c.decimals);
  const chars = Array.from(text);
  const digitIdx = chars.map((ch, i) => (/\d/.test(ch) ? i : -1)).filter((i) => i >= 0);

  // —— 字号自适应：最终态主价格组（×0.86）不超过 860 宽 ——
  const unitSize = 54;
  const measure = (size: number) => {
    const cellW = size * 0.6;
    const numW = chars.reduce((w, ch) => w + (/\d/.test(ch) ? cellW : size * 0.3), 0);
    const preW = c.prefix ? textWidth(c.prefix, size * 0.5) + size * 0.06 : 0;
    const unitW = c.unit ? textWidth(c.unit, unitSize) + 24 : 0;
    return { cellW, numW, preW, unitW, total: preW + numW + unitW };
  };
  let size = 220;
  while (size > 120 && measure(size).total * 0.86 > 860) size -= 4;
  const m = measure(size);
  const labelW = textWidth(c.label, 56);
  const groupW = Math.max(m.total, labelW);

  // —— 时间线 ——
  const enter = p(t, 0.05, 0.55);
  const rollStart = 0.25;
  const landAt = (i: number) => 1.15 + i * 0.14;                 // 从高位到低位依次落定
  const nD = digitIdx.length;
  const landed = landAt(nD - 1);
  const settle = springAt(t, landed, 0.55);                       // 落定瞬间的轻微顿挫
  const shift = q(t, 2.0, 2.6);                                   // 主价格让位
  const cmp = p(t, 2.1, 2.65);
  const strike = p(t, 2.8, 3.15);
  const delta = p(t, 3.4, 3.85);

  // 主价格组：先居中，再侧移并缩小
  const scale = mix(1, 0.86, shift);
  const groupCx = mix(960, 590, shift);
  const groupCy = mix(520, 470, shift);
  const blockH = 56 * 1.3 + 24 + size * 1.08;

  // 对照卡
  const cmpText = `${c.prefix}${fmt(c.compareValue, c.decimals)}`;
  let cmpSize = 128;
  while (cmpSize > 72 && textWidth(cmpText, cmpSize) > 520) cmpSize -= 4;
  const cmpLabelSize = 46;
  const cardW = Math.max(textWidth(cmpText, cmpSize), textWidth(c.compareLabel, cmpLabelSize)) + 120;
  const cardH = cmpLabelSize * 1.3 + 18 + cmpSize * 1.1 + 100;
  const cardX = mix(1980, 1380 - cardW / 2 + 40, cmp);
  const cardY = 470 - cardH / 2;

  // 胶囊
  const key = c.deltaKey ?? (c.deltaText.match(/[\d.]+\s*[%倍x×]?/)?.[0] ?? '');
  const [dBefore, dAfter] = key && c.deltaText.includes(key) ? [c.deltaText.slice(0, c.deltaText.indexOf(key)), c.deltaText.slice(c.deltaText.indexOf(key) + key.length)] : [c.deltaText, ''];
  const pillSize = 80;
  const pillW = textWidth(c.deltaText, pillSize) + 140;
  const pillH = 150;
  const pillCx = 960;
  const pillY = 770;

  // 每一位的滚动位置
  const posFor = (i: number, d: number) => {
    const spins = 2 + (nD - 1 - i);                               // 低位多转几圈
    const target = spins * 10 + d;
    return p(t, rollStart, landAt(i)) * target;
  };

  // 有真实截图时整屏转深底：截图失焦 + 黑蒙版做上下文；胶囊随之反白
  const dark = !!c.background;
  const fg = dark ? '#fff' : S.ink;
  return <Frame dark={dark} background={dark ? undefined : (c.stageColor ?? '#fff')}>
    {c.background && <div style={{ position: 'absolute', inset: 0 }}>
      <Img src={staticFile(c.background)} style={{ position: 'absolute', inset: -40, width: 2000, height: 1160, objectFit: 'cover', filter: `blur(${mix(6, 22, enter)}px)` }} />
      <div style={{ position: 'absolute', inset: 0, background: S.dark, opacity: mix(0.4, 0.78, enter) }} />
    </div>}

    {/* 主价格组 */}
    <div style={{
      position: 'absolute', left: groupCx - groupW / 2, top: groupCy - blockH / 2, width: groupW, height: blockH,
      transform: `scale(${scale * mix(0.94, 1, enter)})`, transformOrigin: '50% 50%', opacity: enter,
    }}>
      <div style={{ ...textBase(56, 500), color: fg, opacity: 0.72, position: 'absolute', left: 0, top: 0 }}>{c.label}</div>
      <div style={{
        position: 'absolute', left: 0, top: 56 * 1.3 + 24, display: 'flex', alignItems: 'flex-start',
        transform: `translateY(${(1 - settle) * -10}px)`,
      }}>
        {c.prefix && <span style={{ ...textBase(size * 0.5, 900), color: fg, lineHeight: 1, marginTop: size * 0.12, marginRight: size * 0.06 }}>{c.prefix}</span>}
        <span style={{ ...textBase(size, 900), lineHeight: 1, display: 'inline-flex', color: fg }}>
          {chars.map((ch, i) => {
            if (!/\d/.test(ch)) return <span key={i} style={{ display: 'inline-block', width: size * 0.3, textAlign: 'center', height: size * 1.08, lineHeight: 1, paddingTop: size * 0.04 }}>{ch}</span>;
            const di = digitIdx.indexOf(i);
            return <DigitColumn key={i} pos={posFor(di, Number(ch))} size={size} cellW={m.cellW} />;
          })}
        </span>
        {c.unit && <span style={{ ...textBase(unitSize, 500), color: fg, opacity: 0.72, marginLeft: 24, alignSelf: 'flex-end', marginBottom: size * 0.14 }}>{c.unit}</span>}
      </div>
    </div>

    {/* 对照：旧价格卡，划掉后退后 */}
    <Surface box={{ x: cardX, y: cardY, w: cardW, h: cardH }} style={{ opacity: cmp }}>
      <div style={{ position: 'absolute', left: 60, top: 50, ...textBase(cmpLabelSize, 500), color: S.ink, opacity: 0.72 }}>{c.compareLabel}</div>
      <div style={{ position: 'absolute', left: 60, top: 50 + cmpLabelSize * 1.3 + 18, ...textBase(cmpSize, 900), lineHeight: 1.1, color: strike > 0.5 ? S.faint : S.ink }}>
        {cmpText}
        <span style={{ position: 'absolute', left: -8, top: '52%', height: 9, borderRadius: 5, background: S.ink, width: (textWidth(cmpText, cmpSize) + 16) * strike }} />
      </div>
    </Surface>

    <Pill dark={!dark} shadow={dark ? S.shadow : S.capsuleShadow} box={{ x: pillCx - pillW / 2, y: pillY + (1 - delta) * 24, w: pillW, h: pillH }}
      style={{ opacity: delta, transform: `scale(${mix(0.82, 1, clamp(delta * 1.2))})` }}>
      <span style={{ ...textBase(pillSize, 400), color: dark ? S.ink : '#fff', lineHeight: 1 }}>
        {dBefore}<span style={{ color: dark ? S.accent : S.accentDark }}>{key}</span>{dAfter}
      </span>
    </Pill>
  </Frame>;
};
