// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T14b-SpecLand.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-fix5-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-fix5-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批提炼集成）。
// 用途：单项参数落定（正版 T14b）：居中黑卡里参数名先占住卡心 → 让位缩成卡内上方小标签 → 数值像盖章一样
// 一次压到位（放大＋虚化收紧，不滚动）→ 卡下方一句话刷出这个数是什么意思、关键词染紫；可传失焦背景截图作上下文。
// 与近名件 YangPriceLand（正版 T14c）的区别（原包自述）：T14c 是价格逐位滚动＋旧价卡划掉＋差额胶囊，
// 本件是单个数值盖章落定＋含义句，无旧值对照、无胶囊——讲「一个参数是多少、意味着什么」时用本件，不是重复集成。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/wipe/springAt/cueAt/textWidth 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；
// 原包默认示例（原版定价数据与截图）已换中性示例、background 默认 null，使用时传真实数据与截图。
// 舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。调色板保留原版浅底设计。
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

// —— kit/theme 最小移植（MIT，逻辑逐字） ——
const S = {
  ink: '#19191c',
  dark: '#19191c',
  faint: '#a3a3ab',
  accent: '#8554E8',
  radius: 24,
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
const chapterCurve = Easing.bezier(0.65, 0, 0.2, 1);
const wipe = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: chapterCurve, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
const cueAt = (cues: readonly number[] | undefined, i: number, fallback: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fallback;
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);

// —— kit/ui 最小移植（Frame/Handoff/textBase，去 Brand、Fonts 与 Sfx） ——
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900): React.CSSProperties => ({
  fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
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

export type YangSpecLandProps = YangHandoffProps & {
  label: string;         // 参数名（例：上下文窗口）
  value: number;         // 数值
  decimals: number;      // 小数位
  prefix: string;        // 数值前缀（货币符号等），可为空
  suffix: string;        // 紧贴数值的后缀（%、x、ms 等），可为空
  unit: string;          // 数值右侧的小号单位，可为空
  meaning: string;       // 这个数意味着什么（一句话）
  highlight?: string;    // meaning 里染紫的关键词，只强调一处
  background?: string | null;   // 失焦退后的上下文截图（宿主 public 路径），null 关闭
  veil?: number;        // 白罩不透明度（默认 0.86；背景顶图太透时调低，如 0.72）
  cues?: number[];       // [0]=数值落定，[1]=含义刷出（秒，场景内）
};

export const yangSpecLandDefaults: YangSpecLandProps = {
  label: '上下文窗口',
  value: 200,
  decimals: 0,
  prefix: '',
  suffix: 'K',
  unit: 'token',
  meaning: '一次能读完一整本小说',
  highlight: '一整本小说',
  background: null,
  veil: 0.86,
};

const fmt = (v: number, d: number) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
// 等宽数字格：数字 0.6em，标点 0.3em，保证同组数字对齐、不因字形宽度跳动
const glyph = (ch: string) => (/\d/.test(ch) ? 0.6 : /[.,:]/.test(ch) ? 0.3 : ch === '%' ? 0.86 : ch === ' ' ? 0.28 : /[\u0000-\u00ff]/.test(ch) ? 0.62 : 1);
const numWidth = (s: string, size: number) => Array.from(s).reduce((w, ch) => w + glyph(ch) * size, 0);
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixColor = (a: string, b: string, t: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(mix(v, B[i], t))).join(',')})`; };

const MAX_W = 1500;      // 卡与含义句的最大宽
const PAD_X = 120;       // 卡内左右留白

export const YangSpecLand: React.FC<Partial<YangSpecLandProps>> = (props) => {
  const c = { ...yangSpecLandDefaults, ...props };
  const t = useT();
  const landAt = cueAt(c.cues, 0, 0.95);
  const meanAt = cueAt(c.cues, 1, landAt + 1.0);

  // —— 数值行：货币符号 / 数字 / 后缀 / 单位 同基线，符号与单位小一号 ——
  const numText = fmt(c.value, c.decimals) + c.suffix;
  const preRatio = 0.56, unitRatio = 0.34;
  const rowW = (size: number) => (c.prefix ? numWidth(c.prefix, size * preRatio) + size * 0.06 : 0) + numWidth(numText, size)
    + (c.unit ? textWidth(c.unit, size * unitRatio) + size * 0.14 : 0);
  const innerMax = MAX_W - 2 * PAD_X;
  let size = 300;
  while (size > 110 && rowW(size) > innerMax) size -= 4;
  const unitSize = size * unitRatio;
  const valueW = rowW(size);

  // 标签：卡内上方小字；开场在卡心放大
  const labelEnd = Math.max(34, Math.min(50, innerMax / Math.max(1, textWidth(c.label, 1))));
  const labelStart = Math.max(labelEnd, Math.min(100, (MAX_W - 2 * 80) / Math.max(1, textWidth(c.label, 1))));
  const labelEndW = textWidth(c.label, labelEnd);

  // 卡尺寸
  const cardW = Math.min(MAX_W, Math.max(1000, valueW, labelEndW) + 2 * PAD_X);
  const labelH = labelEnd * 1.16;
  const valueH = size * 1.0;
  const cardPadTop = 56, cardGap = 18, cardPadBot = 70;
  const cardH = Math.max(cardPadTop + labelH + cardGap + valueH + cardPadBot, 2 * labelStart * 1.16 + 120);

  // 含义：一行放得下就一行（≤76），否则 52 并折行（居中）
  let mSize = Math.min(76, MAX_W / Math.max(1, textWidth(c.meaning, 1)));
  const wrap = mSize < 46;
  if (wrap) mSize = 52;
  const mLines = wrap ? Math.ceil(textWidth(c.meaning, mSize) / MAX_W) : 1;
  const meaningH = mSize * 1.32 * mLines;
  const meanGap = 56;

  const groupH = cardH + meanGap + meaningH;
  const cardTop = (1080 - groupH) / 2 + 14;
  const cardLeft = (1920 - cardW) / 2;
  const meanTop = cardTop + cardH + meanGap;

  // —— 时间线 ——
  const intro = p(t, 0, 0.42);                       // 卡与参数名 0.3 秒内可辨认
  const yield_ = q(t, landAt - 0.6, landAt - 0.1);   // 参数名让位：变小、上移、退为卡内标签
  const stamp = p(t, landAt - 0.22, landAt + 0.12);  // 数值从放大+虚化压到位
  const settle = springAt(t, landAt + 0.08, 0.55);
  const reveal = wipe(t, meanAt, meanAt + 0.55);
  const keyOn = p(t, meanAt + 0.4, meanAt + 0.75);

  const lSize = mix(labelStart, labelEnd, yield_);
  const labelTopEnd = cardPadTop;
  const labelTopStart = cardH / 2 - lSize * 0.58;
  const lTop = mix(labelTopStart, labelTopEnd, yield_);
  const lColor = mixColor('#ffffff', S.faint, yield_);

  const [mBefore, mAfter] = c.highlight && c.meaning.includes(c.highlight)
    ? [c.meaning.slice(0, c.meaning.indexOf(c.highlight)), c.meaning.slice(c.meaning.indexOf(c.highlight) + c.highlight.length)]
    : [c.meaning, ''];
  const hasKey = !!c.highlight && c.meaning.includes(c.highlight);

  const vScale = mix(1.16, 1, stamp) * (1 + (1 - settle) * 0.025);
  const bgOn = !!c.background;
  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {bgOn && <>
        <Img src={staticFile(c.background!)} style={{ position: 'absolute', left: -40, top: -40, width: 2000, height: 1160, objectFit: 'cover', filter: 'blur(16px)', opacity: intro }} />
        <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: c.veil * intro }} />
      </>}

      {/* 黑色圆角卡 */}
      <div style={{
        position: 'absolute', left: cardLeft, top: cardTop + (1 - intro) * 36, width: cardW, height: cardH, borderRadius: S.radius,
        background: S.dark, boxShadow: S.capsuleShadow, opacity: clamp(intro * 2),
        transform: `scale(${mix(0.94, 1, intro)})`, transformOrigin: '50% 50%', overflow: 'hidden',
      }}>
        {/* 参数名：卡心大字 → 卡内上方小标签（居中） */}
        <div style={{ position: 'absolute', left: 0, width: cardW, textAlign: 'center', top: lTop, ...textBase(lSize, 500), color: lColor, opacity: intro }}>{c.label}</div>

        {/* 数值：一次压到位，不滚动；符号/单位与数字同基线 */}
        <div style={{
          position: 'absolute', left: (cardW - valueW) / 2, top: cardPadTop + labelH + cardGap, width: valueW, height: valueH,
          display: 'flex', alignItems: 'baseline', justifyContent: 'center', lineHeight: 1,
          opacity: clamp(stamp * 1.6), filter: `blur(${(1 - stamp) * 14}px)`, transform: `scale(${vScale})`, transformOrigin: '50% 60%',
        }}>
          {c.prefix && <span style={{ ...textBase(size * preRatio, 900), lineHeight: 1, color: '#fff', marginRight: size * 0.06 }}>{c.prefix}</span>}
          <span style={{ ...textBase(size, 900), lineHeight: 1, display: 'inline-flex', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {Array.from(numText).map((ch, i) => <span key={i} style={{ display: 'inline-block', width: glyph(ch) * size, textAlign: 'center' }}>{ch}</span>)}
          </span>
          {c.unit && <span style={{ ...textBase(unitSize, 500), lineHeight: 1, color: '#fff', marginLeft: size * 0.14 }}>{c.unit}</span>}
        </div>
      </div>

      {/* 含义：卡下方居中，从左往右刷出，关键词稍后染紫 */}
      <div style={{
        position: 'absolute', left: (1920 - MAX_W) / 2, top: meanTop, width: MAX_W, textAlign: 'center',
        ...textBase(mSize, 500), whiteSpace: wrap ? 'normal' : 'nowrap', lineHeight: 1.32, color: S.ink,
        clipPath: `inset(-10px ${(1 - reveal) * 100}% -10px -10px)`, visibility: reveal <= 0 ? 'hidden' : 'visible',
      }}>
        {mBefore}{hasKey && <span style={{ fontWeight: 900, color: mixColor(S.ink, S.accent, keyOn) }}>{c.highlight}</span>}{mAfter}
      </div>
    </Handoff>
  </Frame>;
};
