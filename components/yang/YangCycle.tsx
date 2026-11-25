// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T03c-Cycle.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：三者循环互通（正版 T03c，升级自 L81-B064）：深色 Mac 窗里 3 个节点三角排布（或 4 个四角环），
// 双向箭头从中点向两端依次画出 → 一道亮光沿环逐个点亮一圈表达「互通」→ 窗内材料失焦压暗退后，
// 前景落一句结论、只染紫一处。节点/结论/时间点全走 props，字号按最长节点自适应。
// 与近名件区别：库内 A 类 YangBlurListFocus 的头注同引 L81-B064——原场景里「列表去模糊」与「三角循环」是两个机制，
// A 类只提炼了前者；本件是后者（窗口内节点环＋结论），不是重复集成。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/cueAt/textWidth 与 Frame/Handoff/MacWindow 已内嵌移植，逻辑与原版一致；
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
const cueAt = (cues: readonly number[] | undefined, i: number, fb: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fb;
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
const accentOn = (dark: boolean) => (dark ? '#D6BEFF' : '#8554E8');
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
function MacWindow({ box, bar = 90 }: { box: Box; bar?: number }) {
  return <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 36, background: S.windowBody, boxShadow: S.shadow, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: box.w, height: bar, background: S.windowBar }}>
      <div style={{ position: 'absolute', left: 36, top: (bar - 26) / 2, display: 'flex', gap: 14 }}>
        {['#8554E8', '#aaa', '#eee'].map((col, i) => <div key={i} style={{ width: 26, height: 26, borderRadius: 13, background: col }} />)}
      </div>
    </div>
  </div>;
}

export type YangCycleProps = YangHandoffProps & {
  nodes: string[];      // 3–4 个环节，按循环顺序
  result: string;       // 落定的结论
  highlight: string;    // result 里染紫的部分（深窗内 → #D6BEFF）
  cues?: number[];      // [0..n-1] 各环节出现；[n] 结论落定
};

export const yangCycleDefaults: YangCycleProps = {
  nodes: ['记录', '整理', '找回'],
  result: '记下的东西随时能找回',
  highlight: '随时能找回',
};

const WIN = { x: 260, y: 140, w: 1400, h: 840 };
const BODY_CY = WIN.y + 90 + (WIN.h - 90) / 2;

export const YangCycle: React.FC<Partial<YangCycleProps>> = (props) => {
  const c = { ...yangCycleDefaults, ...props };
  const t = useT();
  const nodes = c.nodes.slice(0, 4);
  const n = nodes.length;

  const longest = Math.max(...nodes.map((s) => textWidth(s, 1)));
  const size = n === 3
    ? Math.min(130, 470 / Math.max(1, longest))
    : Math.min(130, 265 / (longest / 2 + 0.42));
  const halfMax = (longest * size) / 2 + size * 0.42;
  const rx = Math.min(650 - halfMax, Math.max(380, halfMax + 200));
  const pts = n === 3
    ? [{ x: 960, y: BODY_CY - 225 }, { x: 960 + 400, y: BODY_CY + 205 }, { x: 960 - 400, y: BODY_CY + 205 }]
    : [{ x: 960 - rx, y: BODY_CY - 190 }, { x: 960 + rx, y: BODY_CY - 190 }, { x: 960 + rx, y: BODY_CY + 190 }, { x: 960 - rx, y: BODY_CY + 190 }];
  const half = nodes.map((s) => ({ w: textWidth(s, size) / 2 + size * 0.42, h: size * 0.62 + size * 0.3 }));

  const appear = nodes.map((_, i) => cueAt(c.cues, i, 0.25 + i * (n === 3 ? 0.5 : 0.42)));
  const edgeAt = nodes.map((_, i) => (i < n - 1 ? Math.max(appear[i], appear[i + 1]) + 0.1 : appear[n - 1] + 0.55));
  const loopAt = edgeAt[n - 1] + 0.6;
  const step = 0.3;
  const resultAt = cueAt(c.cues, n, loopAt + n * step + 0.25);
  const recede = q(t, resultAt - 0.05, resultAt + 0.45);
  const res = p(t, resultAt + 0.1, resultAt + 0.6);
  const enter = p(t, 0, 0.5);

  const trim = (a: number, b: number) => {
    const A = pts[a], B = pts[b];
    const dx = B.x - A.x, dy = B.y - A.y;
    const k = (h: { w: number; h: number }) => Math.min(h.w / Math.max(1e-6, Math.abs(dx)), h.h / Math.max(1e-6, Math.abs(dy)));
    const ka = k(half[a]), kb = k(half[b]);
    return { x0: A.x + dx * ka, y0: A.y + dy * ka, x1: B.x - dx * kb, y1: B.y - dy * kb };
  };
  const head = (x: number, y: number, ux: number, uy: number, s: number) =>
    `M${x - ux * s - uy * s * 0.72} ${y - uy * s + ux * s * 0.72} L${x} ${y} L${x - ux * s + uy * s * 0.72} ${y - uy * s - ux * s * 0.72}`;

  const litNode = (i: number) => {
    const a = loopAt + i * step;
    return clamp((t - a) / 0.08) * (1 - clamp((t - a - step) / 0.12));
  };
  const litEdge = (i: number) => {
    const a = loopAt + i * step + step * 0.5;
    return clamp((t - a) / 0.1) * (1 - clamp((t - a - step) / 0.15));
  };

  const hi = c.highlight && c.result.includes(c.highlight) ? c.highlight : '';
  const [before, after = ''] = hi ? c.result.split(hi) : [c.result, ''];
  const rSize = Math.min(150, 1180 / Math.max(1, textWidth(c.result, 1)));

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, opacity: enter, transform: `translateY(${(1 - enter) * 50}px)` }}>
        <MacWindow box={WIN} />
        <div style={{ position: 'absolute', left: WIN.x, top: WIN.y + 90, width: WIN.w, height: WIN.h - 90, overflow: 'hidden', borderRadius: '0 0 36px 36px' }}>
          <div style={{ position: 'absolute', left: -WIN.x, top: -(WIN.y + 90), width: 1920, height: 1080,
            filter: recede > 0 ? `blur(${recede * 16}px)` : undefined, opacity: mix(1, 0.32, recede) }}>
            <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
              {nodes.map((_, i) => {
                const j = (i + 1) % n;
                if (n === 2 && i === 1) return null;
                const e = trim(i, j);
                const prog = p(t, edgeAt[i], edgeAt[i] + 0.45);
                if (prog <= 0) return null;
                const mx = (e.x0 + e.x1) / 2, my = (e.y0 + e.y1) / 2;
                const ax = mix(mx, e.x0, prog), ay = mix(my, e.y0, prog), bx = mix(mx, e.x1, prog), by = mix(my, e.y1, prog);
                const len = Math.hypot(e.x1 - e.x0, e.y1 - e.y0), ux = (e.x1 - e.x0) / len, uy = (e.y1 - e.y0) / len;
                const glow = litEdge(i);
                const col = glow > 0 ? `rgba(255,255,255,${mix(0.62, 1, glow)})` : S.faint;
                const sw = Math.max(6, size * 0.07);
                return <g key={i} stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <path d={`M${ax} ${ay} L${bx} ${by}`} />
                  {prog > 0.97 && <><path d={head(e.x1, e.y1, ux, uy, size * 0.24)} /><path d={head(e.x0, e.y0, -ux, -uy, size * 0.24)} /></>}
                </g>;
              })}
            </svg>
            {nodes.map((s, i) => {
              const e = p(t, appear[i], appear[i] + 0.42);
              if (e <= 0) return null;
              const lit = litNode(i);
              return <div key={i} style={{ ...textBase(size, 900), position: 'absolute', left: pts[i].x - textWidth(s, size) / 2, top: pts[i].y - size * 0.58,
                color: lit > 0.5 ? accentOn(true) : '#fff', textShadow: S.textShadowDark, opacity: e,
                transform: `translateY(${(1 - e) * 22}px) scale(${1 + 0.06 * lit})` }}>{s}</div>;
            })}
          </div>
        </div>
        {res > 0 && <div style={{ position: 'absolute', left: WIN.x, width: WIN.w, top: BODY_CY - rSize * 0.58 + (1 - res) * 24, textAlign: 'center',
          ...textBase(rSize, 400), color: '#fff', textShadow: S.textShadowDark, opacity: res }}>
          {before}{hi && <span style={{ color: accentOn(true) }}>{hi}</span>}{after}
        </div>}
      </div>
    </Handoff>
  </Frame>;
};
