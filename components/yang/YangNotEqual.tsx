// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T05g-NotEqual.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：不等号拆开两个概念（正版 T05g，升级自 L81-B065 前半段）：深色 Mac 窗里概念 A 先立住 → 概念 B 从左往右刷出、
// 与 A 并排（像是一回事）→ 中间落下紫色圆章，先是「=」，一道斜杠划过变成「≠」，两边同时被推开一点；
// symbol 传其他字符（'>'、'≈'）时圆章直接显示该符号。快过渡约 3 秒；长词每边自动折两行保大字。
// 与近名件区别（同源并行）：库内 A 类 YangNotEqualSplit 同出 L81-B065，但那是浅色舞台上的裂开＋底部脚注补完句子、
// 黄铜圆盘；本件是深色窗口内的并排刷出＋紫圆章划杠、无脚注，按库内正版并行先例保留，不是重复集成。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/springAt/cueAt/textWidth 与 Frame/Handoff/MacWindow 已内嵌移植，逻辑与原版一致；
// 原包默认示例已换中性示例。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', windowBody: '#212123', windowBar: '#161618', faint: '#a3a3ab',
  accent: '#8554E8', accentDark: '#D6BEFF', radius: 24, capsuleShadow: '30px 22px 25px #0005',
  shadow: '0 16px 25px 0 rgba(0,0,0,0.1333)', textShadowDark: '8px 9px 5px #000',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, v: number) => a + (b - a) * v;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const q = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * (3 - 2 * v); };
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
const cueAt = (cues: readonly number[] | undefined, i: number, fb: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fb;
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
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
function MacWindow({ box, bar = 90, style, children }: { box: Box; bar?: number; style?: React.CSSProperties; children?: React.ReactNode }) {
  return <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 36, background: S.windowBody, boxShadow: S.shadow, overflow: 'hidden', ...style }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: box.w, height: bar, background: S.windowBar }}>
      <div style={{ position: 'absolute', left: 36, top: (bar - 26) / 2, display: 'flex', gap: 14 }}>
        {['#8554E8', '#aaa', '#eee'].map((col, i) => <div key={i} style={{ width: 26, height: 26, borderRadius: 13, background: col }} />)}
      </div>
    </div>
    <div style={{ position: 'absolute', left: 0, top: bar, width: box.w, height: box.h - bar }}>{children}</div>
  </div>;
}

export type YangNotEqualProps = YangHandoffProps & {
  left: string;        // 概念 A（先在）
  right: string;       // 概念 B（随后刷出）
  symbol: string;      // 圆章里的关系符号；'≠' 时画“= 再被斜杠划开”，其他字符（如 '>'、'≈'）直接显示
  cues?: number[];     // [0]=概念 B 出现，[1]=不等号落下；不传用默认 0.5 / 1.0
};

export const yangNotEqualDefaults: YangNotEqualProps = {
  left: '收藏',
  right: '学会',
  symbol: '≠',
};

const MAX_SIZE = 176;
const SPLIT_BELOW = 112;
const INNER_W = 1440;

function split2(s: string): string[] {
  const chars = Array.from(s);
  if (chars.length < 3) return [s];
  const half = textWidth(s, 1) / 2;
  let best = Math.ceil(chars.length / 2), score = Infinity, acc = 0;
  for (let i = 1; i < chars.length; i++) {
    acc += textWidth(chars[i - 1], 1);
    const sc = Math.abs(acc - half) + (/[，,、：:；; ]/.test(chars[i - 1]) ? -0.6 : 0);
    if (sc < score) { score = sc; best = i; }
  }
  return [chars.slice(0, best).join('').trim(), chars.slice(best).join('').trim()];
}

export const YangNotEqual: React.FC<Partial<YangNotEqualProps>> = (props) => {
  const c = { ...yangNotEqualDefaults, ...props };
  const t = useT();

  const RING = 1.32, GAP = 0.42, PUSH = 0.14;
  const fixedUnits = RING + GAP * 2 + PUSH * 2;
  const unitsOf = (lines: string[]) => Math.max(1, ...lines.map((l) => textWidth(l, 1)));
  let L = [c.left], R = [c.right];
  let size = Math.min(MAX_SIZE, INNER_W / (unitsOf(L) + unitsOf(R) + fixedUnits));
  if (size < SPLIT_BELOW) {
    L = split2(c.left); R = split2(c.right);
    size = Math.min(MAX_SIZE * 0.86, INNER_W / (unitsOf(L) + unitsOf(R) + fixedUnits));
  }
  const lh = size * 1.16;
  const lw = unitsOf(L) * size, rw = unitsOf(R) * size;
  const ring = size * RING;
  const blockW = lw + rw + size * fixedUnits;
  const blockH = Math.max(L.length, R.length) * lh;

  const BAR = 90;
  const winW = Math.min(1760, Math.max(1100, blockW + 300));
  const winH = Math.min(880, Math.max(640, blockH + BAR + 380));
  const win = { x: 960 - winW / 2, y: Math.max(130, 560 - winH / 2), w: winW, h: winH };
  const cx = winW / 2, cy = (winH - BAR) / 2;

  const enter = p(t, 0, 0.4);
  const bAt = cueAt(c.cues, 0, 0.5);
  const bIn = p(t, bAt, bAt + 0.4);
  const sAt = Math.max(bAt + 0.2, cueAt(c.cues, 1, 1.0));
  const ringS = springAt(t, sAt, 0.6);
  const isNe = c.symbol === '≠';
  const slash = p(t, sAt + 0.24, sAt + 0.46);
  const apart = q(t, sAt + 0.26, sAt + 0.56);

  const pushPx = size * PUSH * (isNe ? apart : ringS > 0.6 ? 1 : 0);
  const leftX = cx - ring / 2 - size * GAP - lw - pushPx;
  const rightX = cx + ring / 2 + size * GAP + pushPx;
  const word = (lines: string[], x: number, w: number, extra: React.CSSProperties) =>
    <div style={{ position: 'absolute', left: x, top: cy - (lines.length * lh) / 2, width: w, ...extra }}>
      {lines.map((l, i) => <div key={i} style={{ ...textBase(size, 400), color: '#fff', textShadow: S.textShadowDark, textAlign: 'center' }}>{l}</div>)}
    </div>;

  const ink = S.ink, sw = ring * 0.085;
  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <MacWindow box={{ ...win, y: win.y + (1 - enter) * 50 }} bar={BAR}
        style={{ opacity: clamp(t / 0.1), transform: `scale(${mix(0.94, 1, enter)})`, transformOrigin: '50% 50%' }}>
        {word(L, leftX, lw, { opacity: clamp(enter * 1.4), transform: `translateY(${(1 - enter) * 20}px)` })}
        {word(R, rightX, rw, {
          clipPath: `inset(-20% ${100 * (1 - bIn)}% -20% -10%)`, transform: `translateX(${(1 - bIn) * -30}px)`,
        })}
        {ringS > 0 && <div style={{
          position: 'absolute', left: cx - ring / 2, top: cy - ring / 2, width: ring, height: ring, borderRadius: ring / 2,
          background: S.accentDark, transform: `scale(${ringS})`, boxShadow: '0 10px 22px #0006',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isNe ? <svg width={ring} height={ring} viewBox="0 0 100 100" style={{ position: 'absolute', left: 0, top: 0 }}>
            <line x1="29" y1="40" x2="71" y2="40" stroke={ink} strokeWidth={sw / ring * 100} strokeLinecap="round" />
            <line x1="29" y1="60" x2="71" y2="60" stroke={ink} strokeWidth={sw / ring * 100} strokeLinecap="round" />
            <line x1="61" y1="22" x2="39" y2="78" stroke={ink} strokeWidth={sw / ring * 100} strokeLinecap="round"
              pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - slash} />
          </svg> : <span style={{ ...textBase(Math.min(ring * 0.62, (ring * 0.78) / Math.max(1, textWidth(c.symbol, 1))), 900), color: ink, lineHeight: 1 }}>{c.symbol}</span>}
        </div>}
      </MacWindow>
    </Handoff>
  </Frame>;
};
