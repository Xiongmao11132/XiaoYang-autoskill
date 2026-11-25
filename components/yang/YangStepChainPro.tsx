/**
 * YangStepChainPro — 步骤折行串起（参数化正版 T03e）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source file: fred-wave2-42-20261012/src/components/T03e-StepChain.tsx (+ src/kit/{theme.ts,ui.tsx});
 * package publicly released 2026-10-27 on the original visual library.
 * Downloaded 2026-11-02 via the site's public asset route, SHA-256 verified against the original
 * member-package manifest (fa5ab7e7…97d63ef, 34,144,141 B) and imported with the original
 * scripts/assets.py; archive kept in the original package download dir (downloads-b/fred-wave2-42-source.zip).
 *
 * Integration notes: Sfx and Brand corner marks are NOT integrated (silent, no watermark);
 * fonts mapped to the library FONT (../src/theme); colors mapped to the library palette.
 * Defaults replaced with neutral workflow steps (the original defaults were its own video pipeline).
 * 与 A 类提炼件 YangStepChain 并行不互替：本件是正版——深色 MacWindow 内 3–9 步按最优分行
 * 自动排布、逐步出现、行内短箭头逐段画出、行尾 S 形绕回线拐进下一行行首；提炼件是浅底
 * 居中大字 + S 形连接线的抽取版，几何与载体都不同。
 *
 * Mechanics: steps appear one by one (cue-driven, wraps get +0.3s so the line can travel);
 * each connector draws itself right before the next step lands — a short arrow inside a row,
 * an S-shaped wrap line around the row end into the next row's head. Layout is computed:
 * row splits (3/4/2/5 per row candidates) and font size are chosen to fit width ≤1760 and
 * height limits; a single row degrades to one big flow line.
 * Layout: 1920×1080 logical stage, scaled by host width (Frame).
 */
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { FONT } from '../src/theme';

const S = {
  bg: '#fff',
  ink: '#19191c',
  dark: '#19191c',
  muted: '#83838a',
  faint: '#b9b9bf',
  accent: '#8554E8',
  accentDark: '#D6BEFF',
};

export type Box = { x: number; y: number; w: number; h: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const p = (t: number, a: number, b: number) => easeOut(clamp01((t - a) / (b - a)));
const q = (t: number, a: number, b: number) => easeInOut(clamp01((t - a) / (b - a)));
export const cueAt = (cues: number[] | undefined, i: number, fallback: number) =>
  cues && cues[i] !== undefined ? cues[i] : fallback;

const isW = (ch: string) => /[一-鿿＀-￯]/.test(ch);
export function textWidth(text: string, size: number) {
  let w = 0;
  for (const ch of text) w += isW(ch) ? 0.94 : 0.56;
  return w * size;
}
const abs = (b: Box): React.CSSProperties => ({ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h });
const textBase = (size: number, weight = 500): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  lineHeight: 1.16,
  letterSpacing: 0,
  whiteSpace: 'nowrap',
});

function useT() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
}

function Frame({ children }: { children: React.ReactNode }) {
  const { width } = useVideoConfig();
  const scale = width / 1920;
  return (
    <AbsoluteFill style={{ backgroundColor: S.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        {children}
      </div>
    </AbsoluteFill>
  );
}

export type YangHandoffProps = { enter?: number; exit?: number; exitAt?: number };

function Handoff({ enter = 0, exit = 0, exitAt = 0, children }: YangHandoffProps & { children: React.ReactNode }) {
  const t = useT();
  const k = enter > 0 ? q(t, 0, enter) : 1;
  const out = exit > 0 ? q(t, exitAt, exitAt + exit) : 0;
  const ty = (1 - k) * 46 - out * 46;
  const blur = (1 - k) * 8 + out * 8;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, k * 1.6) * (1 - out), transform: `translateY(${ty}px)`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
      {children}
    </div>
  );
}

const WIN_BAR = '#161618';
const WIN_BODY = '#212123';
const WIN_SHADOW = '0 24px 48px 0 rgba(0,0,0,0.28), 0 8px 16px 0 rgba(0,0,0,0.2)';

function MacWindow({ box, title, style }: { box: Box; title?: string; style?: React.CSSProperties }) {
  const bar = 90;
  const dot = Math.round(bar * 0.267);
  return (
    <div style={{ ...abs(box), borderRadius: 36, overflow: 'hidden', background: WIN_BODY, boxShadow: WIN_SHADOW, ...style }}>
      <div style={{ height: bar, background: WIN_BAR, display: 'flex', alignItems: 'center', gap: dot, paddingLeft: bar * 0.63, position: 'relative' }}>
        {[S.accent, '#aaa', '#eee'].map((cc) => (
          <span key={cc} style={{ width: dot, height: dot, borderRadius: dot, background: cc }} />
        ))}
        {title && (
          <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontSize: bar * 0.36, color: '#8d8d93', fontWeight: 500 }}>
            {title}
          </div>
        )}
      </div>
    </div>
  );
}

export type YangStepChainProProps = YangHandoffProps & {
  steps: string[];      // 3–9 个步骤
  title?: string;       // 窗口标题栏文字，可省
  highlight?: number;   // 需要染紫的步骤序号（从 0 开始），不需要就不传
  cues?: number[];      // [i] = 第 i 步出现（秒）
};

export const yangStepChainProDefaults: YangStepChainProProps = {
  steps: ['收集素材', '筛选要点', '列出提纲', '补齐证据', '排定顺序', '写成初稿', '逐项核对', '定稿交付'],
  title: '一套完整流程',
};

const INNER_H = 560;
const ARROW = 0.95;
const PAD = 0.32;
const PITCH = 2.3;

type Plan = { rows: number[][]; size: number };

function splitRows(n: number, per: number): number[][] {
  const rows = Math.ceil(n / per);
  const out: number[][] = [];
  let k = 0;
  for (let r = 0; r < rows; r++) {
    const cnt = Math.ceil((n - k) / (rows - r));
    out.push(Array.from({ length: cnt }, (_, j) => k + j));
    k += cnt;
  }
  return out;
}

function plan(steps: string[]): Plan {
  const n = steps.length;
  let best: Plan | null = null;
  for (const per of [3, 4, 2, 5]) {
    const rows = splitRows(n, per);
    if (n >= 4 && rows.length < 2) continue;
    if (rows.length > 4) continue;
    const widest = Math.max(...rows.map((r) => r.reduce((w, i) => w + textWidth(steps[i], 1), 0) + (r.length - 1) * (ARROW + PAD * 2)));
    const byW = 1740 / (widest + (rows.length > 1 ? 4.9 : 2.6));
    const byH = INNER_H / ((rows.length - 1) * PITCH + 1.2);
    const size = Math.min(rows.length === 1 ? 140 : 96, byW, byH);
    const score = size + (per === 3 ? 4 : 0);
    if (!best || score > best.size + (best.rows[0].length === 3 ? 4 : 0)) best = { rows, size };
  }
  return best ?? { rows: splitRows(n, 3), size: 56 };
}

function Arrowhead({ x, y, s, opacity }: { x: number; y: number; s: number; opacity: number }) {
  return (
    <path d={`M${x - s} ${y - s * 0.75} L${x} ${y} L${x - s} ${y + s * 0.75}`} fill="none" stroke={S.faint}
      strokeWidth={Math.max(5, s * 0.3)} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
  );
}

export function YangStepChainPro(props: Partial<YangStepChainProProps>) {
  const c = { ...yangStepChainProDefaults, ...props };
  const t = useT();
  const steps = c.steps.slice(0, 9);
  const n = steps.length;
  const { rows, size } = plan(steps);

  const pad = PAD * size, arrow = ARROW * size, pitch = PITCH * size;
  const rowW = rows.map((r) => r.reduce((w, i) => w + textWidth(steps[i], size), 0) + (r.length - 1) * (arrow + pad * 2));
  const contentW = Math.max(...rowW);
  const contentH = (rows.length - 1) * pitch + size * 1.2;
  const bulge = rows.length > 1 ? size * 1.15 : 0;
  const winW = Math.min(1760, Math.max(1100, contentW + 2 * (bulge + size * 1.3)));
  const winH = Math.min(820, contentH + 90 + 2 * Math.max(95, size * 1.0));
  const win = { x: 960 - winW / 2, y: 540 - winH / 2 + 10, w: winW, h: winH };
  const left = 960 - contentW / 2;
  const top = win.y + 90 + (winH - 90 - contentH) / 2;
  const pos: { x: number; w: number; cy: number; row: number }[] = [];
  rows.forEach((r, ri) => {
    let x = left;
    r.forEach((i) => {
      const w = textWidth(steps[i], size);
      pos[i] = { x, w, cy: top + ri * pitch + size * 0.6, row: ri };
      x += w + pad * 2 + arrow;
    });
  });

  const wraps = rows.length - 1;
  const base = Math.min(1.0, (5.5 - 0.3 * wraps) / Math.max(1, n - 1));
  const appear: number[] = [];
  steps.forEach((_, i) => {
    const fallback = i === 0 ? 0.2 : appear[i - 1] + base + (pos[i].row !== pos[i - 1].row ? 0.3 : 0);
    appear.push(cueAt(c.cues, i, fallback));
  });
  const enter = p(t, 0, 0.5);

  const links = steps.slice(0, -1).map((_, i) => {
    const a = pos[i], b = pos[i + 1];
    const wrap = a.row !== b.row;
    const dur = wrap ? 0.6 : 0.32;
    const end = appear[i + 1] - 0.04;
    const start = Math.max(appear[i] + 0.15, end - dur);
    const prog = p(t, start, end);
    let d: string, tip: { x: number; y: number };
    if (!wrap) {
      const x0 = a.x + a.w + pad, x1 = b.x - pad;
      d = `M${x0} ${a.cy} L${x1} ${a.cy}`;
      tip = { x: x1, y: a.cy };
    } else {
      const ex = a.x + a.w + pad * 0.7, lx = b.x - pad;
      const mid = (a.cy + b.cy) / 2;
      d = `M${ex} ${a.cy} C${ex + bulge} ${a.cy} ${ex + bulge} ${mid} ${ex} ${mid} L${lx - pad} ${mid} ` +
        `C${lx - pad - bulge} ${mid} ${lx - pad - bulge} ${b.cy} ${lx} ${b.cy}`;
      tip = { x: lx, y: b.cy };
    }
    return { d, tip, prog, wrap, start };
  });

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        <MacWindow box={{ ...win, y: win.y + (1 - enter) * 50 }} title={c.title} style={{ opacity: enter }} />
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - enter) * 50}px)` }}>
          <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
            {links.map((l, i) => l.prog > 0 && (
              <React.Fragment key={i}>
                <path d={l.d} pathLength={1} fill="none" stroke={S.faint} strokeWidth={Math.max(5, size * 0.06)} strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="1 1" strokeDashoffset={1 - l.prog} />
                <Arrowhead x={l.tip.x} y={l.tip.y} s={size * 0.2} opacity={l.prog > 0.92 ? 1 : 0} />
              </React.Fragment>
            ))}
          </svg>
          {steps.map((s, i) => {
            const e = p(t, appear[i], appear[i] + 0.42);
            if (e <= 0) return null;
            return (
              <div key={i} style={{ ...textBase(size, 900), position: 'absolute', left: pos[i].x, top: pos[i].cy - size * 0.58,
                color: c.highlight === i ? S.accentDark : '#fff', opacity: e, transform: `translateX(${(1 - e) * -18}px)` }}>{s}</div>
            );
          })}
        </div>
      </Handoff>
    </Frame>
  );
}

export { interpolate };
