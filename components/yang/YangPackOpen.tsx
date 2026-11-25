// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T04e-PackOpen.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：拆开看里面装了什么（正版 T04e）——一个整体（如仓库）→ 分层拆开，露出里面的几样东西。
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

export type YangPackPart = {
  image: string;   // 这块预先裁好的原像素小图（与 box 同尺寸）
  box: Box;        // 这块在源图里的像素框（裁切边落在行间分隔线 / 留白上），用来定位它在页卡上的原位
  label: string;   // 下方黑胶囊里的名字
};

export type YangPackOpenProps = YangHandoffProps & {
  cardImage: string;      // 页卡图（预先从源图 cardCrop 范围裁出并缩小；不直接加载 3840×9184 长图，避免无头浏览器解码卡住）
  cardCrop: Box;          // 页卡图对应的源图范围（源图像素），用来换算各块原位
  parts: YangPackPart[];      // 2–4 块，按讲解顺序
  result: string;         // 结论
  highlight?: string;     // 结论里染紫的词
  cues?: number[];        // [i]=第 i 块拎出；[n]=结论出现
};

export const yangPackOpenDefaults: YangPackOpenProps = {
  cardImage: '',
  cardCrop: { x: 700, y: 330, w: 2480, h: 2640 },
  parts: [
    { image: '', box: { x: 716, y: 818, w: 434, h: 410 }, label: '代码' },                 // 文件列表 5 个文件夹
    { image: '', box: { x: 1240, y: 2440, w: 760, h: 240 }, label: 'README 说明书' },      // README 标题 + 一句话介绍
    { image: '', box: { x: 2592, y: 1374, w: 552, h: 230 }, label: 'Releases 软件' },      // 右侧 Releases 区块
  ],
  result: '仓库 = 这个项目的文件夹',
  highlight: '文件夹',
};

// 锐字真言只用于中文；拉丁与符号换 MiSans Heavy（同字号、同基线）
function DisplayText({ text, size, color, hl }: { text: string; size: number; color: string; hl?: string }) {
  const i = hl ? text.indexOf(hl) : -1;
  const segs = i < 0 ? [{ s: text, c: color }] : [{ s: text.slice(0, i), c: color }, { s: hl!, c: accentOn(true) }, { s: text.slice(i + hl!.length), c: color }];
  return <span style={{ ...textBase(size, 400, S.display), lineHeight: 1 }}>
    {segs.map((g, k) => (g.s.match(/[\u0000-ÿ]+|[^\u0000-ÿ]+/g) ?? []).map((r, j) => /^[\u0000-ÿ]+$/.test(r)
      ? <span key={`${k}-${j}`} style={{ fontFamily: S.body, fontWeight: 900, color: g.c }}>{r}</span>
      : <span key={`${k}-${j}`} style={{ color: g.c }}>{r}</span>))}
  </span>;
}
const dUnits = (s: string) => Array.from(s).reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.68 : /[\u0000-ÿ]/.test(ch) ? 0.6 : 1), 0);

const TOP = 140, BOTTOM = 880;
const PAD = 22;        // 前景卡内边距

export function YangPackOpen(props: Partial<YangPackOpenProps>) {
  const c = { ...yangPackOpenDefaults, ...props };
  const t = useT();
  const parts = c.parts.slice(0, 4);
  const n = Math.max(1, parts.length);
  const cc = c.cardCrop;

  // —— 页卡（建立）：高度放进安全区，居中 ——
  const k0 = Math.min((BOTTOM - TOP) / cc.h, 1500 / cc.w);
  const CW = cc.w * k0, CH = cc.h * k0;
  const card: Box = { x: 960 - CW / 2, y: TOP + (BOTTOM - TOP - CH) / 2, w: CW, h: CH };
  const onCard = (b: Box): Box => ({ x: card.x + (b.x - cc.x) * k0, y: card.y + (b.y - cc.y) * k0, w: b.w * k0, h: b.h * k0 });

  // —— 终态：上方结论胶囊，中间一排前景卡，下方一行名字胶囊 ——
  const rSize = Math.min(72, 1400 / Math.max(1, dUnits(c.result)));
  const rH = Math.round(rSize * 1.75), rW = dUnits(c.result) * rSize + rSize * 1.6;
  const lSize = Math.min(46, ...parts.map((pt) => 380 / Math.max(1, dUnits(pt.label) + 1.4)));
  const lH = Math.round(lSize * 1.75);
  const GAP = 52, G1 = 54, G2 = 30;
  const availH = BOTTOM - TOP - 10 - rH - G1 - G2 - lH;
  const s = Math.min(1.0, (availH - 2 * PAD) / Math.max(...parts.map((pt) => pt.box.h)),
    (1760 - (n - 1) * GAP - n * 2 * PAD) / parts.reduce((a, pt) => a + pt.box.w, 0));
  const ws = parts.map((pt) => pt.box.w * s + 2 * PAD), hs = parts.map((pt) => pt.box.h * s + 2 * PAD);
  const rowW = ws.reduce((a, b) => a + b, 0) + (n - 1) * GAP;
  const maxH = Math.max(...hs);
  const groupH = rH + G1 + maxH + G2 + lH;                   // 整组在安全区里上下居中
  const gTop = TOP + (BOTTOM - TOP - groupH) / 2;
  const rBox: Box = { x: 960 - rW / 2, y: gTop, w: rW, h: rH };
  const midY = gTop + rH + G1 + maxH / 2;
  const slots: Box[] = parts.map((_, i) => ({ x: 960 - rowW / 2 + ws.slice(0, i).reduce((a, b) => a + b, 0) + i * GAP, y: midY - hs[i] / 2, w: ws[i], h: hs[i] }));
  const pillY = midY + maxH / 2 + G2;

  // —— 时间线 ——
  const enter = p(t, 0, 0.5);
  const at = parts.map((_, i) => cueAt(c.cues, i, 1.15 + i * 0.5));
  const LIFT = 0.8;
  const resAt = cueAt(c.cues, n, at[n - 1] + LIFT + 0.55);
  const recede = q(t, at[0], at[0] + 0.8);
  const res = p(t, resAt, resAt + 0.55) * 1.04 - 0.04 * q(t, resAt + 0.55, resAt + 0.85);   // 胶囊横向展开，过冲 4% 回落

  const fill = (src: string) => <ImgFill src={src} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'block' }} />;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 页卡：真实仓库页，拎出开始后退后 */}
      <div style={{
        position: 'absolute', inset: 0, opacity: enter * mix(1, 0.9, recede), transformOrigin: `960px ${card.y + card.h / 2}px`,
        transform: `translateY(${(1 - enter) * 40}px) scale(${mix(1, 0.94, recede)})`, filter: recede > 0.01 ? `blur(${12 * recede}px)` : undefined,
      }}>
        <div style={{ position: 'absolute', left: card.x, top: card.y, width: card.w, height: card.h, borderRadius: S.radius, overflow: 'hidden', boxShadow: S.shadow, background: '#fff' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: card.w, height: card.h }}>{fill(c.cardImage)}</div>
          {/* 拎出后原位留一块浅灰空位，像被取走 */}
          {parts.map((pt, i) => {
            const b = onCard(pt.box);
            const gone = p(t, at[i] + 0.05, at[i] + 0.3);
            return <div key={i} style={{ position: 'absolute', left: b.x - card.x - 4, top: b.y - card.y - 4, width: b.w + 8, height: b.h + 8, borderRadius: 8, background: S.ink, opacity: 0.06 * gone }} />;
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.6 * recede }} />

      {/* 各块：先在页上描边点亮，再原位拎出、放大、飞到前景一排 */}
      {parts.map((pt, i) => {
        const mark = p(t, at[i] - 0.4, at[i] - 0.1);
        const lift = q(t, at[i], at[i] + LIFT);
        const from = onCard(pt.box);
        const fromPad: Box = { x: from.x - 6, y: from.y - 6, w: from.w + 12, h: from.h + 12 };
        const box = between(fromPad, slots[i], lift);
        const pad = mix(6, PAD, lift);
        const inner: Box = { x: pad, y: pad, w: box.w - 2 * pad, h: box.h - 2 * pad };
        const arc = Math.sin(Math.PI * lift) * -40;     // 拎起来的一点弧度
        const shadow = `0 ${mix(4, 22, lift)}px ${mix(8, 40, lift)}px 0 rgba(0,0,0,${mix(0.08, 0.18, lift)})`;
        return <React.Fragment key={i}>
          {/* 页上描边（拎出前提示位置）：随页卡一起，不受失焦影响 */}
          {lift < 0.02 && mark > 0 && <div style={{
            position: 'absolute', left: fromPad.x, top: fromPad.y, width: fromPad.w, height: fromPad.h, borderRadius: 10, boxSizing: 'border-box',
            border: `5px solid ${S.accent}`, opacity: mark, transform: `scale(${mix(1.15, 1, mark)})`,
          }} />}
          {lift > 0.001 && <div style={{
            position: 'absolute', left: box.x, top: box.y + arc, width: box.w, height: box.h, borderRadius: mix(8, 20, lift), background: '#fff',
            boxShadow: shadow, overflow: 'hidden', zIndex: 10 + i,
          }}>
            <div style={{ position: 'absolute', left: inner.x, top: inner.y, width: inner.w, height: inner.h, overflow: 'hidden' }}>{fill(pt.image)}</div>
          </div>}
        </React.Fragment>;
      })}

      {/* 名字胶囊：落定后从中间向两边擦出 */}
      {parts.map((pt, i) => {
        const e = p(t, at[i] + LIFT - 0.15, at[i] + LIFT + 0.3);
        if (e <= 0) return null;
        const w = dUnits(pt.label) * lSize + lSize * 1.4;
        const cx = slots[i].x + slots[i].w / 2;
        return <Pill key={i} box={{ x: cx - w / 2, y: pillY + (1 - e) * 14, w, h: lH }} style={{ clipPath: `inset(0 ${50 * (1 - e)}% 0 ${50 * (1 - e)}% round ${lH / 2}px)` }}>
          <DisplayText text={pt.label} size={lSize} color="#fff" />
        </Pill>;
      })}

      {/* 结论胶囊：横向展开（过冲回落），字随后出现 */}
      {res > 0 && <Pill box={{ x: 960 - (rW * res) / 2, y: rBox.y, w: rW * res, h: rH }} style={{ overflow: 'hidden' }}>
        <div style={{ opacity: clamp((t - resAt - 0.2) / 0.25), whiteSpace: 'nowrap', minWidth: rW - rSize * 1.6, textAlign: 'center' }}>
          <DisplayText text={c.result} size={rSize} color="#fff" hl={c.highlight} />
        </div>
      </Pill>}
    </Handoff>
    
    
    
    
  </Frame>;
}
