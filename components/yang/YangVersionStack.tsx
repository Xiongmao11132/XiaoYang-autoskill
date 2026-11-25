// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T16b-VersionStack.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：版本迭代（正版 T16b）——旧版本卡 → 被新版本卡一张张盖上，变化点被点亮。
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

export type YangVersion = { name: string; label?: string; points: string[] };
export type YangVersionStackProps = YangHandoffProps & {
  versions: YangVersion[];   // 2–4 张，按先后；points 每张 1–4 条新增点
  cues?: number[];       // [k-1]=第 k 张卡（k≥1）开始滑入
};

export const yangVersionStackDefaults: YangVersionStackProps = {
  versions: [
    { name: 'v1', label: '基础版', points: ['只能聊天问答', '结果要手动复制'] },
    { name: 'v2', label: '联网版', points: ['能直接读你的文件', '能联网查资料', '结果自动保存'] },
    { name: 'v3', label: '自动版', points: ['自己拆步骤做完', '做完主动汇报', '出错自己重试'] },
  ],
};

const tw = (s: string, f: number) => Array.from(s).reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.68 : /[\u0000-ÿ]/.test(ch) ? 0.6 : 1) * f, 0);
const TOP = 150, BOTTOM = 880;
const PADX = 64, HEAD_TOP = 22;

export function YangVersionStack(props: Partial<YangVersionStackProps>) {
  const c = { ...yangVersionStackDefaults, ...props };
  const t = useT();
  const { durationInFrames, fps } = useVideoConfig();
  const dur = durationInFrames / fps;
  const vs = c.versions.slice(0, 4).map((v) => ({ ...v, points: v.points.slice(0, 4) }));
  const n = Math.max(1, vs.length);

  // ---------- 终态版式 ----------
  const maxP = Math.max(1, ...vs.map((v) => v.points.length));
  const nameSize = 68, labelSize = 38;
  const headW = Math.max(...vs.map((v) => tw(v.name, nameSize) + (v.label ? 28 + tw(v.label, labelSize) : 0)));
  const DISC = 44;
  const ptUnits = Math.max(1, ...vs.flatMap((v) => v.points.map((x) => tw(x, 1))));
  const headH = HEAD_TOP + nameSize * 1.16;        // 表头高（旧卡只露这一截）
  const tabH = headH + 8;
  // 要点字号：先按宽度定上限，再保证“整叠（旧卡表头 + 当前卡）”放进 TOP–BOTTOM，旧卡表头不被压住
  let ptSize = Math.max(32, Math.min(52, (1300 - PADX * 2 - DISC - 22) / ptUnits));
  const hOf = (f: number) => Math.round(headH + 34 + maxP * Math.round(f * 1.62) + 40);
  while (ptSize > 32 && hOf(ptSize) + (n - 1) * tabH > BOTTOM - TOP) ptSize -= 1;
  const W = Math.round(clamp(Math.max(headW, ptUnits * ptSize + DISC + 22) + PADX * 2, 940, 1300));
  const rowH = Math.round(ptSize * 1.62);
  const H = hOf(ptSize);
  const PEEK = n > 1 ? Math.min(Math.round(tabH), (BOTTOM - TOP - H) / (n - 1)) : 0;
  const stackH = H + (n - 1) * PEEK;
  const baseTop = TOP + (BOTTOM - TOP - stackH) / 2 + (n - 1) * PEEK;   // 当前卡的顶边
  const X = 960 - W / 2;

  // ---------- 时间线：按组件时长铺开 ----------
  const lightDur = (k: number) => 0.2 + vs[k].points.length * 0.16;
  const SLIDE = 0.55;
  const first = Math.min(1.35, 0.55 + lightDur(0));
  const step = n > 2 ? clamp((dur - first - SLIDE - lightDur(n - 1) - 0.7) / (n - 2), 0.85, 1.6) : 0;
  const inAt = vs.map((_, k) => (k === 0 ? 0 : cueAt(c.cues, k - 1, first + (k - 1) * step)));
  const landAt = (k: number) => (k === 0 ? 0.4 : inAt[k] + SLIDE);
  // 卡 k 被压到第几层：之后每来一张新卡就退一格（同一进度）
  const depth = (k: number) => vs.reduce((d, _, j) => (j > k ? d + q(t, inAt[j], inAt[j] + SLIDE) : d), 0);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {vs.map((v, k) => {
        if (k > 0 && t < inAt[k]) return null;
        const d = depth(k);
        const isTop = d < 0.5;
        // 进场：第一张从下方升起；后面的从右侧滑进来（距离留在安全区内）
        const e = k === 0 ? p(t, 0, 0.45) : p(t, inAt[k], inAt[k] + SLIDE);
        const dx = k === 0 ? 0 : (1 - e) * Math.min(320, 1840 - (X + W));
        const dy = k === 0 ? (1 - e) * 50 : 0;
        const op = k === 0 ? e : clamp((t - inAt[k]) / 0.08);
        const top = baseTop - d * PEEK;
        const sc = 1 - d * 0.035;
        const veil = clamp(d) * 0.4;
        const lit = (i: number) => p(t, landAt(k) + 0.12 + i * 0.16, landAt(k) + 0.12 + i * 0.16 + 0.3);
        const cur = 1 - clamp(d * 2);   // 1 = 当前卡
        return <div key={k} style={{
          position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, zIndex: k,
          transform: `translate(${dx}px, ${dy}px)`, opacity: op,
        }}>
          <div style={{ position: 'absolute', inset: 0, transformOrigin: `960px ${top}px`, transform: `scale(${sc})` }}>
            <Surface box={{ x: X, y: top, w: W, h: H }} shadow={k > 0 && !isTop ? S.shadow : '0 22px 40px 0 rgba(0,0,0,0.18)'}>
              {/* 表头：版本名（当前卡染紫）+ 说明 */}
              <div style={{ position: 'absolute', left: PADX, top: HEAD_TOP, display: 'flex', alignItems: 'baseline', gap: 28 }}>
                <span style={{ ...textBase(nameSize, 900), color: cur > 0.5 && k === n - 1 && t > landAt(k) ? accentOn(false) : S.ink }}>{v.name}</span>
                {v.label && <span style={{ ...textBase(labelSize, 500), color: S.muted }}>{v.label}</span>}
              </div>
              {/* 新增点：+ 圆章弹出，文字由灰变墨 */}
              {v.points.map((pt, i) => {
                const l = lit(i);
                const pop = springAt(t, landAt(k) + 0.12 + i * 0.16, 0.5);
                const y = headH + 34 + i * rowH;
                return <div key={i} style={{ position: 'absolute', left: PADX, top: y, height: rowH, display: 'flex', alignItems: 'center', gap: 22 }}>
                  <div style={{ width: DISC, height: DISC, borderRadius: DISC / 2, background: l > 0 ? S.dark : 'transparent', border: l > 0 ? 'none' : `3px solid ${S.faint}`, boxSizing: 'border-box',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${l > 0 ? mix(0.5, 1, pop) : 0.7})`, flex: 'none' }}>
                    {l > 0 && <span style={{ ...textBase(DISC * 0.78, 900), color: '#fff', lineHeight: 1, marginTop: -3 }}>+</span>}
                  </div>
                  <span style={{ ...textBase(ptSize, l > 0.5 ? 900 : 500), color: l > 0.5 ? S.ink : S.faint }}>{pt}</span>
                </div>;
              })}
              {/* 退后：白蒙版，只盖卡面（旧卡的表头仍读得出） */}
              <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: veil }} />
            </Surface>
          </div>
        </div>;
      })}
    </Handoff>
    
    
    
  </Frame>;
}
