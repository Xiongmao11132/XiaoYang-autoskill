// YangClickTrail — click trail on a real interface screenshot: the camera follows each click (push-in to the zoom prop), every click leaves a numbered black dot and a one-line label; at the end the camera pulls back to the full view, the screenshot dims, and the dots connect into one thin path — "that is all the clicking it took" (原版 T09s). Distinct from a next-step pointer (no trace is kept there); the accumulated path is the point.
// Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
// Source: member package fred-recording-8-20261018
//   source/src/components/T09s-ClickTrail.tsx (+ kit/theme.ts, kit/ui.tsx)
//   package first public release: 2026-10-18 (early-access window ended 2026-11-01); downloaded 2026-11-02 via the
//   public visual-library route (fred-fu.com, anonymous, authorization: not-required).
//   Package ZIP: 34,039,291 bytes, SHA-256 b06d66380b266d927a91b1ddcc1de01f0ae32e4681f19e792585776549c76329
//   archived at ~/workspace/tools/FredTalk/downloads-b/fred-recording-8-20261018-source.zip
// Integration notes: Sfx and Brand NOT integrated. Original fonts replaced by the library FONT
//   (../src/theme); kit colors kept as the original 109-spec palette constants (S). All copy/numbers/media
//   are props with neutral example defaults (the original's own chapter titles, screenshots and recordings
//   are NOT bundled). image defaults to an empty string: a neutral placeholder surface then stands in for the screenshot (click coordinates are source pixels of the supplied image).
// Layout: 1920x1080 logical stage, scaled by host width (Frame).
import React from 'react';
import { Easing, Freeze, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

// —— kit 最小移植（wave2 / recording 两包同版 kit：theme.ts + ui.tsx + _shared.ts）——
// 与 B 类章节包移植的差异：本批 kit 为 v2/v3 版——Handoff 的 enter/exit 是字符串枚举（含 enterAt 语义），
// 另有 settle()（无过冲落定）与 cueAt 口播锚点。字体统一换本库 FONT，Brand/Sfx/Fonts 不集成。
const S = {
  ink: '#19191c', dark: '#19191c', windowBody: '#212123', windowBar: '#161618',
  muted: '#6c6c72', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  radius: 24, shadow: '0 16px 25px 0 rgba(0,0,0,0.1333)',
  capsuleShadow: '30px 22px 25px #0005', windowShadow: '-25px 6px 35px #0003',
  textShadowDark: '8px 9px 5px #000',
};
type Box = { x: number; y: number; w: number; h: number };
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const q = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * (3 - 2 * v); };
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
const settle = (t: number, delay: number, duration = 0.8) => p(t, delay, delay + Math.max(0.3, duration * 0.6));

const useT = () => useCurrentFrame() / useVideoConfig().fps;

function Frame({ dark, children }: { dark?: boolean; brand?: boolean; children: React.ReactNode }) {
  return <div style={{ position: 'absolute', inset: 0, background: dark ? S.dark : '#fff', overflow: 'hidden', fontFamily: FONT }}>{children}</div>;
}

type Enter = 'cut' | 'fade' | 'rise' | 'grow';
type Exit = 'none' | 'recede' | 'fade' | 'cut' | 'slide-left' | 'slide-up';
type YangHandoffProps = { enter?: Enter; exit?: Exit; exitAt?: number };

function Handoff({ enter = 'cut', exit = 'none', exitAt, children }: YangHandoffProps & { children: React.ReactNode }) {
  const t = useT();
  const { durationInFrames, fps } = useVideoConfig();
  const T = durationInFrames / fps;
  const enterAt = 0.06, enterDur = 0.3;
  const exitDur = exit === 'cut' ? 0.05 : 0.4;
  const startAt = exitAt !== undefined ? Math.max(0, exitAt) : Math.max(enterAt, T - exitDur - 0.02);
  let transform = 'none', opacity = 1;
  if (t < enterAt + enterDur) {
    const v = enter === 'fade' || enter === 'cut' ? p(t, enterAt, enterAt + enterDur)
      : enter === 'rise' ? q(t, enterAt, enterAt + enterDur)
        : springAt(t, enterAt, enterDur * 1.6);
    if (enter === 'fade') opacity = v;
    else if (enter === 'rise') transform = `translateY(${(1 - v) * 260}px)`;
    else if (enter === 'grow') transform = `scale(${mix(0.92, 1, v)})`;
  }
  if (exit !== 'none' && t >= startAt) {
    const v = exit === 'cut' ? p(t, startAt, startAt + exitDur) : q(t, startAt, startAt + exitDur);
    if (exit === 'recede') transform = `scale(${mix(1, 0.94, v)})`;
    else if (exit === 'fade') opacity = 1 - v;
    else if (exit === 'cut') opacity = 1 - v;
    else if (exit === 'slide-left') transform = `translateX(${-v * 340}px)`;
    else if (exit === 'slide-up') transform = `translateY(${-v * 260}px)`;
  }
  return <div style={{ position: 'absolute', inset: 0, transformOrigin: '960px 540px', transform, opacity }}>{children}</div>;
}

const textBase = (size: number, weight: number, _family?: string): React.CSSProperties => ({
  fontFamily: FONT, fontSize: size, fontWeight: weight, lineHeight: 1.25, whiteSpace: 'nowrap',
});
const abs = (b: Box): React.CSSProperties => ({ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h });
const between = (a: Box, b: Box, v: number): Box => ({ x: mix(a.x, b.x, v), y: mix(a.y, b.y, v), w: mix(a.w, b.w, v), h: mix(a.h, b.h, v) });
const center = (cx: number, cy: number, w: number, h: number): Box => ({ x: cx - w / 2, y: cy - h / 2, w, h });

function Surface({ box, dark, light, radius = S.radius, shadow = S.shadow, style, children }: {
  box: Box; dark?: boolean; light?: boolean; radius?: number; shadow?: string; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  return <div style={{
    ...abs(box), borderRadius: radius, overflow: 'hidden',
    background: dark ? S.windowBody : light ? '#fff' : '#fcfcfc',
    color: dark ? '#fff' : S.ink, boxShadow: shadow, ...style,
  }}>{children}</div>;
}

function Pill({ box, dark, style, children }: { box: Box; dark?: boolean; style?: React.CSSProperties; children?: React.ReactNode }) {
  return <div style={{
    ...abs(box), borderRadius: box.h / 2, background: dark === false ? '#fff' : S.dark,
    color: dark === false ? S.ink : '#fff', boxShadow: S.capsuleShadow,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, ...style,
  }}>{children}</div>;
}

function MacWindow({ box, light, bar = 64, radius = S.radius, style, children }: {
  box: Box; light?: boolean; bar?: number; radius?: number; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  const body = light ? '#fff' : S.windowBody, barBg = light ? '#f2f2f4' : S.windowBar;
  return <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', background: body, boxShadow: S.windowShadow, ...style }}>
    <div style={{ height: bar, background: barBg, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 13 }}>
      <span style={{ width: 21, height: 21, borderRadius: '50%', background: '#D8D8DC', display: 'inline-block' }} />
      <span style={{ width: 21, height: 21, borderRadius: '50%', background: '#C6C6CB', display: 'inline-block' }} />
      <span style={{ width: 21, height: 21, borderRadius: '50%', background: '#AEAFB4', display: 'inline-block' }} />
    </div>
    <div style={{ position: 'absolute', left: 0, top: bar, right: 0, bottom: 0 }}>{children}</div>
  </div>;
}

// 媒体：src 为空串时渲染中性占位面（浅灰 + 细横线纹理），不引用任何原版素材
function Media({ src, box, radius = 18, style, objectPosition = '50% 50%' }: {
  src: string; box: Box; radius?: number; style?: React.CSSProperties; objectPosition?: string;
}) {
  if (!src) {
    return <div style={{
      ...abs(box), borderRadius: radius, overflow: 'hidden', backgroundColor: '#ececef',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 54px, rgba(25,25,28,0.07) 54px 55px)', ...style,
    }} />;
  }
  const isVideo = /\.(mp4|mov|webm)$/i.test(src);
  const mediaStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', objectPosition, display: 'block' };
  return <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', background: S.dark, ...style }}>
    {isVideo
      ? <OffthreadVideo muted src={staticFile(src)} style={mediaStyle} />
      : <Img src={staticFile(src)} style={mediaStyle} />}
  </div>;
}

// 图片（可空）：空串时用同几何的中性占位面代替，保证版式与动效可核验
const SrcImg = ({ src, style }: { src: string; style: React.CSSProperties }) =>
  src
    ? <Img src={staticFile(src)} style={style} />
    : <div style={{ ...style, backgroundColor: '#ececef', backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 46px, rgba(25,25,28,0.08) 46px 47px)' }} />;

function Cursor({ x, y, scale = 1, press = 0, dark, style }: {
  x: number; y: number; scale?: number; press?: number; dark?: boolean; style?: React.CSSProperties;
}) {
  const s = scale * (1 - 0.12 * press);
  return <svg width={44 * s} height={44 * s} viewBox="0 0 44 44" style={{ position: 'absolute', left: x, top: y, zIndex: 900, filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))', ...style }}>
    <path d="M8 3 L36 22 L23.5 25.5 L29 39 L22.5 42 L17 28.5 L9 36 Z" fill={dark ? '#19191c' : '#fff'} stroke={dark ? '#fff' : '#19191c'} strokeWidth={2.4} strokeLinejoin="round" />
  </svg>;
}

function ClickRing({ x, y, t, at, dark }: { x: number; y: number; t: number; at: number; dark?: boolean }) {
  const v = clamp((t - at) / 0.45);
  if (v <= 0 || v >= 1) return null;
  const r = mix(10, 46, v);
  return <div style={{
    position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%',
    border: `4px solid ${dark ? '#19191c' : S.accent}`, opacity: 1 - v, zIndex: 890, pointerEvents: 'none',
  }} />;
}

function Spotlight({ rects, amount, dim = 0.3, pad = 24, radius = 0, feather = 40 }: {
  rects: Box[]; amount: number; dim?: number; pad?: number; radius?: number; feather?: number;
}) {
  if (amount <= 0.003 || rects.length === 0) return null;
  const stops: string[] = [];
  const soft = Math.max(1, feather);
  for (const r of rects) {
    const x0 = r.x - pad, y0 = r.y - pad, x1 = r.x + r.w + pad, y1 = r.y + r.h + pad;
    const rad = radius + pad;
    stops.push(
      `radial-gradient(ellipse ${Math.max(1, (x1 - x0) / 2 + soft)}px ${Math.max(1, (y1 - y0) / 2 + soft)}px at ${(x0 + x1) / 2}px ${(y0 + y1) / 2}px, ` +
      `transparent ${Math.max(0, Math.min((x1 - x0) / 2, (y1 - y0) / 2) - rad * 0.2)}px, rgba(0,0,0,${dim * amount}) 100%)`,
    );
  }
  return <div style={{ position: 'absolute', inset: 0, background: stops.join(','), opacity: 1, pointerEvents: 'none' }} />;
}

// —— _shared.ts 移植：章节小工具 ——
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const partLabel = (index: number, label: string) => label || `第${CN[index] ?? index}部分`;
const pad2 = (n: number) => String(n).padStart(2, '0');
const fit = (s: string, size: number, maxW: number) => Math.min(size, maxW / Math.max(1, textWidth(s, 1)));
const splitTitle = (title: string, per = 8.5): string[] => {
  const lines: string[] = [];
  let cur = '';
  for (const ch of Array.from(title)) {
    cur += ch;
    if (textWidth(cur, 1) >= per || /[：:、，,；;]/.test(ch)) { lines.push(cur); cur = ''; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [title];
};
const splitHighlight = (s: string, hl: string): [string, string, string] => {
  const i = s.indexOf(hl);
  return i < 0 ? [s, '', ''] : [s.slice(0, i), hl, s.slice(i + hl.length)];
};
const rand = (seed: number) => {
  let x = seed % 2147483647;
  if (x <= 0) x += 2147483646;
  return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
};
const zoomMix = (a: number, b: number, v: number) => Math.exp(mix(Math.log(a), Math.log(b), v));
const easeIn = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * v; };


export type TrailClick = { x: number; y: number; label?: string; labelGap?: number };   // 源图像素；labelGap=说明离点的距离（屏幕像素，避开被点的字）
export type YangClickTrailProps = YangHandoffProps & {
  image: string;           // 真实界面截图；留空用中性占位面
  imageSize: { w: number; h: number };
  clicks: TrailClick[];
  zoom: number;            // 跟随点击时的推近倍数
  summary: string;         // 拉回全貌后的一句话
  highlight: string;       // summary 里染紫的词
  maskBoxes?: { x: number; y: number; w: number; h: number }[];   // 源图像素里要实心盖掉的区域
  maskColor?: string;
  cues?: number[];         // [i]=第 i 次点击；[clicks.length]=拉回全貌
};

export const yangClickTrailDefaults: YangClickTrailProps = {
  image: '',
  imageSize: { w: 1920, h: 1080 },
  clicks: [
    { x: 300, y: 300, label: '第一步', labelGap: 190 },
    { x: 300, y: 700, label: '第二步', labelGap: 230 },
    { x: 960, y: 880, label: '第三步', labelGap: 200 },
    { x: 1500, y: 950, label: '第四步' },
    { x: 1680, y: 950, label: '第五步' },
  ],
  zoom: 2.3,
  summary: '从开始到完成，只点了 5 下',
  highlight: '5 下',
  maskBoxes: [],
  maskColor: '#fff',
};

const FULL = { x: 60, y: 33.222106, w: 1800, h: 1013.555787 };
type Cam = { fx: number; fy: number; z: number };

export function YangClickTrail(props: Partial<YangClickTrailProps>) {
  const c = { ...yangClickTrailDefaults, ...props };
  const t = useT();
  const clicks = c.clicks.length ? c.clicks : yangClickTrailDefaults.clicks;
  const n = clicks.length;

  // 源图 → 世界坐标（cover 进主视频窗）
  const k = Math.max(FULL.w / c.imageSize.w, FULL.h / c.imageSize.h);
  const ox = FULL.x + (FULL.w - c.imageSize.w * k) / 2, oy = FULL.y + (FULL.h - c.imageSize.h * k) / 2;
  const pts = clicks.map((ck) => ({ x: ox + ck.x * k, y: oy + ck.y * k }));

  // 时间：点击间隔按数量收紧（2 下宽松、7 下紧凑），间隔不完全等距
  const span = Math.min(3.0, 0.75 * n);
  const at = clicks.map((_, i) => cueAt(c.cues, i, 0.75 + (n > 1 ? (span * i) / (n - 1) : 0) + (i % 2) * 0.06));
  const backAt = cueAt(c.cues, n, at[n - 1] + 0.45);
  const lineAt = backAt + 0.5;
  const sumAt = lineAt + 0.45;

  // 相机：跟着下一个点击点移动（每段 0.45s quintic），最后拉回全貌
  const camFor = (pt: { x: number; y: number }): Cam => {
    const z = c.zoom, hx = 960 / z, hy = 540 / z;
    return { z, fx: clamp(pt.x, FULL.x + hx, FULL.x + FULL.w - hx), fy: clamp(pt.y, FULL.y + hy, FULL.y + FULL.h - hy) };
  };
  const lerp = (a: Cam, b: Cam, v: number): Cam => ({ fx: mix(a.fx, b.fx, v), fy: mix(a.fy, b.fy, v), z: mix(a.z, b.z, v) });
  const home: Cam = { fx: 960, fy: 540, z: 1 };
  let cam = lerp(home, camFor(pts[0]), quintic(t, at[0] - 0.6, at[0] - 0.15));
  for (let i = 1; i < n; i++) {
    const v = quintic(t, at[i] - 0.5, at[i] - 0.1);
    cam = lerp(cam, camFor(pts[i]), v);
    // 远距离换点：途中先拉远一点再落下，观众看得出"从哪到哪"
    const dist = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    cam = { ...cam, z: cam.z * (1 - 0.32 * Math.sin(Math.PI * v) * Math.min(1, dist / 900)) };
  }
  cam = lerp(cam, home, quintic(t, backAt, backAt + 0.6));
  cam = { ...cam, z: cam.z * (1 + 0.05 * q(t, backAt + 0.6, backAt + 2.4)) };   // 全貌期间缓慢推进
  const toScreen = (pt: { x: number; y: number }) => ({ x: (pt.x - cam.fx) * cam.z + 960, y: (pt.y - cam.fy) * cam.z + 540 });
  const sp = pts.map(toScreen);

  // 光标：从右下进场，依次落到每个点
  let cx = 1500, cy = 1150;
  for (let i = 0; i < n; i++) {
    const g = p(t, i === 0 ? 0.25 : at[i - 1] + 0.08, at[i] - 0.04);
    cx = mix(cx, sp[i].x, g); cy = mix(cy, sp[i].y, g);
  }
  const press = Math.max(0, ...at.map((a) => clamp(1 - Math.abs(t - a - 0.05) / 0.1)));
  const cursorOut = p(t, backAt, backAt + 0.4);

  const enter = p(t, 0, 0.45);
  const line = p(t, lineAt, lineAt + 0.6);
  const segs = sp.slice(1).map((b, i) => Math.hypot(b.x - sp[i].x, b.y - sp[i].y));
  const total = segs.reduce((a, b) => a + b, 0);
  const d = sp.map((pt, i) => `${i ? 'L' : 'M'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

  const sumIn = settle(t, sumAt, 0.6);
  const SS = Math.min(64, 1300 / Math.max(1, textWidth(c.summary, 1)));
  const SH = SS * 2, SW = textWidth(c.summary, SS) + SS * 1.8;
  const [before, after = ''] = c.summary.split(c.highlight);
  const hasHL = !!c.highlight && c.summary.includes(c.highlight);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(960px,540px) scale(${cam.z}) translate(${-cam.fx}px,${-cam.fy}px)` }}>
        <div style={{
          position: 'absolute', left: FULL.x, top: FULL.y, width: FULL.w, height: FULL.h, borderRadius: S.radius, overflow: 'hidden',
          boxShadow: S.shadow, background: '#fff', opacity: enter, transform: `scale(${mix(0.965, 1, enter)})`,
        }}>
          <SrcImg src={c.image} style={{ position: 'absolute', left: ox - FULL.x, top: oy - FULL.y, width: c.imageSize.w * k, height: c.imageSize.h * k }} />
          {(c.maskBoxes ?? []).map((mm, i) => <div key={i} style={{ position: 'absolute', left: ox - FULL.x + mm.x * k, top: oy - FULL.y + mm.y * k, width: mm.w * k, height: mm.h * k, background: c.maskColor ?? '#fff' }} />)}
          {/* 拉回全貌后整张截图压暗，路径和序号点成为主体 */}
          <div style={{ position: 'absolute', inset: 0, background: S.ink, opacity: 0.26 * p(t, backAt + 0.1, backAt + 0.6) }} />
        </div>
      </div>

      {/* 回看路径：只在拉回全貌后出现一次 */}
      {line > 0 && n > 1 && <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, zIndex: 600 }}>
        <path d={d} fill="none" stroke={S.ink} strokeOpacity={0.62} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={total} strokeDashoffset={total * (1 - line)} />
      </svg>}

      {/* 序号点：点下那一刻落下，跟着画面走（屏幕坐标，大小不随推近变化） */}
      {sp.map((pt, i) => {
        const v = settle(t, at[i] + 0.04, 0.45);
        if (v <= 0) return null;
        const R = 38;
        return <div key={i} style={{
          position: 'absolute', left: pt.x - R, top: pt.y - R, width: R * 2, height: R * 2, borderRadius: R, background: S.ink, zIndex: 650,
          boxShadow: S.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: v, transform: `scale(${mix(0.4, 1, v)})`,
        }}>
          <span style={{ ...textBase(42, 900), color: '#fff', lineHeight: 1 }}>{i + 1}</span>
        </div>;
      })}
      {/* 当前这一下在做什么：只跟着当前点，下一次点击时退下 */}
      {clicks.map((ck, i) => {
        if (!ck.label) return null;
        const v = p(t, at[i] + 0.1, at[i] + 0.4) * (1 - p(t, i + 1 < n ? at[i + 1] - 0.15 : backAt, i + 1 < n ? at[i + 1] + 0.05 : backAt + 0.25));
        if (v <= 0) return null;
        const LS = 46, h = 84, w = textWidth(ck.label, LS) + 56;
        const pt = sp[i];
        const gap = ck.labelGap ?? 52;
        let x = pt.x + gap, y = pt.y - h / 2;
        if (x + w > 1880) x = pt.x - 52 - w;
        y = clamp(y, 30, 1050 - h);
        return <Surface key={i} box={{ x, y, w, h }} radius={18} style={{ clipPath: `inset(0 ${100 * (1 - v)}% 0 0 round 18px)`, zIndex: 660, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...textBase(LS, 900), color: S.ink }}>{ck.label}</span>
        </Surface>;
      })}

      {at.map((a, i) => <ClickRing key={i} x={sp[i].x} y={sp[i].y} t={t} at={a} />)}
      {cursorOut < 1 && <Cursor x={cx - 6} y={cy - 4} scale={1.1} press={press} style={{ opacity: p(t, 0.2, 0.45) * (1 - cursorOut) }} />}

      {sumIn > 0 && <Pill box={{ x: 960 - SW / 2, y: 150 - SH / 2 + (1 - sumIn) * 24, w: SW, h: SH }} style={{ opacity: sumIn, zIndex: 700 }}>
        <span style={{ ...textBase(SS, 400), color: '#fff' }}>
          {hasHL ? <>{before}<span style={{ color: S.accentDark }}>{c.highlight}</span>{after}</> : c.summary}
        </span>
      </Pill>}
    </Handoff>
  </Frame>;
}
