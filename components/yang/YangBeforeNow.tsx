// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T05b2-BeforeNow.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-fix5-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-fix5-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批提炼集成）。
// 用途：以前 vs 现在（正版 T05b2，T05b 的返修版）：以前的多步卡先逐张堆起，再几何插值收成左侧一列紧凑卡
// （不整体缩小——每张保留编号＋关键词、字号 ≥30 仍可读、变灰退后），右侧黑胶囊展开新做法、关键词染浅紫成为阅读焦点。
// 与库内近名件的区别：YangPainContrast（T20b）是痛点图→成品图的开场硬切；YangVersionCompare 是新旧两窗对置；
// YangTriStateCompare 是三联图片状态对照——都不是「步骤清单收成一叠＋新做法胶囊接管」，机制不重复。
// 注：T05b 原版（fred-native-16 包）此前未集成，本件即该机制的唯一集成件（返修版）。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/mix/cueAt/textWidth 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；默认文案换中性示例。
// 舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。调色板保留原版浅底设计。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

// —— kit/theme 最小移植（MIT，逻辑逐字） ——
const S = {
  ink: '#19191c',
  dark: '#19191c',
  muted: '#6c6c72',
  faint: '#a3a3ab',
  accent: '#8554E8',
  accentDark: '#D6BEFF',
  radius: 24,
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
const cueAt = (cues: readonly number[] | undefined, i: number, fallback: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fallback;
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);

// —— kit/ui 最小移植（Frame/Handoff/textBase/center，去 Brand、Fonts 与 Sfx） ——
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900): React.CSSProperties => ({
  fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
const center: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center' };
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

export type YangBeforeNowProps = YangHandoffProps & {
  beforeLabel: string;
  beforeSteps: string[];   // 建议 3–6 步
  beforeKeys?: string[];   // 收起后每张卡显示的关键词；缺省用 beforeSteps 原文
  nowLabel: string;
  nowText: string;
  highlight: string;       // nowText 中要染浅紫的关键词（深底 #D6BEFF）
  cues?: number[];         // [0]=旧步骤收起，[1]=现在的胶囊打开；不传用默认 1.75 / 2.3
};

export const yangBeforeNowDefaults: YangBeforeNowProps = {
  beforeLabel: '以前',
  beforeSteps: ['打开软件找模板', '一张张抠图换背景', '手动调色、对齐尺寸', '导出再压缩上传', '改一处，全部重来'],
  nowLabel: '现在',
  nowText: '一句话让 AI 直接出图',
  highlight: '一句话',
};

const CARD_W = 960;
const CARD_X = 620;          // 步骤卡左缘（建立阶段）
const PILE_W = 520;          // 收起后的紧凑一叠：宽
const GAP = 90;              // 一叠与胶囊之间的间距
const SIDE = 80;             // 整组左右最小留白
const LABEL_SIZE = 64, LABEL_H = 100;   // 两个标签共用字号；标签行占高（含与内容的间距）
const CY = 540 + LABEL_H / 2;           // 左右两列共享的中线：整组（标签行+内容）垂直居中

// 一行放得下（字号 ≥ 84）就一行；否则在最均衡处（优先标点后）断成两行
function fitLines(text: string, maxW: number, maxSize: number) {
  const one = Math.min(maxSize, maxW / Math.max(1, textWidth(text, 1)));
  if (one >= 84) return { lines: [text], size: one };
  const chars = Array.from(text);
  let best = { cost: Infinity, at: Math.ceil(chars.length / 2) };
  for (let i = 2; i < chars.length - 1; i++) {
    const a = chars.slice(0, i).join(''), b = chars.slice(i).join('');
    const bonus = /[，,、：:；; ]/.test(chars[i - 1]) ? 0.82 : 1;
    const cost = Math.max(textWidth(a, 1), textWidth(b, 1)) * bonus;
    if (cost < best.cost) best = { cost, at: i };
  }
  const lines = [chars.slice(0, best.at).join('').trim(), chars.slice(best.at).join('').trim()];
  return { lines, size: Math.min(maxSize, maxW / Math.max(...lines.map((l) => textWidth(l, 1)))) };
}

// 按字符位置染浅紫：返回带高亮的一行
function HighlightLine({ line, offset, from, to }: { line: string; offset: number; from: number; to: number }) {
  const chars = Array.from(line);
  return <>{chars.map((ch, k) => {
    const idx = offset + k;
    return <span key={k} style={idx >= from && idx < to ? { color: S.accentDark } : undefined}>{ch}</span>;
  })}</>;
}

export const YangBeforeNow: React.FC<Partial<YangBeforeNowProps>> = (props) => {
  const c = { ...yangBeforeNowDefaults, ...props };
  const t = useT();
  const steps = c.beforeSteps.slice(0, 6);
  const n = Math.max(1, steps.length);
  const keys = steps.map((s, i) => (c.beforeKeys?.[i] || s));

  // —— 建立：步骤卡快速堆起（总长约 1.1s，步数多时间隔更短）——
  const gapT = Math.min(0.24, 0.95 / n);
  const cardH = n <= 4 ? 128 : n === 5 ? 112 : 96;
  const gapY = n <= 4 ? 26 : 20;
  const listH = n * cardH + (n - 1) * gapY;
  const listTop = CY - listH / 2;
  const stepSize = Math.min(cardH * 0.46, ...steps.map((s) => (CARD_W - 190) / Math.max(1, textWidth(s, 1))));

  // —— 收起后的紧凑一叠：每张一行，编号 + 关键词仍可读 ——
  const pileH = n <= 4 ? 92 : n === 5 ? 82 : 72;
  const pileGap = 14;
  const pileTotal = n * pileH + (n - 1) * pileGap;
  const pileTop = CY - pileTotal / 2;
  const pileSize = Math.max(30, Math.min(pileH * 0.48, ...keys.map((k) => (PILE_W - pileH * 0.5 - 40 - pileH * 0.55) / Math.max(1, textWidth(k, 1)))));

  // —— 压缩退后 ——
  const sq = cueAt(c.cues, 0, 1.75);
  const squeeze = p(t, sq, sq + 0.65);
  const dim = q(t, sq + 0.15, sq + 0.75);

  // —— 现在：黑胶囊接管 ——
  const na = cueAt(c.cues, 1, 2.3);
  const nowOpen = p(t, na, na + 0.7);
  const nowGrow = p(t, na, na + 0.32);
  const textIn = p(t, na + 0.32, na + 0.75);
  const maxW = 1920 - 2 * SIDE - PILE_W - GAP;
  const fit = fitLines(c.nowText, maxW - 200, 118);
  const nowSize = fit.size;
  const capH = Math.round(nowSize * (fit.lines.length === 1 ? 2.6 : 3.6));
  const capW = Math.min(maxW, Math.max(...fit.lines.map((l) => textWidth(l, nowSize))) + 200);
  const capR = Math.min(capH / 2, 110);
  const contentH = Math.max(pileTotal, capH);
  const groupW = PILE_W + GAP + capW;
  const pileX = (1920 - groupW) / 2;                 // 整组左右居中
  const capLeft = pileX + PILE_W + GAP;
  const capCx = capLeft + capW / 2;
  const labelRowY = CY - contentH / 2 - LABEL_H;     // 两个标签同一顶线、同一字号、同一基线
  const w = mix(capH * 0.35, capW, nowOpen);
  const h = mix(capH * 0.35, capH, nowGrow);
  const hlFrom = c.highlight ? Array.from(c.nowText).length - Array.from(c.nowText.slice(Math.max(0, c.nowText.indexOf(c.highlight)))).length : -1;
  const hl = c.highlight && c.nowText.includes(c.highlight) ? [hlFrom, hlFrom + Array.from(c.highlight).length] : [-1, -1];
  let offset = 0;
  const lineOffsets = fit.lines.map((l) => { const o = c.nowText.indexOf(l, offset); offset = o + l.length; return Array.from(c.nowText.slice(0, o)).length; });

  // 标签：以前（跟随卡组，收起后落在那一叠上方）/ 现在（胶囊左上）
  const labelUp = p(t, sq, sq + 0.22), labelOver = p(t, sq + 0.12, sq + 0.7);
  const labelBig = Math.min(104, (CARD_X - 70 - 90) / Math.max(1, textWidth(c.beforeLabel, 1)));
  const beforeLabelSize = mix(labelBig, LABEL_SIZE, squeeze);
  const labelX = mix(CARD_X - 70 - textWidth(c.beforeLabel, labelBig), pileX + 8, labelOver);
  const labelY = mix(listTop - 4, labelRowY, labelUp);
  const labelIn = p(t, 0, 0.35);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 以前：标签 */}
      <div style={{
        ...textBase(beforeLabelSize, 900), position: 'absolute', left: labelX, top: labelY,
        color: dim > 0.5 ? S.muted : S.ink, opacity: labelIn, transform: `translateY(${(1 - labelIn) * 20}px)`,
      }}>{c.beforeLabel}</div>

      {/* 以前：步骤卡 → 紧凑一叠（几何插值，不整体缩小，字始终可读） */}
      {steps.map((s, i) => {
        const enter = p(t, 0.08 + i * gapT, 0.08 + i * gapT + 0.38);
        const listY = listTop + i * (cardH + gapY);
        const pileY = pileTop + i * (pileH + pileGap);
        const back = n - 1 - i;
        const rot = (back === 0 ? 0 : (back % 2 ? -1 : 1) * 0.9) * squeeze;
        const x = mix(CARD_X, pileX, squeeze) + (back % 2 ? -1 : 1) * 6 * squeeze;
        const y = mix(listY, pileY, squeeze);
        const cw = mix(CARD_W, PILE_W, squeeze), ch = mix(cardH, pileH, squeeze);
        const size = mix(stepSize, pileSize, squeeze);
        const label = squeeze > 0.5 ? keys[i] : s;
        const textCol = dim > 0.5 ? S.muted : S.ink;
        return <div key={i} style={{
          position: 'absolute', left: x, top: y + (1 - enter) * 46, width: cw, height: ch,
          transform: `scale(${mix(0.96, 1, enter)}) rotate(${rot}deg)`, transformOrigin: '50% 50%',
          background: '#fff', borderRadius: mix(S.radius, 18, squeeze), boxShadow: S.shadow, opacity: enter,
          display: 'flex', alignItems: 'center', paddingLeft: mix(56, 28, squeeze), gap: mix(34, 18, squeeze), overflow: 'hidden', zIndex: 10 + i,
        }}>
          <span style={{ ...textBase(size, 900), color: S.faint, width: size * 0.9, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
          <span style={{ ...textBase(size, squeeze > 0.5 ? 600 : 500), color: textCol, overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, paddingRight: 20 }}>{label}</span>
        </div>;
      })}
      {/* 现在：标签 + 黑胶囊 */}
      <div style={{
        ...textBase(LABEL_SIZE, 900), position: 'absolute', left: capLeft + 8, top: labelRowY,
        color: S.ink, opacity: textIn, transform: `translateY(${(1 - textIn) * 16}px)`,
      }}>{c.nowLabel}</div>
      <div style={{
        position: 'absolute', left: capCx - w / 2, top: CY - h / 2, width: w, height: h, borderRadius: Math.min(h / 2, capR),
        background: S.dark, boxShadow: S.capsuleShadow, opacity: clamp(nowGrow * 3), overflow: 'hidden', ...center, zIndex: 50,
      }}>
        <span style={{
          ...textBase(nowSize, 900), lineHeight: 1.22, color: '#fff', opacity: textIn, textAlign: 'center',
          transform: `translateX(${(1 - textIn) * 24}px)`, clipPath: `inset(0 ${100 * (1 - textIn)}% 0 0)`,
        }}>{fit.lines.map((l, k) => <div key={k}><HighlightLine line={l} offset={lineOffsets[k]} from={hl[0]} to={hl[1]} /></div>)}</span>
      </div>
    </Handoff>
  </Frame>;
};
