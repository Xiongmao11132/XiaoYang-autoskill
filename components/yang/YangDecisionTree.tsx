// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T04g-DecisionTree.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：该选哪条路（正版 T04g）——一个问题 → 分叉成几条路，按条件落到推荐答案。
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

export type YangDecisionBranch = {
  condition: string;   // 挂在路上的条件
  answer: string;      // 路尽头的答案
  note?: string;       // 答案下的一句补充（可省）
};
export type YangDecisionTreeProps = YangHandoffProps & {
  question: string;          // 根问题
  branches: YangDecisionBranch[]; // 2–3 条
  recommend: number;         // 推荐第几条（从 0 开始）；-1 表示不推荐
  cues?: number[];           // [0..n-1] 第 i 条路出现；[n] 沿推荐路走下去
};

// 113 期结尾建议：偶尔用 → 官方接口；想握在手里 / 想比一比 → 租机器部署开源版，先租一两天试
export const yangDecisionTreeDefaults: YangDecisionTreeProps = {
  question: '想用 JEV，走哪条路？',
  branches: [
    { condition: '偶尔用一用', answer: '直接调官方接口', note: '最省事' },
    { condition: '想握在自己手里 / 想比一比', answer: '租机器部署开源版', note: '先租一两天试一试' },
  ],
  recommend: 1,
};

// 锐字真言的拉丁字形不适合产品名：拉丁片段改用 MiSans Heavy
function DisplayText({ text, size, color }: { text: string; size: number; color: string }) {
  const runs = text.match(/[\u0000-ÿ]+|[^\u0000-ÿ]+/g) ?? [text];
  return <span style={{ ...textBase(size, 400, S.display), color }}>
    {runs.map((r, i) => /^[\u0000-ÿ]+$/.test(r)
      ? <span key={i} style={{ fontFamily: S.body, fontWeight: 900 }}>{r}</span>
      : <React.Fragment key={i}>{r}</React.Fragment>)}
  </span>;
}

const ROOT_TOP = 168;
const LY = 600;            // 答案卡顶边
const R = 30;              // 拐角半径

export function YangDecisionTree(props: Partial<YangDecisionTreeProps>) {
  const c = { ...yangDecisionTreeDefaults, ...props };
  const t = useT();
  const br = c.branches.slice(0, 3);
  const n = Math.max(1, br.length);
  const rec = c.recommend >= 0 && c.recommend < n ? c.recommend : -1;

  // ---- 几何 ----
  const rootSize = Math.min(84, 1200 / Math.max(1, textWidth(c.question, 1)));
  const rootH = rootSize * 1.75, rootW = textWidth(c.question, rootSize) + rootSize * 1.6;
  const rootBottom = ROOT_TOP + rootH;
  const splitY = rootBottom + 64;
  const maxLW = n === 1 ? 760 : n === 2 ? 660 : 500;
  // 卡宽贴合内容：短答案不撑成大白卡
  const LW = Math.min(maxLW, Math.max(400, ...br.map((b) => Math.max(textWidth(b.answer, 62), textWidth(b.note ?? '', 40)) + 150)));
  const span = n === 1 ? 0 : n === 2 ? 840 : 1120;
  const bx = (i: number) => (n === 1 ? 960 : 960 - span / 2 + (span / (n - 1)) * i);
  const ansSize = Math.min(62, ...br.map((b) => (LW - 90) / Math.max(1, textWidth(b.answer, 1))));
  const noteSize = Math.max(30, Math.min(40, ...br.filter((b) => b.note).map((b) => (LW - 90) / Math.max(1, textWidth(b.note ?? '', 1)))));
  const hasNote = br.some((b) => b.note);
  const LH = 40 * 2 + ansSize * 1.16 + (hasNote ? 14 + noteSize * 1.16 : 0);
  const chipSize = Math.max(30, Math.min(40, ...br.map((b) => (LW - 60) / Math.max(1, textWidth(b.condition, 1)))));
  const chipH = chipSize * 1.95;
  const chipY = (splitY + LY) / 2 + 6 - chipH / 2;

  const pathOf = (i: number) => {
    const x = bx(i);
    if (Math.abs(x - 960) < 1) return `M960 ${rootBottom} L960 ${LY}`;
    const s = Math.sign(x - 960);
    return `M960 ${rootBottom} L960 ${splitY - R} Q960 ${splitY} ${960 + s * R} ${splitY} L${x - s * R} ${splitY} Q${x} ${splitY} ${x} ${splitY + R} L${x} ${LY}`;
  };

  // ---- 时间 ----
  const rootIn = p(t, 0.02, 0.5) * 1.055 - 0.055 * q(t, 0.5, 0.72);
  const appear = br.map((_, i) => cueAt(c.cues, i, 0.8 + i * 0.68 + (i > 1 ? 0.1 : 0)));
  const lastAppear = appear[n - 1];
  const T = cueAt(c.cues, n, lastAppear + 1.0);
  const trace = p(t, T, T + 0.6);
  const fill = wipe(t, T + 0.42, T + 0.85);
  const lift = springAt(t, T + 0.55, 0.65);
  const dim = rec >= 0 ? q(t, T, T + 0.5) : 0;
  const noteIn = p(t, T + 0.75, T + 1.15);

  const leafFace = (b: YangDecisionBranch, dark: boolean, isRec: boolean, textOpacity = 1) => <div style={{
    position: 'absolute', inset: 0, background: dark ? S.dark : '#fff', borderRadius: S.radius,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'inherit',
  }}><div style={{ opacity: textOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
    <span style={{ ...textBase(ansSize, 900), color: dark ? '#fff' : S.ink }}>{b.answer}</span>
    {b.note ? <span style={{ ...textBase(noteSize, dark ? 900 : 500), color: dark ? accentOn(true) : S.muted,
      opacity: dark && isRec ? mix(0.35, 1, noteIn) : 1 }}>{b.note}</span> : null}
  </div></div>;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 路：底线淡灰，推荐那条被墨线走一遍 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {br.map((_, i) => {
          const draw = p(t, appear[i] - 0.34, appear[i] + 0.06);
          if (draw <= 0) return null;
          const isRec = i === rec;
          return <path key={i} d={pathOf(i)} pathLength={1} fill="none" stroke="#c9c9ce" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={isRec ? 1 : 1 - 0.6 * dim} />;
        })}
        {rec >= 0 && trace > 0 && <path d={pathOf(rec)} pathLength={1} fill="none" stroke={S.ink} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="1 1" strokeDashoffset={1 - trace} />}
      </svg>

      {/* 根问题 */}
      <Pill box={{ x: 960 - (rootW * rootIn) / 2, y: ROOT_TOP, w: Math.max(rootH, rootW * rootIn), h: rootH }} style={{ opacity: clamp(rootIn * 4), zIndex: 20 }}>
        <span style={{ opacity: clamp((rootIn - 0.5) / 0.3) }}><DisplayText text={c.question} size={rootSize} color="#fff" /></span>
      </Pill>

      {br.map((b, i) => {
        const e = p(t, appear[i], appear[i] + 0.45);
        if (e <= 0) return null;
        const isRec = i === rec;
        const fade = isRec ? 1 : 1 - 0.6 * dim;   // 只退文字，卡和条件签保持实心，不透出后面的线
        const x = bx(i);
        const chipW = textWidth(b.condition, chipSize) + chipSize * 1.4;
        const up = isRec ? -16 * lift : 0;
        return <React.Fragment key={i}>
          {/* 条件：挂在竖段上，从左向右擦出 */}
          <Surface box={{ x: x - chipW / 2, y: chipY, w: chipW, h: chipH }} radius={chipH / 2}
            style={{ zIndex: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
              clipPath: `inset(-40px ${100 * (1 - e)}% -40px 0 round ${chipH / 2}px)` }}>
            <span style={{ ...textBase(chipSize, isRec && dim > 0.5 ? 900 : 500), color: S.ink, opacity: fade }}>{b.condition}</span>
          </Surface>
          {/* 答案卡 */}
          <div style={{ position: 'absolute', left: x - LW / 2, top: LY + (1 - e) * 40 + up, width: LW, height: LH, borderRadius: S.radius, zIndex: isRec ? 18 : 12,
            boxShadow: isRec && fill > 0.5 ? S.capsuleShadow : S.shadow, opacity: clamp(e * 2.5), transform: `scale(${isRec ? 1 + 0.04 * lift : 1})` }}>
            {leafFace(b, false, isRec, fade)}
            {isRec && fill > 0 && <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 ${100 * (1 - fill)}% 0 round ${S.radius}px)` }}>{leafFace(b, true, true)}</div>}
          </div>
        </React.Fragment>;
      })}
    </Handoff>
    
    
  </Frame>;
}
