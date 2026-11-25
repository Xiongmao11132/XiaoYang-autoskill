// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T01h-CautionTag.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：注意澄清（正版 T01h）——一个容易误会的点 → “注意”标签盖下，澄清句落定。
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

export type YangCautionTagProps = YangHandoffProps & {
  subject: string;      // 容易被误会的对象（先出现）
  clarify: string;      // 澄清句（盖章后长出来）
  highlight: string;    // clarify 里染紫的词（黑胶囊上 #D6BEFF）
  stamp: string;        // 方章文字，1–2 个字
  backdrop?: string;    // 可选：虚化在后面的录屏/截图
  cues?: number[];      // [0]=方章盖下，[1]=澄清句长出
};

export const yangCautionTagDefaults: YangCautionTagProps = {
  subject: 'JEV-27B',
  clarify: '不是 JEV 官方出的',
  highlight: '不是',
  stamp: '注意',
};

const overshoot = (t: number, a: number, rise: number, settle: number, amount: number) =>
  p(t, a, a + rise) * (1 + amount) - amount * q(t, a + rise, a + rise + settle);

export function YangCautionTag(props: Partial<YangCautionTagProps>) {
  const c = { ...yangCautionTagDefaults, ...props };
  const t = useT();

  // —— 终态版式（先算终态，再让东西走到终态）——
  // 一行放得下 ≥84px 就一行胶囊；否则澄清句折成两行，容器从胶囊长成圆角黑卡（同一对象），不塞细长胶囊
  const subjU = textWidth(c.subject, 1);
  const gapU = 0.36;
  const restU = textWidth(c.clarify, 1);
  const EXTRA = 3.3;                               // 方章 + 内边距约 3.3 个字宽
  const one = Math.min(124, 1680 / (subjU + gapU + restU + EXTRA));
  const hl = c.highlight && c.clarify.includes(c.highlight) ? c.highlight : '';
  let rows: string[] = [c.clarify];
  if (one < 84) {
    const chars = Array.from(c.clarify);
    const hiA = hl ? c.clarify.indexOf(hl) : -1, hiB = hiA + Array.from(hl).length;
    let best = Math.ceil(chars.length / 2), score = Infinity, acc = 0;
    for (let i = 1; i < chars.length; i++) {
      acc += textWidth(chars[i - 1], 1);
      const l1 = subjU + gapU + acc, l2 = restU - acc;
      const sc = Math.abs(l1 - l2) - (/[，,：:；;]/.test(chars[i - 1]) ? 6.5 : /[、]/.test(chars[i - 1]) ? 2.5 : 0) + (hiA >= 0 && i > hiA && i < hiB ? 6 : 0)
        + (/[A-Za-z0-9]/.test(chars[i - 1]) && /[A-Za-z0-9]/.test(chars[i]) ? 6 : 0);
      if (sc < score) { score = sc; best = i; }
    }
    rows = [chars.slice(0, best).join(''), chars.slice(best).join('').trim()];
  }
  const two = rows.length > 1;
  const line1U = subjU + gapU + textWidth(rows[0], 1);
  const line2U = two ? textWidth(rows[1], 1) : 0;
  const size = two ? Math.min(124, 1680 / (Math.max(line1U, line2U) + EXTRA)) : one;
  const h0 = size * 1.86;                          // 只有对象时的胶囊高
  const LH = two ? size * 1.32 : h0;
  const h1 = two ? LH * 2 + size * 0.7 : h0;
  const r1 = two ? Math.min(h1 / 2, size * 0.78) : h0 / 2;
  const ST = Math.round(h0 * 1.12);                // 方章边长
  const OV = ST * 0.32;                            // 方章压住容器左端的宽度
  const pad = size * 0.7;                          // MiSans Heavy 的拉丁字母比 0.58 估算略宽，右侧多留一点
  const subjW = subjU * size, gapW = gapU * size;
  const w0 = subjW + pad * 2;                      // 只有对象时
  const w1 = OV + size * 0.5 + Math.max(line1U, line2U) * size + pad;
  const groupW = ST - OV + w1;
  const left = 960 - groupW / 2;
  const cy = 500;                                  // 字幕区上方
  const x0 = 960 - w0 / 2, x1 = left + ST - OV;
  const tx0 = x0 + pad, tx1 = x1 + OV + size * 0.5;

  // —— 时间 ——
  const stampAt = cueAt(c.cues, 0, 0.5);
  const extAt = cueAt(c.cues, 1, stampAt + 0.3);
  const open = overshoot(t, 0, 0.36, 0.22, 0.05);
  const slam = springAt(t, stampAt, 0.55);
  const stampVis = clamp((t - stampAt) / 0.06);
  const hit = clamp((t - stampAt - 0.12) / 0.3);   // 盖下那一下：胶囊轻微下压后回位
  const jolt = hit > 0 && hit < 1 ? Math.sin(hit * Math.PI) * (1 - hit) * 10 : 0;
  const ext = overshoot(t, extAt, 0.5, 0.24, 0.03);
  const reveal = p(t, extAt + 0.08, extAt + (two ? 0.5 : 0.62));
  const reveal2 = p(t, extAt + 0.32, extAt + 0.78);

  const pw = mix(Math.min(h0, w0), w0, clamp(open)) * (open > 1 ? open : 1);
  const pillW = ext > 0 ? mix(w0, w1, ext) : pw;
  const pillX = ext > 0 ? mix(x0, x1, ext) : 960 - pw / 2;
  const textX = mix(tx0, tx1, clamp(ext));
  const pillH = ext > 0 ? mix(h0, h1, clamp(ext)) : h0;
  const radius = ext > 0 ? mix(h0 / 2, r1, clamp(ext)) : h0 / 2;
  const textTop = mix((h0 - LH) / 2, (h1 - LH * rows.length) / 2, clamp(ext));
  const seg = (text: string) => {
    if (!hl || !text.includes(hl)) return <>{text}</>;
    const i = text.indexOf(hl);
    return <>{text.slice(0, i)}<span style={{ color: accentOn(true) }}>{hl}</span>{text.slice(i + hl.length)}</>;
  };

  // 方章：从上方 1.8 倍、斜 −24° 盖下到 −8°
  const sScale = mix(1.8, 1, slam);
  const sRot = mix(-24, -8, slam);
  const stampSize = Math.min(ST * 0.36, (ST * 0.74) / Math.max(1, textWidth(c.stamp, 1)));
  const border = Math.max(8, ST * 0.055);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {c.backdrop && <>
        <div style={{ position: 'absolute', inset: 0, filter: 'blur(16px)', transform: 'scale(1.04)' }}>
          <Media src={c.backdrop} box={{ x: 0, y: 0, w: 1920, h: 1080 }} radius={0} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.76 }} />
      </>}

      {/* 黑胶囊：对象 → 澄清句（文字随容器右端露出，不淡入叠字）；两行时同一容器长高成圆角黑卡 */}
      <div style={{
        position: 'absolute', left: pillX, top: cy - pillH / 2 + jolt, width: pillW, height: pillH, borderRadius: radius,
        background: S.dark, boxShadow: S.capsuleShadow, overflow: 'hidden', opacity: clamp(t / 0.08),
      }}>
        <div style={{ position: 'absolute', left: textX - pillX, top: textTop, height: LH, display: 'flex', alignItems: 'center' }}>
          <span style={{ ...textBase(size, 900), color: '#fff', opacity: clamp((open - 0.35) / 0.4) }}>{c.subject}</span>
          {ext > 0 && <span style={{
            display: 'inline-block', marginLeft: gapW, clipPath: `inset(-20% ${100 * (1 - reveal)}% -20% 0)`,
            transform: `translateX(${(1 - reveal) * 18}px)`,
          }}>
            <span style={{ ...textBase(size, 900), color: '#fff' }}>{seg(rows[0])}</span>
          </span>}
        </div>
        {two && ext > 0 && <div style={{
          position: 'absolute', left: textX - pillX, top: textTop + LH, height: LH, display: 'flex', alignItems: 'center',
          clipPath: `inset(-20% ${100 * (1 - reveal2)}% -20% 0)`, transform: `translateX(${(1 - reveal2) * 18}px)`,
        }}>
          <span style={{ ...textBase(size, 900), color: '#fff' }}>{seg(rows[1])}</span>
        </div>}
      </div>

      {/* 黑框方章 */}
      {stampVis > 0 && <div style={{
        position: 'absolute', left: mix(x0 - ST + OV * 0.45, left, clamp(ext)), top: cy - ST / 2 + jolt * 0.4, width: ST, height: ST, borderRadius: 26,
        background: '#fff', border: `${border}px solid ${S.dark}`, boxSizing: 'border-box', boxShadow: S.capsuleShadow,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `rotate(${sRot}deg) scale(${sScale})`, opacity: stampVis, zIndex: 2,
      }}>
        <span style={{ ...textBase(stampSize, 400, S.display), color: S.dark, lineHeight: 1 }}>{c.stamp}</span>
      </div>}
    </Handoff>
    
    
    
  </Frame>;
}
