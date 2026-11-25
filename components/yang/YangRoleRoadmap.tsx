// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T02g-RoleRoadmap.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：两个身份路线图（正版 T02g）——两条身份泳道 → 各自的步骤依次排开；回现时当前一步被点亮。
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

export type YangRoleLane = { role: string; steps: string[] };
export type YangRoleRoadmapProps = YangHandoffProps & {
  lanes: YangRoleLane[];                              // 1–3 条泳道，每条 1–5 步；步骤名可用 \n 指定断行
  mode: 'overview' | 'current';                   // overview：依次建立；current：从终态开始，点亮当前一步
  current: { lane: number; step: number } | null; // 当前一步（0 起）；overview 下传了也会在建立完后点亮
  cues?: number[];                                // overview：[i]=第 i 条泳道开始建立，[泳道数]=点亮；current：[0]=点亮
};

// 默认内容：第 114 期 S03 路线图（逐字稿 v6 制作备注：使用者 找→下载→授权→跑起来；上传者 传上去→三个文件）
export const yangRoleRoadmapDefaults: YangRoleRoadmapProps = {
  lanes: [
    { role: '使用者', steps: ['找项目', '下载哪个', '授权 CLI', '跑起来'] },
    { role: '上传者', steps: ['传上去', '三个文件'] },
  ],
  mode: 'overview',
  current: null,
};

// 比 kit textWidth 稍保守：大写拉丁字母按 0.68 估（MiSans Heavy 大写偏宽）
const tw = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.68 : /[\u0000-ÿ]/.test(ch) ? 0.58 : 1) * size, 0);

// 两行均衡断开（拉丁词不拆）
function splitTwo(s: string): string[] {
  const tokens = s.match(/[A-Za-z0-9.\-_/+#]+|\s+|./gu) ?? [s];
  const total = tw(s, 1);
  let best = 1, bestScore = Infinity, acc = 0;
  for (let i = 1; i < tokens.length; i++) {
    acc += tw(tokens[i - 1], 1);
    if (/^[，,、。：:；;！!？?]$/.test(tokens[i])) continue;
    const score = Math.abs(acc - total / 2) + (/^\s+$/.test(tokens[i - 1]) ? -0.6 : 0);
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return [tokens.slice(0, best).join('').trim(), tokens.slice(best).join('').trim()].filter(Boolean);
}

// rgb 插值（白卡 → 黑卡、墨字 → 白字 / 灰字）
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lerpColor = (a: string, b: string, v: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((x, i) => Math.round(mix(x, B[i], clamp(v)))).join(',')})`;
};

const AREA_W = 1760;       // 整组最大宽
const ROLE_GAP = 46;       // 身份胶囊到第一张卡
const GAP = 24;            // 卡与卡
const LANE_GAP = 64;       // 泳道之间
const PAD = 26;            // 卡内边距

export function YangRoleRoadmap(props: Partial<YangRoleRoadmapProps>) {
  const c = { ...yangRoleRoadmapDefaults, ...props };
  const t = useT();
  const lanes = c.lanes.slice(0, 3).map((l) => ({ role: l.role, steps: l.steps.slice(0, 5) }));
  const nL = Math.max(1, lanes.length);
  const maxSteps = Math.max(1, ...lanes.map((l) => l.steps.length));

  // —— 版式：所有泳道共用身份胶囊宽度和卡宽，列与列严格对齐 ——
  const CARD_H = nL >= 3 ? 190 : 236;
  const roleUnits = Math.max(1, ...lanes.map((l) => textWidth(l.role, 1)));
  const roleSize = Math.min(nL >= 3 ? 88 : 104, 330 / roleUnits);   // 身份名长时收字号，把宽度留给步骤卡
  const roleW = roleUnits * roleSize + roleSize * 1.3;
  const cardW = Math.min(400, (AREA_W - roleW - ROLE_GAP - GAP * (maxSteps - 1)) / maxSteps);
  const inner = cardW - PAD * 2;
  const allSteps = lanes.flatMap((l) => l.steps);
  // 卡内标题：一行放得下 ≥44px 就一行，否则两行；所有卡共用一个字号
  const lineFit = (s: string) => Math.min(56, inner / Math.max(1, tw(s, 1)));
  const twoLine = (s: string) => s.includes('\n') || lineFit(s) < 42;
  const linesOf = (s: string) => (s.includes('\n') ? s.split('\n').slice(0, 2) : twoLine(s) ? splitTwo(s) : [s]);
  const labelSize = Math.min(56, ...allSteps.map((s) => Math.min(...linesOf(s).map((l) => inner / Math.max(1, tw(l, 1))))),
    ...allSteps.filter(twoLine).map(() => (CARD_H - PAD * 2 - 48) / (2 * 1.16)));
  const groupW = roleW + ROLE_GAP + maxSteps * cardW + (maxSteps - 1) * GAP;
  const X0 = 960 - groupW / 2;
  const totalH = nL * CARD_H + (nL - 1) * LANE_GAP;
  const laneY = (i: number) => 540 - totalH / 2 + 12 + i * (CARD_H + LANE_GAP);
  const cardX = (j: number) => X0 + roleW + ROLE_GAP + j * (cardW + GAP);

  // —— 时间 ——
  const current = c.mode === 'current';
  const cur = c.current && c.current.lane >= 0 && c.current.lane < nL && c.current.step >= 0 && c.current.step < lanes[c.current.lane].steps.length
    ? c.current : null;
  const laneAt = (i: number) => cueAt(c.cues, i, 0.1 + i * 1.7);
  const focusAt = current ? cueAt(c.cues, 0, 0.3) : cueAt(c.cues, nL, laneAt(nL - 1) + 1.2);
  const focus = cur ? q(t, focusAt, focusAt + 0.55) : 0;
  // current 模式：整张图第一帧就是终态
  const built = (v: number) => (current ? 1 : v);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {lanes.map((lane, li) => {
        const y = laneY(li);
        const a = laneAt(li);
        const roleIn = built(p(t, a, a + 0.42));
        const isCurLane = !!cur && cur.lane === li;
        const laneDim = cur && !isCurLane ? focus : 0;
        const roleRight = X0 + roleW;
        return <div key={li} style={{ position: 'absolute', inset: 0, opacity: mix(1, 0.3, laneDim) }}>
          {/* 步骤卡：从身份胶囊背后抽出；裁切左边界就是胶囊右沿 */}
          <div style={{ position: 'absolute', left: roleRight - 2, top: y - 80, width: 1920 - roleRight, height: CARD_H + 180, overflow: 'hidden' }}>
            {lane.steps.map((step, j) => {
              const sa = a + 0.24 + j * 0.085;
              const e = built(p(t, sa, sa + 0.62));
              const x = mix(roleRight - cardW - 48, cardX(j), e) - (roleRight - 2);   // 起点连投影一起藏在胶囊右沿之外
              const isCur = isCurLane && cur!.step === j;
              const done = isCurLane && j < cur!.step;
              const later = isCurLane && j > cur!.step;
              const lift = isCur ? focus : 0;
              const fade = done || later ? focus : 0;
              const check = done ? p(t, focusAt + 0.25, focusAt + 0.6) : 0;
              // 共用字号定下来后，一行放得下的就不折行（避免“加 / License”这种断头）
              const lines = !step.includes('\n') && tw(step, labelSize) <= inner ? [step] : linesOf(step);
              const ink = lerpColor(S.ink, S.faint, fade);
              if (e <= 0) return null;
              const label = (color: string) => <div style={{ position: 'absolute', left: PAD, right: PAD, bottom: PAD - 2, color }}>
                {lines.map((l, k) => <div key={k} style={{ ...textBase(labelSize, 900), lineHeight: 1.16 }}>{l}</div>)}
              </div>;
              const num = (color: string, o = 1) => <div style={{ ...textBase(34, 900), position: 'absolute', left: PAD, top: PAD - 4, color, opacity: o }}>
                {String(j + 1).padStart(2, '0')}</div>;
              return <div key={j} style={{
                position: 'absolute', left: x, top: 80 - 22 * lift, width: cardW, height: CARD_H,
                transform: `scale(${1 + 0.06 * lift})`, zIndex: isCur ? 20 : 10 - j,   // 先出的压在上面：后面的卡从它底下摊开
              }}>
                {lift > 0 && <div style={{ position: 'absolute', inset: 0, borderRadius: S.radius, background: S.dark, boxShadow: S.capsuleShadow, opacity: lift }} />}
                {/* 白卡层：墨字（已完成 / 未到的退成灰） */}
                <div style={{ position: 'absolute', inset: 0, borderRadius: S.radius, background: '#fff', boxShadow: S.shadow }} />
                {num(S.faint, done ? 1 - clamp(check * 2) : 1)}
                {done && check > 0 && <svg width={46} height={46} viewBox="0 0 46 46" style={{ position: 'absolute', left: PAD - 4, top: PAD - 6 }}>
                  <path d="M8 24 L19 34 L38 12" fill="none" stroke={S.accent} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray={50} strokeDashoffset={50 * (1 - check)} />
                </svg>}
                {label(ink)}
                {/* 黑面层：自下而上擦满整张卡，里面是同位置的白字 + 深底紫序号（两层文字反色，motion-craft §6） */}
                {lift > 0 && <div style={{
                  position: 'absolute', inset: 0, borderRadius: S.radius, background: S.dark, overflow: 'hidden',
                  clipPath: `inset(${100 * (1 - lift)}% 0 0 0 round ${S.radius}px)`,
                }}>
                  {num(accentOn(true))}
                  {label('#fff')}
                </div>}
              </div>;
            })}
          </div>
          {/* 身份胶囊 */}
          <div style={{
            ...abs({ x: X0, y, w: roleW, h: CARD_H }), borderRadius: CARD_H / 2, background: S.dark, boxShadow: S.capsuleShadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: clamp(roleIn * 1.8), transform: `scale(${mix(0.82, 1, roleIn)})`,
          }}>
            <span style={{ ...textBase(roleSize, 400, S.display), color: '#fff' }}>{lane.role}</span>
          </div>
        </div>;
      })}
    </Handoff>
    
  </Frame>;
}
