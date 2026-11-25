// YangElevator — chapter transition: a black floor-indicator pill on a white stage rolls its digits from the previous chapter to this one; then the two black doors inside the white card slide apart to reveal the part label and chapter title (YangTalk T12z).
// Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
// Source: member package fred-chapter-transitions-wave2-20261014
//   source/src/components/T12z-Elevator.tsx (+ kit/theme.ts, kit/ui.tsx, components/_shared.ts)
//   package first public release: 2026-10-14 (early-access window ended 2026-11-01); downloaded 2026-11-02 via the
//   public visual-library route (fred-fu.com, anonymous, authorization: not-required).
//   Package ZIP: 34,020,843 bytes, SHA-256 8de4ca47cb46301078903a2a27fe82cabea2d6464da530748561f9cf15c1efca
//   archived at ~/workspace/tools/FredTalk/downloads-b/fred-chapter-transitions-wave2-20261014-source.zip
// Integration notes: Sfx and Brand NOT integrated. Original fonts replaced by the library FONT
//   (../src/theme); kit colors kept as the original 109-spec palette constants (S). All copy/numbers/media
//   are props with neutral example defaults (the original chapter titles, screenshots and recordings
//   are NOT bundled). Mechanism kept: per-digit vertical roll for the floor number, wipe() double-door opening inside the card, inner block scale settle.
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


export type YangElevatorProps = YangHandoffProps & {
  index: number;
  label: string;        // 留空用「第N部分」
  title: string;
  cues?: number[];      // [0]=楼层开始跳，[1]=开门
};

export const yangElevatorDefaults: YangElevatorProps = {
  index: 4,
  label: '',
  title: '示例章节名',
};

const CARD = { x: 960 - 640, y: 320, w: 1280, h: 640 }, PILLB = { w: 340, h: 140, y: 136 }, NUM = 92, LAB = 54;

export function YangElevator(props: Partial<YangElevatorProps>) {
  const c = { ...yangElevatorDefaults, ...props };
  const t = useT();
  const label = partLabel(c.index, c.label);
  const rollAt = cueAt(c.cues, 0, 0.36);
  const openAt = cueAt(c.cues, 1, rollAt + 0.62);

  const appear = p(t, 0, 0.36);
  const roll = q(t, rollAt, rollAt + 0.5);
  const open = wipe(t, openAt, openAt + 0.7);
  const from = pad2(c.index - 1), to = pad2(c.index);

  const lines = splitTitle(c.title, 8.5);
  const tSize = Math.min(140, ...lines.map((l) => fit(l, 140, CARD.w - 180)));
  const blockH = LAB * 1.16 + 22 + lines.length * tSize * 1.1;
  const inner = mix(0.94, 1, q(t, openAt, openAt + 0.7));

  const dW = textWidth('0', NUM) * 1.1, LH = NUM * 1.05;
  const tri = 22;
  const pillX = 960 - PILLB.w / 2;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, opacity: appear, transform: `translateY(${(1 - appear) * 50}px)` }}>
        <Pill box={{ x: pillX, y: PILLB.y, w: PILLB.w, h: PILLB.h }} style={{ gap: 26 }}>
          {/* 上行三角：电梯的方向指示，不是装饰 */}
          <div style={{ width: 0, height: 0, borderLeft: `${tri}px solid transparent`, borderRight: `${tri}px solid transparent`, borderBottom: `${tri * 1.5}px solid ${S.accentDark}`, opacity: t < openAt ? 1 : 1 - q(t, openAt, openAt + 0.3) * 0.6 }} />
          <div style={{ display: 'flex' }}>
            {[0, 1].map((i) => {
              const changes = from[i] !== to[i];
              return <div key={i} style={{ width: dW, height: LH, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: changes ? -roll * LH : 0, width: dW }}>
                  {(changes ? [from[i], to[i]] : [to[i]]).map((d, k) => <div key={k} style={{ height: LH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ ...textBase(NUM, 900), lineHeight: 1, color: '#fff' }}>{d}</span>
                  </div>)}
                </div>
              </div>;
            })}
          </div>
        </Pill>
        <Surface box={CARD}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: (CARD.h - blockH) / 2, textAlign: 'center', transform: `scale(${inner})`, opacity: open > 0.002 ? 1 : 0 }}>
            <div style={{ ...textBase(LAB, 600), color: S.accent, letterSpacing: 4 }}>{label}</div>
            {lines.map((l, i) => <div key={i} style={{ ...textBase(tSize, 400), lineHeight: 1.1, color: S.ink, marginTop: i === 0 ? 22 : 0 }}>{l}</div>)}
          </div>
          {/* 两扇门：中缝留 6px 透光 */}
          <div style={{ position: 'absolute', left: -open * CARD.w / 2, top: 0, width: CARD.w / 2 - 3, height: CARD.h, background: S.dark }} />
          <div style={{ position: 'absolute', left: CARD.w / 2 + 3 + open * CARD.w / 2, top: 0, width: CARD.w / 2 - 3, height: CARD.h, background: S.dark }} />
        </Surface>
      </div>
    </Handoff>
  </Frame>;
}
