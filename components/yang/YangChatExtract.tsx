// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T10a-ChatExtract.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-extra2-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-extra2-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：长回复拎要点（正版 T10a）——AI 一大段回复 → 其中几条关键句被拎出来排成清单。
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

export type YangExtractItem = {
  name: string;     // 清单行的名字（加粗），如产品名
  note: string;     // 名字后的一句说明
  box: Box;         // 这句在截图里的像素框（源图像素）
};
export type YangChatExtractProps = YangHandoffProps & {
  image: string;                          // 真实回复截图（public 下路径）
  imageSize: { w: number; h: number };
  maskBoxes?: Box[];                      // 源图里要实心盖掉的区域（源图像素）
  maskColor?: string;
  items: YangExtractItem[];                   // 2–4 条；最后一条是推荐项，会变黑
  cues?: number[];                        // [i]=第 i 句提起；[n]=截图让位、句条飞向清单；[n+1]=推荐项变黑
};

export const yangChatExtractDefaults: YangChatExtractProps = {
  image: '',
  imageSize: { w: 2210, h: 1870 },
  maskBoxes: [{ x: 180, y: 1742, w: 222, h: 60 }],
  maskColor: '#fff',
  items: [
    { name: 'Subtitle Edit', note: '字幕精修', box: { x: 485, y: 745, w: 572, h: 55 } },      // 第二个值得试的是 Subtitle Edit
    { name: 'whisper.cpp', note: '以后做进 YangTalk', box: { x: 1078, y: 1151, w: 1004, h: 55 } }, // 以后要把录音转 SRT 做进 YangTalk，再选 whisper.cpp
    { name: 'Buzz', note: '现在先试', box: { x: 285, y: 1151, w: 274, h: 55 } },             // 我的选择是：现在先试 Buzz
  ],
};

// 主曲线先冲过目标一点、再回落（motion-craft §2）
const overshoot = (t: number, a: number, rise: number, settle: number, amount: number) =>
  p(t, a, a + rise) * (1 + amount) - amount * q(t, a + rise, a + rise + settle);

const COL_RIGHT = 1840;
const LIFT = 1.4;          // 原位提起的放大倍数（让截图里的小字读得清）
const MARK = 'rgba(133, 84, 232, 0.16)';

export function YangChatExtract(props: Partial<YangChatExtractProps>) {
  const c = { ...yangChatExtractDefaults, ...props };
  const t = useT();
  const items = c.items.slice(0, 4);
  const n = Math.max(1, items.length);
  const rec = n - 1;   // 推荐项 = 最后一条

  // —— 清单行排版：同组同字阶，按最长一行算字号；放不下就换成两行（名字 / 说明） ——
  const PAD = 34, BADGE = 62, BGAP = 26;
  const MAX_COL = 820, MIN_COL = 600;
  const oneLine = (s: number, it: YangExtractItem) => textWidth(it.name, s) + s * 0.55 + textWidth(it.note, s * 0.86);
  let size = 52;
  while (size > 40 && Math.max(...items.map((it) => oneLine(size, it))) > MAX_COL - PAD * 2 - BADGE - BGAP) size -= 2;
  const twoLine = Math.max(...items.map((it) => oneLine(size, it))) > MAX_COL - PAD * 2 - BADGE - BGAP;
  if (twoLine) {
    size = 48;
    while (size > 36 && Math.max(...items.map((it) => Math.max(textWidth(it.name, size), textWidth(it.note, size * 0.82)))) > MAX_COL - PAD * 2 - BADGE - BGAP) size -= 2;
  }
  const textW = Math.max(...items.map((it) => twoLine ? Math.max(textWidth(it.name, size), textWidth(it.note, size * 0.82)) : oneLine(size, it)));
  const colW = clamp(textW + PAD * 2 + BADGE + BGAP + 10, MIN_COL, MAX_COL);
  const rowH = twoLine ? size * 2.5 + 30 : Math.max(118, size * 2.2);
  const GAP = n > 3 ? 22 : 30;
  const groupH = n * rowH + (n - 1) * GAP;
  const colX = COL_RIGHT - colW;
  const rowBox = (i: number): Box => ({ x: colX, y: 520 - groupH / 2 + i * (rowH + GAP), w: colW, h: rowH });

  // —— 截图卡：开场居中读清 → 让到左侧退后 ——
  const aspect = c.imageSize.w / c.imageSize.h;
  const h0 = Math.min(900, 1500 / aspect), w0 = h0 * aspect;
  const A: Box = { x: 960 - w0 / 2, y: 545 - h0 / 2, w: w0, h: h0 };
  const leftRoom = colX - 70 - 80;
  const h1 = Math.min(840, leftRoom / aspect), w1 = h1 * aspect;
  const B: Box = { x: 80 + (leftRoom - w1) / 2, y: 545 - h1 / 2, w: w1, h: h1 };

  // —— 时间 ——
  const enter = p(t, 0, 0.45);
  const liftAt = (i: number) => cueAt(c.cues, i, [0.7, 1.18, 1.62, 2.0][i] ?? 0.7 + i * 0.45);
  const moveAt = cueAt(c.cues, n, liftAt(n - 1) + 0.62);
  const recAt = cueAt(c.cues, n + 1, moveAt + 1.55);
  const shift = quintic(t, moveAt, moveAt + 0.72);
  const card = between(A, B, shift);
  const k = card.w / c.imageSize.w;
  const stage = (b: Box): Box => ({ x: card.x + b.x * k, y: card.y + (1 - enter) * 40 + b.y * k, w: b.w * k, h: b.h * k });

  const recede = shift;   // 退后与让位共用同一进度
  const flyAt = (i: number) => moveAt + 0.08 + i * 0.15;
  const black = p(t, recAt, recAt + 0.42);
  const blackPop = 0.03 * Math.sin(Math.PI * clamp((t - recAt) / 0.5));   // 变黑时轻轻鼓一下再回到原大小

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 材料层：真实截图 + 盖掉的权限标识 + 提起后原位留下的浅紫印子 */}
      <div style={{
        ...abs({ ...card, y: card.y + (1 - enter) * 40 }), borderRadius: S.radius, overflow: 'hidden', boxShadow: S.shadow, background: '#fff',
        opacity: clamp(enter * 1.6), filter: recede > 0.01 ? `blur(${recede * 1.5}px)` : undefined,
      }}>
        <ImgFill src={c.image} style={{ width: '100%', height: '100%', display: 'block' }} />
        {(c.maskBoxes ?? []).map((m, i) => <div key={i} style={{
          position: 'absolute', left: m.x * k, top: m.y * k, width: m.w * k, height: m.h * k, background: c.maskColor ?? '#fff',
        }} />)}
        {items.map((it, i) => {
          const m = p(t, liftAt(i), liftAt(i) + 0.3);
          return m > 0 && <div key={i} style={{
            position: 'absolute', left: (it.box.x - 8) * k, top: (it.box.y - 4) * k, width: (it.box.w + 16) * k, height: (it.box.h + 8) * k,
            background: MARK, borderRadius: 8, opacity: m,
          }} />;
        })}
        <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.42 * recede }} />
      </div>

      {/* 前景：从原位提起的句条 → 飞到右侧变成清单行 */}
      {items.map((it, i) => {
        const la = liftAt(i);
        if (t < la) return null;
        const lift = overshoot(t, la, 0.34, 0.2, 0.06);
        const fa = flyAt(i);
        const move = q(t, fa, fa + 0.68);
        const pixOut = clamp((move - 0.34) / 0.2);        // 后半程像素条先淡干净
        const morph = clamp((move - 0.56) / 0.26);        // 再淡入排好的字（两层不同时出现，避免叠字）
        const src = stage(it.box);
        // 原位提起：以句条中心放大，略向上浮
        const pad = 10 * LIFT;
        const sw = src.w * mix(1, LIFT, lift) + pad * 2, sh = src.h * mix(1, LIFT, lift) + pad;
        const lifted: Box = { x: clamp(src.x + src.w / 2 - sw / 2, 80, 1840 - sw), y: src.y + src.h / 2 - sh / 2 - 10 * lift, w: sw, h: sh };
        const b = between(lifted, rowBox(i), move);
        const tilt = Math.sin(Math.PI * move) * -1.6;
        const isRec = i === rec;
        const dark = isRec ? black : 0;
        const lineH = sh - pad;   // 像素条在框里的高度（保持比例）
        const imgH = mix(lineH, rowBox(i).h * 0.36, move);
        const imgW = imgH * (it.box.w / it.box.h);
        return <div key={i} style={{
          ...abs(b), zIndex: 20 + i, transform: `rotate(${tilt}deg) scale(${1 + (isRec ? blackPop : 0)})`, transformOrigin: '50% 50%',
        }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: mix(12, S.radius, move), background: '#fff', overflow: 'hidden',
            boxShadow: dark > 0.5 ? S.capsuleShadow : S.shadow,
          }}>
            {/* 真实像素条：提起时读清，飞行后半程淡出 */}
            <div style={{
              position: 'absolute', left: mix(pad, PAD, move), top: (b.h - imgH) / 2, width: imgW, height: imgH, overflow: 'hidden', opacity: 1 - pixOut,
            }}>
              <ImgFill src={c.image} style={{
                position: 'absolute', width: c.imageSize.w * (imgH / it.box.h), height: c.imageSize.h * (imgH / it.box.h),
                left: -it.box.x * (imgH / it.box.h), top: -it.box.y * (imgH / it.box.h), maxWidth: 'none',
              }} />
            </div>
            {/* 排好的清单行（两层：白卡黑字 / 黑卡白字，黑色从左往右刷过） */}
            {morph > 0 && <>
              <Row it={it} i={i} size={size} twoLine={twoLine} pad={PAD} badge={BADGE} bgap={BGAP} h={rowBox(i).h} dark={false} op={morph} />
              {isRec && black > 0 && <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 * (1 - black)}% 0 0)` }}>
                <div style={{ position: 'absolute', inset: 0, background: S.dark }} />
                <Row it={it} i={i} size={size} twoLine={twoLine} pad={PAD} badge={BADGE} bgap={BGAP} h={rowBox(i).h} dark op={1} />
              </div>}
            </>}
          </div>
        </div>;
      })}
    </Handoff>
    
    
    
  </Frame>;
}

function Row({ it, i, size, twoLine, pad, badge, bgap, h, dark, op }: {
  it: YangExtractItem; i: number; size: number; twoLine: boolean; pad: number; badge: number; bgap: number; h: number; dark: boolean; op: number;
}) {
  const ink = dark ? '#fff' : S.ink;
  const nameColor = dark ? accentOn(true) : S.ink;
  const tx = pad + badge + bgap;
  return <div style={{ position: 'absolute', inset: 0, opacity: op }}>
    <div style={{
      position: 'absolute', left: pad, top: (h - badge) / 2, width: badge, height: badge, borderRadius: badge / 2,
      background: dark ? '#fff' : S.dark, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ ...textBase(badge * 0.56, 900), color: dark ? S.ink : '#fff', lineHeight: 1 }}>{i + 1}</span>
    </div>
    {twoLine ? <div style={{ position: 'absolute', left: tx, top: 0, height: h, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: size * 0.12 }}>
      <span style={{ ...textBase(size, 900), color: nameColor, lineHeight: 1.1 }}>{it.name}</span>
      <span style={{ ...textBase(size * 0.82, 500), color: ink, lineHeight: 1.1 }}>{it.note}</span>
    </div> : <div style={{ position: 'absolute', left: tx, top: 0, height: h, display: 'flex', alignItems: 'center', gap: size * 0.55 }}>
      <span style={{ ...textBase(size, 900), color: nameColor, lineHeight: 1 }}>{it.name}</span>
      <span style={{ ...textBase(size * 0.86, 500), color: ink, lineHeight: 1 }}>{it.note}</span>
    </div>}
  </div>;
}
