// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T02e-ThreeMerge.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：三项汇聚长胶囊（正版 T02e，升级自 107-04）：2–4 项依次建立 → 汇聚到中心缩小 → 旧项淡出 →
// 结果长胶囊从汇聚处弹出来落定，副句跟随。每项都给 media 时显示证据卡，否则显示黑胶囊。
// 与近名件区别：库内 A 类 YangTripleConverge 与本件同源（同一原场景 107-04）——A 类件是按实测轨迹重建的固定版，
// 本件是官方参数化正版（项数/媒体/文案全走 props、字号按内容自适应），按库内既有先例
// （YangStepChain/YangStepChainPro、YangTerminalRun/YangTerminalPush）并行保留、用途以本件为准，不是重复集成。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/springAt/cueAt/textWidth 与 Frame/Handoff/Media/Pill 已内嵌移植，逻辑与原版一致；
// 原包默认示例（原版产品与素材）已换中性示例，media 走 props、缺省无媒体走黑胶囊形态。
// 舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  radius: 24, capsuleShadow: '30px 22px 25px #0005', shadow: '0 16px 25px 0 rgba(0,0,0,0.1333)',
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
const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
function Media({ src, start = 0, box, radius = 0, style }: { src?: string; start?: number; box: Box; radius?: number; style?: React.CSSProperties }) {
  const { fps } = useVideoConfig();
  if (!src) return <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: radius, background: 'linear-gradient(135deg,#ededf1,#dcdce2)', overflow: 'hidden', ...style }}>
    <div style={{ position: 'absolute', inset: Math.max(10, Math.min(18, box.h * 0.08)), border: '3px dashed #b9b9c0', borderRadius: Math.max(8, radius - 6) }} />
  </div>;
  const common: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: radius, overflow: 'hidden', background: '#fff', ...style }}>
    {IMG_EXT.test(src)
      ? <Img src={staticFile(src)} style={common} />
      : <OffthreadVideo muted src={staticFile(src)} startFrom={Math.round(start * fps)} style={common} />}
  </div>;
}
function Pill({ box, style, children }: { box: Box; style?: React.CSSProperties; children?: React.ReactNode }) {
  return <div style={{
    position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.h / 2,
    background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
  }}>{children}</div>;
}

export type YangMergeItem = { label: string; media?: string };
export type YangThreeMergeProps = YangHandoffProps & {
  items: YangMergeItem[];   // 2–4 项；每项都给 media 时显示证据卡，否则显示黑胶囊
  result: string;       // 汇聚后的长胶囊结论
  highlight: string;    // result 里染紫的部分（深底 #D6BEFF）；整句都强调就写整句
  sub?: string;         // 胶囊下方的一句补充，可省
  cues?: number[];      // [0..n-1] 各项出现；[n] 开始汇聚
};

export const yangThreeMergeDefaults: YangThreeMergeProps = {
  items: [{ label: '找资料' }, { label: '写初稿' }, { label: '做成片' }],
  result: '一条龙做完',
  highlight: '一条龙',
  sub: '中间不用换工具',
};

function splitTwo(s: string): string[] {
  const parts = s.split(' ');
  if (parts.length < 2) return [s];
  const half = textWidth(s, 1) / 2;
  let best = 1, bestD = Infinity;
  for (let i = 1; i < parts.length; i++) {
    const d = Math.abs(textWidth(parts.slice(0, i).join(' '), 1) - half);
    if (d < bestD) { bestD = d; best = i; }
  }
  return [parts.slice(0, best).join(' '), parts.slice(best).join(' ')];
}

const USABLE = 1680;
const GAP = 70;

export const YangThreeMerge: React.FC<Partial<YangThreeMergeProps>> = (props) => {
  const c = { ...yangThreeMergeDefaults, ...props };
  const t = useT();
  const items = c.items.slice(0, 4);
  const n = Math.max(1, items.length);
  const cards = items.every((it) => !!it.media);

  const step = n >= 4 ? 0.86 : 1.12;
  const starts = items.map((_, i) => cueAt(c.cues, i, 0.08 + i * step));
  const mergeAt = cueAt(c.cues, n, starts[n - 1] + 1.05);
  const merge = q(t, mergeAt, mergeAt + 0.72);
  const resultAt = mergeAt + 0.48;
  const result = t >= resultAt ? 1 : 0;
  const grow = springAt(t, resultAt, 0.62);
  const gone = q(t, resultAt + 0.05, resultAt + 0.3);
  const subIn = p(t, resultAt + 0.35, resultAt + 0.8);

  const rSize = Math.min(150, 1250 / Math.max(1, textWidth(c.result, 1)));
  const pillH = Math.max(250, rSize * 2.3);
  const pillW = Math.max(pillH * 2.6, textWidth(c.result, rSize) + rSize * 2.4);
  const subSize = c.sub ? Math.min(68, 1500 / Math.max(1, textWidth(c.sub, 1))) : 0;
  const groupH = pillH + (c.sub ? 40 + subSize * 1.16 : 0);
  const pillY = 540 - groupH / 2;
  const pillCY = pillY + pillH / 2;
  const hi = c.highlight && c.result.includes(c.highlight) ? c.highlight : '';
  const [before, after = ''] = hi ? c.result.split(hi) : [c.result, ''];

  const colW = Math.min(cards ? 620 : 560, (USABLE - (n - 1) * GAP) / n);
  const rowW = n * colW + (n - 1) * GAP;
  const x0 = 960 - rowW / 2;
  const cardH = colW * (n >= 4 ? 0.8 : 0.66);
  const oneLine = Math.min(84, (colW * 0.94) / Math.max(1, ...items.map((it) => textWidth(it.label, 1))));
  const twoLines = oneLine < 60 && items.some((it) => it.label.includes(' '));
  const labelLines = items.map((it) => (twoLines ? splitTwo(it.label) : [it.label]));
  const labelSize = twoLines
    ? Math.min(84, (colW * 0.94) / Math.max(1, ...labelLines.flat().map((l) => textWidth(l, 1))))
    : oneLine;
  const blockH = cards ? cardH + 44 + labelSize * 1.16 * (twoLines ? 2 : 1) : 0;
  const cardY = 540 - blockH / 2;
  const pillTextSize = Math.min(n <= 2 ? 130 : 116, (colW - 110) / Math.max(1, ...items.map((it) => textWidth(it.label, 1))));
  const itemPillH = Math.max(150, pillTextSize * 1.9);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {items.map((it, i) => {
        const e = p(t, starts[i], starts[i] + 0.4);
        const alpha = e * (1 - gone);
        if (alpha <= 0.001) return null;
        const colX = x0 + i * (colW + GAP);
        if (cards) {
          const w = mix(colW, colW * 0.42, merge), h = mix(cardH, cardH * 0.42, merge);
          const x = mix(colX, 960 - w / 2, merge);
          const y = mix(cardY + (1 - e) * 45, pillCY - h / 2, merge);
          return <React.Fragment key={i}>
            <Media src={it.media!} box={{ x, y, w, h }} radius={S.radius} style={{ opacity: alpha, boxShadow: S.shadow, transform: `scale(${mix(0.96, 1, e)})` }} />
            <div style={{ ...textBase(labelSize, 900), position: 'absolute', left: colX, width: colW, textAlign: 'center',
              top: cardY + cardH + 44 + (1 - e) * 30, opacity: alpha * (1 - clamp(merge * 1.6)), color: S.ink }}>
              {labelLines[i].map((l, j) => <div key={j}>{l}</div>)}</div>
          </React.Fragment>;
        }
        const w0 = Math.min(colW, textWidth(it.label, pillTextSize) + pillTextSize * 2.2);
        const w = mix(w0, w0 * 0.5, merge), h = mix(itemPillH, itemPillH * 0.6, merge);
        const cx = mix(colX + colW / 2, 960, merge);
        return <Pill key={i} box={{ x: cx - w / 2, y: pillCY - h / 2 + (1 - e) * 28, w, h }}
          style={{ opacity: alpha, clipPath: `inset(0 ${100 * (1 - e)}% 0 0 round ${h / 2}px)` }}>
          <span style={{ ...textBase(pillTextSize * mix(1, 0.6, merge), 400), color: '#fff', opacity: p(t, starts[i] + 0.12, starts[i] + 0.4) * (1 - clamp(merge * 3)) }}>{it.label}</span>
        </Pill>;
      })}

      {result > 0 && <Pill box={{ x: 960 - pillW / 2, y: pillY, w: pillW, h: pillH }}
        style={{ opacity: result, transform: `scale(${mix(0.3, 1, grow)})` }}>
        <span style={{ ...textBase(rSize, 400), color: '#fff' }}>
          {before}{hi && <span style={{ color: accentOn(true) }}>{hi}</span>}{after}
        </span>
      </Pill>}
      {c.sub && subIn > 0 && <div style={{ ...textBase(subSize, 900), position: 'absolute', left: 0, width: 1920, textAlign: 'center',
        top: pillY + pillH + 40 + (1 - subIn) * 16, opacity: subIn, color: S.ink }}>{c.sub}</div>}
    </Handoff>
  </Frame>;
};
