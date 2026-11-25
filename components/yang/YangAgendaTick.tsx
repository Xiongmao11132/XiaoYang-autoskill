// YangAgendaTick — chapter transition: a chapter list on white; the previous chapter gets a drawn checkmark and greys out, the black highlight bar slides to this chapter (text inside inverts), then the camera pushes in until this chapter becomes one big black capsule row (原版 T23a).
// Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
// Source: member package fred-chapter-transitions-wave2-20261014
//   source/src/components/T23a-AgendaTick.tsx (+ kit/theme.ts, kit/ui.tsx, components/_shared.ts)
//   package first public release: 2026-10-14 (early-access window ended 2026-11-01); downloaded 2026-11-02 via the
//   public visual-library route (fred-fu.com, anonymous, authorization: not-required).
//   Package ZIP: 34,020,843 bytes, SHA-256 8de4ca47cb46301078903a2a27fe82cabea2d6464da530748561f9cf15c1efca
//   archived at ~/workspace/tools/FredTalk/downloads-b/fred-chapter-transitions-wave2-20261014-source.zip
// Integration notes: Sfx and Brand NOT integrated. Original fonts replaced by the library FONT
//   (../src/theme); kit colors kept as the original 109-spec palette constants (S). All copy/numbers/media
//   are props with neutral example defaults (the original's own chapter titles, screenshots and recordings
//   are NOT bundled). Mechanism kept: dual-layer rows (normal + clipped inverted copy inside the bar), SVG dash-drawn check, quintic camera push via cameraTransform. Near relation: YangPillCarousel moves a highlight across a horizontal capsule row; this one is a vertical list with check-off and push-in.
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


export type YangAgendaTickProps = YangHandoffProps & {
  chapters: string[];   // 本期全部章节名，按顺序
  index: number;        // 本章是第几章（1 起）
  cues?: number[];      // [0]=上一章打勾，[1]=高亮下移，[2]=推近
};

export const yangAgendaTickDefaults: YangAgendaTickProps = {
  chapters: ['示例章节一', '示例章节二', '示例章节三', '示例章节四', '示例章节五'],
  index: 3,
};

export function YangAgendaTick(props: Partial<YangAgendaTickProps>) {
  const c = { ...yangAgendaTickDefaults, ...props };
  const t = useT();
  const items = c.chapters.length ? c.chapters : [''];
  const n = items.length;
  const cur = Math.min(n, Math.max(1, c.index)) - 1, prev = cur - 1;
  const tickAt = cueAt(c.cues, 0, 0.5);
  const moveAt = cueAt(c.cues, 1, tickAt + 0.28);
  const pushAt = cueAt(c.cues, 2, moveAt + 0.62);

  const rowH = Math.min(128, 820 / n);
  const maxUnits = Math.max(...items.map((s) => textWidth(s, 1)));
  const size = Math.min(64, rowH * 0.5, 1180 / (maxUnits + 3.6));
  const checkW = size * 1.1, numW = textWidth('00', size) + size * 0.7;
  const listW = checkW + numW + maxUnits * size;
  const listX = 960 - listW / 2, listY = 540 - (n * rowH) / 2;
  const barH = rowH * 0.84, padX = size * 0.8;
  const barX = listX + checkW - padX;
  const barWAt = (i: number) => numW + textWidth(items[i], size) + padX * 2;
  const rowY = (i: number) => listY + i * rowH;
  const barYAt = (i: number) => rowY(i) + (rowH - barH) / 2;

  const move = prev >= 0 ? q(t, moveAt, moveAt + 0.45) : 1;
  const barY = prev >= 0 ? mix(barYAt(prev), barYAt(cur), move) : barYAt(cur);
  const barW = prev >= 0 ? mix(barWAt(prev), barWAt(cur), move) : barWAt(cur);
  const barIn = prev >= 0 ? p(t, 0.15, 0.5) : p(t, moveAt, moveAt + 0.45);
  const tick = p(t, tickAt, tickAt + 0.3);
  const push = quintic(t, pushAt, pushAt + 0.7);
  const zoom = Math.min(2.6, 1680 / barWAt(cur));
  const focusX = barX + barWAt(cur) / 2, focusY = barYAt(cur) + barH / 2;

  const row = (i: number, overlay: boolean) => {
    const e = p(t, 0.045 * i, 0.045 * i + 0.4);
    const done = i < prev || (i === prev && tick > 0);
    const fade = i < prev ? 1 : i === prev ? tick : 0;
    const color = overlay ? '#fff' : mix(0, 1, fade) > 0.5 ? S.faint : S.ink;
    return <div key={i} style={{
      position: 'absolute', left: listX, top: rowY(i), height: rowH, display: 'flex', alignItems: 'center',
      opacity: e * (i === cur ? 1 : 1 - push), transform: `translateY(${(1 - e) * 30}px)`,
    }}>
      <div style={{ width: checkW, height: rowH, position: 'relative' }}>
        {!overlay && done && <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 40 40" style={{ position: 'absolute', left: 0, top: (rowH - size * 0.8) / 2 }}>
          <path d="M6 21 L16 31 L35 9" fill="none" stroke={S.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={48} strokeDashoffset={48 * (1 - (i < prev ? 1 : tick))} />
        </svg>}
      </div>
      <div style={{ ...textBase(size, 900), width: numW, color: overlay ? S.accentDark : color, fontVariantNumeric: 'tabular-nums' }}>{pad2(i + 1)}</div>
      <div style={{ ...textBase(size, 900), color }}>{items[i]}</div>
    </div>;
  };

  const clip = `inset(${barY}px ${1920 - barX - barW}px ${1080 - barY - barH}px ${barX}px round ${barH / 2}px)`;
  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: cameraTransform(focusX, focusY, zoom, push) }}>
        {items.map((_, i) => row(i, false))}
        <div style={{
          position: 'absolute', left: barX, top: barY, width: barW, height: barH, borderRadius: barH / 2, background: S.dark,
          boxShadow: S.capsuleShadow, opacity: barIn, clipPath: prev >= 0 ? undefined : `inset(0 ${100 * (1 - barIn)}% 0 0 round ${barH / 2}px)`,
        }} />
        <div style={{ position: 'absolute', inset: 0, clipPath: clip, opacity: barIn }}>
          {items.map((_, i) => row(i, true))}
        </div>
      </div>
    </Handoff>
  </Frame>;
}
