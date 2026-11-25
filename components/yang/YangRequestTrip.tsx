// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T13d-RequestTrip.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：请求往返（正版 T13d）——你发出的请求 → 沿线到服务器，再带着结果回来。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT（等宽走系统等宽栈）；
// Brand 角标未集成（Frame 的 brand 入参仅兼容、忽略）；kit 的 theme/ui 已内嵌移植（见下），逻辑与原版一致；
// defaults 保留原包示例数据（原版节目示例），使用时请传真实数据。
// 媒体注记：原包 defaults 里的原版素材路径已置空串——空串时由 ImgFill/Media 内置的中性骨架占位面顶替，
// 使用时传自己的真实素材（及对应像素框/尺寸）即走原逻辑。
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

export type YangRequestTripProps = YangHandoffProps & {
  you: { name: string; logo?: string };                    // 左：发请求的一方
  server: { kicker?: string; name: string; sub?: string }; // 右：服务器
  addressLabel: string;    // 调用地址
  address: string;         // 示例地址，不放真实地址
  request: string;         // 请求胶囊上的字
  result: string;          // 结果胶囊上的字
  highlight: string;       // result 里染紫的词（黑胶囊上 #D6BEFF）
  timeLabel?: string;      // 耗时读数前缀；不传则不显示耗时
  seconds?: number;        // 往返耗时（秒）
  cues?: number[];         // [0]=请求出发；[1]=服务器处理；[2]=结果出发
};

// 113 期第 9–10 段：复制调用地址发给 Codex，它就能调用自己部署的 JEV（地址为示例）
export const yangRequestTripDefaults: YangRequestTripProps = {
  you: { name: '你的 Codex', logo: '' },
  server: { kicker: '自己部署的', name: 'JEV-27B', sub: 'RTX PRO 6000 · 96GB' },
  addressLabel: '调用地址',
  address: 'https://your-jev.example/v1',
  request: '这条客服意见属于哪一类？',
  result: '结果：物流问题',
  highlight: '物流问题',
  timeLabel: '往返耗时',
  seconds: 0.82,
};

const CY = 470;
const YOU_X = 320;
const CARD = { x: 1370, y: CY - 160, w: 420, h: 320 };
const SRV_X = CARD.x + CARD.w / 2;
const LX0 = 470, LX1 = CARD.x - 30;
const REQ_Y = CY - 62, RES_Y = CY + 62;

export function YangRequestTrip(props: Partial<YangRequestTripProps>) {
  const c = { ...yangRequestTripDefaults, ...props };
  const t = useT();

  // ---- 时间 ----
  const enter = p(t, 0, 0.45);
  const lanes = p(t, 0.12, 0.7);
  const addr = p(t, 0.35, 0.85);
  const D = cueAt(c.cues, 0, 1.0);
  const P = cueAt(c.cues, 1, D + 1.0);
  const R = cueAt(c.cues, 2, P + 0.62);
  const go = q(t, D, D + 1.0);
  const back = q(t, R, R + 0.85);
  const dockAt = R + 0.85;
  const dock = springAt(t, dockAt - 0.05, 0.6);
  const flash = (() => { const v = clamp((t - P) / 0.34); return v > 0 && v < 1 ? Math.sin(Math.PI * v) : 0; })();
  const work = p(t, P, P + 0.55);
  const workOut = 1 - q(t, R + 0.2, R + 0.5);

  // ---- 尺寸 ----
  const reqSize = Math.max(30, Math.min(38, 680 / Math.max(1, textWidth(c.request, 1))));
  const reqW = textWidth(c.request, reqSize) + reqSize * 1.5, reqH = reqSize * 2.1;
  const resSize = Math.min(46, 560 / Math.max(1, textWidth(c.result, 1)));
  const resW = textWidth(c.result, resSize) + resSize * 1.5, resH = resSize * 2.0;
  const nameSize = Math.min(80, (CARD.w - 70) / Math.max(1, textWidth(c.server.name, 1)));
  const subSize = Math.max(28, Math.min(32, (CARD.w - 70) / Math.max(1, textWidth(c.server.sub ?? '', 1))));
  const youSize = Math.min(c.you.logo ? 46 : 72, 300 / Math.max(1, textWidth(c.you.name, 1)));
  const monoW = (s: string, size: number) => Array.from(s).length * 0.6 * size;
  const addrSize = Math.min(34, 900 / Math.max(1, textWidth(c.addressLabel, 1) + Array.from(c.address).length * 0.6 + 0.6));
  const addrW = textWidth(c.addressLabel, addrSize) + addrSize * 0.6 + monoW(c.address, addrSize) + addrSize * 1.8;

  // 请求：从 Logo 中心出发，钻进服务器卡（卡在上层，自然“吞进去”）
  const reqStart = LX0 + reqW / 2;   // 从 Logo 右侧的去程起点长出来，不压 Logo、不出左侧安全区
  const reqX = mix(reqStart, SRV_X, go);
  const reqIn = p(t, D, D + 0.28);
  // 结果：从服务器出来，停在回程左端
  const dockX = LX0 + resW / 2;
  const resX = mix(SRV_X, dockX, back);
  const resIn = t >= R ? 1 : 0;

  // 耗时读数：整趟往返期间按真实比例走
  const tripP = clamp((t - D) / Math.max(0.01, dockAt - D));
  const secs = (c.seconds ?? 0) * tripP;
  const showTime = !!c.timeLabel && typeof c.seconds === 'number';
  const timeIn = p(t, D, D + 0.3);
  const timeDone = t >= dockAt;
  const tSize = 46;
  const secStr = secs.toFixed(2);

  const hi = c.highlight && c.result.includes(c.highlight) ? c.highlight : '';
  const [rb, ra = ''] = hi ? c.result.split(hi) : [c.result, ''];

  const lane = (y: number, from: number, to: number, ink: number, dir: 1 | -1) => {
    const len = (to - from) * lanes;
    const x0 = dir === 1 ? from : to - len;
    const hx = dir === 1 ? to : from;
    return <g>
      <line x1={x0} y1={y} x2={x0 + len} y2={y} stroke="#dcdce0" strokeWidth={6} strokeLinecap="round" />
      {ink > 0 && <line x1={dir === 1 ? from : to} y1={y} x2={dir === 1 ? Math.min(to, from + ink) : Math.max(from, to - ink)} y2={y} stroke={S.ink} strokeWidth={6} strokeLinecap="round" />}
      {lanes > 0.98 && !(dir === -1 && ink > (to - from) * 0.5) && <path d={`M${hx - dir * 18} ${y - 16} L${hx} ${y} L${hx - dir * 18} ${y + 16}`} fill="none"
        stroke={ink >= to - from - 2 ? S.ink : '#dcdce0'} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />}
    </g>;
  };

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, opacity: enter, transform: `translateY(${(1 - enter) * 30}px)` }}>
        {/* 两条路：去程 / 回程 */}
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
          {lane(REQ_Y, LX0, LX1, clamp(reqX - LX0, 0, LX1 - LX0), 1)}
          {lane(RES_Y, LX0, LX1, t >= R ? clamp(LX1 - (resX - resW / 2), 0, LX1 - LX0) : 0, -1)}
        </svg>

        {/* 调用地址：挂在去程上方 */}
        <Surface box={{ x: (LX0 + LX1) / 2 - addrW / 2, y: REQ_Y - 132, w: addrW, h: addrSize * 2.2 }} radius={addrSize * 1.1}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: addrSize * 0.6, clipPath: `inset(0 ${100 * (1 - addr)}% 0 0 round ${addrSize * 1.1}px)` }}>
          <span style={{ ...textBase(addrSize, 500), color: S.muted }}>{c.addressLabel}</span>
          <span style={{ fontFamily: S.mono, fontWeight: 600, fontSize: addrSize, fontSynthesis: 'none', whiteSpace: 'nowrap', color: S.ink }}>{c.address}</span>
        </Surface>

        {/* 左：你 */}
        {c.you.logo ? <ImgFill src={c.you.logo} style={{ position: 'absolute', left: YOU_X - 92, top: CY - 112, width: 184, height: 184, objectFit: 'contain', zIndex: 2 }} /> : null}
        <div style={{ position: 'absolute', left: YOU_X - 200, width: 400, top: c.you.logo ? CY + 88 : CY - youSize * 0.6, textAlign: 'center', ...textBase(youSize, 900), color: S.ink }}>{c.you.name}</div>

        {/* 请求胶囊（在服务器卡下层） */}
        {t >= D && go < 1 && <Pill box={{ x: reqX - reqW / 2, y: REQ_Y - reqH / 2, w: reqW, h: reqH }}
          style={{ zIndex: 5, transformOrigin: 'left center', transform: `scale(${mix(0.4, 1, reqIn)})`, opacity: clamp(reqIn * 4) }}>
          <span style={{ ...textBase(reqSize, 500), color: '#fff' }}>{c.request}</span>
        </Pill>}

        {/* 结果胶囊：出来、沿回程走、停靠后轻弹一下 */}
        {resIn > 0 && <Pill box={{ x: resX - resW / 2, y: RES_Y - resH / 2, w: resW, h: resH }}
          style={{ zIndex: back < 0.3 ? 5 : 12, transform: `scale(${t >= dockAt - 0.05 ? mix(1.08, 1, dock) : 1})`, transformOrigin: 'left center' }}>
          <span style={{ ...textBase(resSize, 900), color: '#fff' }}>{rb}{hi && <span style={{ color: accentOn(true) }}>{hi}</span>}{ra}</span>
        </Pill>}

        {/* 右：服务器 */}
        <div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: S.radius, background: S.dark,
          boxShadow: S.capsuleShadow, zIndex: 10, overflow: 'hidden', transform: `scale(${1 + 0.035 * flash})` }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {c.server.kicker ? <span style={{ ...textBase(Math.max(28, Math.min(32, (CARD.w - 60) / Math.max(1, textWidth(c.server.kicker, 1)))), 500), color: '#a3a3ab', whiteSpace: 'normal', width: CARD.w - 60, textAlign: 'center' }}>{c.server.kicker}</span> : null}
            <span style={{ ...textBase(nameSize, 900), color: flash > 0.2 ? accentOn(true) : '#fff' }}>{c.server.name}</span>
            {c.server.sub ? <span style={{ ...textBase(subSize, 500), color: '#a3a3ab', whiteSpace: 'normal', width: CARD.w - 60, textAlign: 'center' }}>{c.server.sub}</span> : null}
          </div>
          {work > 0 && <div style={{ position: 'absolute', left: 40, right: 40, bottom: 30, height: 8, borderRadius: 4, background: '#3a3a40', opacity: workOut }}>
            <div style={{ width: `${100 * work}%`, height: '100%', borderRadius: 4, background: accentOn(true) }} />
          </div>}
        </div>

        {/* 耗时读数 */}
        {showTime && timeIn > 0 && <div style={{ position: 'absolute', left: (LX0 + LX1) / 2 - 300, width: 600, top: RES_Y + 92 + (1 - timeIn) * 16, textAlign: 'center', opacity: timeIn }}>
          <span style={{ ...textBase(tSize, 500), color: S.muted }}>{c.timeLabel} </span>
          <span style={{ ...textBase(tSize * 1.25, 900), color: timeDone ? accentOn(false) : S.ink, fontVariantNumeric: 'tabular-nums' }}>{secStr}</span>
          <span style={{ ...textBase(tSize, 900), color: timeDone ? accentOn(false) : S.ink }}> 秒</span>
        </div>}
      </div>
    </Handoff>
    
    
    
    
  </Frame>;
}
