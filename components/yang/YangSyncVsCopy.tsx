// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T05h-SyncVsCopy.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：一次性拷贝 vs 持续同步（正版 T05h）——同一个源头更新 → 拷贝的那份停在旧版本，同步的那份跟着更新。
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

export type YangCopyWay = { title: string; note: string; after: string };
export type YangSyncVsCopyProps = YangHandoffProps & {
  author: string;               // 作者项目名
  authorNote: string;           // 项目名前的小字
  versions: [string, string];   // 旧版本、新版本
  zip: YangCopyWay;                 // 拷贝那份（左）
  clone: YangCopyWay;               // 同步那份（右）
  cues?: number[];              // [0]=副本拷出 [1]=ZIP 断开 [2]=作者更新
};

export const yangSyncVsCopyDefaults: YangSyncVsCopyProps = {
  author: 'YangTalk',
  authorNote: '作者的项目',
  versions: ['v1', 'v2'],
  zip: { title: 'Download ZIP', note: '拷贝出去，就断开了', after: '停在 v1' },
  clone: { title: 'git clone', note: '一直连着源头', after: '跟着变成 v2' },
};

const CW = 470, CH = 250, CY = 560;
const LX = 960 - 470 - CW / 2, RX = 960 + 470 - CW / 2;   // 两份副本左边
const LINE = 9;

// 版本号原位翻动：旧的往上走，新的从下面上来（裁在一个窗口里）
function Roll({ from, to, v, size, color, toColor, w }: { from: string; to: string; v: number; size: number; color: string; toColor: string; w: number }) {
  const h = size * 1.2;
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: -v * h, textAlign: 'center', ...textBase(size, 900), lineHeight: `${h}px`, color }}>{from}</div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: (1 - v) * h, textAlign: 'center', ...textBase(size, 900), lineHeight: `${h}px`, color: toColor }}>{to}</div>
  </div>;
}

// 源头底边中点 → 副本顶边中点的 S 形曲线
const pt = (x0: number, y0: number, x1: number, y1: number, u: number) => {
  const my = (y0 + y1) / 2, m = 1 - u;
  return {
    x: m * m * m * x0 + 3 * m * m * u * x0 + 3 * m * u * u * x1 + u * u * u * x1,
    y: m * m * m * y0 + 3 * m * m * u * my + 3 * m * u * u * my + u * u * u * y1,
  };
};
const pathOf = (x0: number, y0: number, x1: number, y1: number, u0: number, u1: number) => {
  const N = 24;
  return Array.from({ length: N + 1 }, (_, i) => { const a = pt(x0, y0, x1, y1, mix(u0, u1, i / N)); return `${i ? 'L' : 'M'} ${a.x.toFixed(1)} ${a.y.toFixed(1)}`; }).join(' ');
};

export function YangSyncVsCopy(props: Partial<YangSyncVsCopyProps>) {
  const c = { ...yangSyncVsCopyDefaults, ...props };
  const t = useT();
  const [v1, v2] = c.versions;
  const nameLine = `${c.authorNote} · ${c.author}`;
  const srcW = Math.round(clamp(textWidth(nameLine, 30) + 90, 500, 900));   // 源头牌按名字宽度
  const SRC: Box = { x: 960 - srcW / 2, y: 150, w: srcW, h: 250 };

  // —— 时间线 ——
  const outAt = cueAt(c.cues, 0, 0.7);
  const cutAt = cueAt(c.cues, 1, outAt + 1.25);
  const updAt = cueAt(c.cues, 2, cutAt + 0.95);
  const srcIn = springAt(t, 0, 0.55);
  const out = q(t, outAt, outAt + 0.75);
  const tagIn = p(t, outAt + 0.55, outAt + 0.95);
  const cut = p(t, cutAt, cutAt + 0.45);
  const srcRoll = q(t, updAt, updAt + 0.45);
  const flowAt = updAt + 0.4, flowEnd = flowAt + 0.75;
  const flow = q(t, flowAt, flowEnd);
  const cloneRoll = q(t, flowEnd - 0.05, flowEnd + 0.4);
  const settle = p(t, flowEnd + 0.3, flowEnd + 0.75);

  // —— 尺寸：版本号、名字按宽度 ——
  const numSize = Math.min(130, (CW - 80) / Math.max(1, textWidth(v1, 1), textWidth(v2, 1)));
  const srcNum = Math.min(140, (SRC.w - 80) / Math.max(1, textWidth(v1, 1), textWidth(v2, 1)));
  const nameSize = Math.min(34, (SRC.w - 60) / Math.max(1, textWidth(nameLine, 1)));
  const tagSize = Math.min(40, ...[c.zip.title, c.clone.title].map((s) => (CW - 100) / Math.max(1, textWidth(s, 1) + 1.4)));
  const tagH = Math.round(tagSize * 1.75);
  const noteSize = Math.min(32, ...[c.zip.note, c.clone.note].map((s) => (CW + 120) / Math.max(1, textWidth(s, 1))));
  const afterSize = Math.min(36, ...[c.zip.after, c.clone.after].map((s) => (CW - 60) / Math.max(1, textWidth(s, 1))));

  // 副本：从源头身后滑出到左右
  const copyBox = (x: number): Box => ({ x: mix(SRC.x + (SRC.w - CW) / 2, x, out), y: mix(SRC.y, CY, out), w: CW, h: CH });
  const L = copyBox(LX), R = copyBox(RX);
  const sx = 960, sy = SRC.y + SRC.h;
  const zipDim = settle;

  const Copy = ({ b, way, isClone }: { b: Box; way: YangCopyWay; isClone: boolean }) => {
    const roll = isClone ? cloneRoll : 0;
    const dim = isClone ? 0 : zipDim;
    return <>
      <Surface box={b} style={{ opacity: clamp(out * 4) }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: (CH - numSize * 1.2) / 2 - mix(0, 22, settle), display: 'flex', justifyContent: 'center', opacity: clamp((out - 0.45) * 3) }}>
          <Roll from={v1} to={v2} v={roll} size={numSize} w={CW} color={S.ink} toColor={accentOn(false)} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: CH / 2 + numSize * 0.48, textAlign: 'center', opacity: settle, transform: `translateY(${(1 - settle) * 12}px)` }}>
          <span style={{ ...textBase(afterSize, 900), color: isClone ? accentOn(false) : S.muted }}>{way.after}</span>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.55 * dim }} />
      </Surface>
      {/* 方式：黑胶囊压在卡顶 */}
      {tagIn > 0 && (() => {
        const w = textWidth(way.title, tagSize) + tagSize * 1.4;
        return <Pill box={{ x: b.x + CW / 2 - w / 2, y: b.y - tagH / 2, w, h: tagH }} style={{ clipPath: `inset(0 ${50 * (1 - tagIn)}% 0 ${50 * (1 - tagIn)}% round ${tagH / 2}px)`, opacity: mix(1, 0.55, dim) }}>
          <span style={{ ...textBase(tagSize, 900), color: '#fff' }}>{way.title}</span>
        </Pill>;
      })()}
      {/* 说明小字：卡片下方 */}
      <div style={{ position: 'absolute', left: b.x - 60, width: CW + 120, top: b.y + CH + 24, textAlign: 'center', ...textBase(noteSize, 500),
        color: S.muted, opacity: tagIn * mix(1, 0.6, dim) }}>{way.note}</div>
    </>;
  };

  // 线：源头 → 副本顶边（胶囊上沿）
  const ly = L.y - tagH / 2, ry = R.y - tagH / 2;
  const lx = L.x + CW / 2, rx = R.x + CW / 2;
  const gap = 0.07 * cut;    // 断口
  const pulse = pt(sx, sy, rx, ry, flow);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {out > 0.02 && <>
          {/* 右：一直连着 */}
          <path d={pathOf(sx, sy, rx, ry, 0, 1)} fill="none" stroke={S.ink} strokeWidth={LINE} strokeLinecap="round" />
          {/* 左：断开 —— 从中间裂开，两头缩回变淡 */}
          {cut <= 0
            ? <path d={pathOf(sx, sy, lx, ly, 0, 1)} fill="none" stroke={S.ink} strokeWidth={LINE} strokeLinecap="round" />
            : <g opacity={mix(1, 0.85, cut)}>
              <path d={pathOf(sx, sy, lx, ly, 0, 0.5 - gap - 0.07 * cut)} fill="none" stroke={cut > 0.5 ? S.faint : S.ink} strokeWidth={LINE} strokeLinecap="round" />
              <path d={pathOf(sx, sy, lx, ly, 0.5 + gap + 0.07 * cut, 1)} fill="none" stroke={cut > 0.5 ? S.faint : S.ink} strokeWidth={LINE} strokeLinecap="round" />
            </g>}
        </>}
      </svg>

      {/* 副本（在源头下层，从它身后滑出） */}
      <Copy b={L} way={c.zip} isClone={false} />
      <Copy b={R} way={c.clone} isClone />

      {/* 作者的项目：黑色版本牌 */}
      <div style={{ position: 'absolute', left: SRC.x, top: SRC.y, width: SRC.w, height: SRC.h, transform: `scale(${mix(0.6, 1, srcIn)})`, opacity: clamp(t / 0.12), zIndex: 5 }}>
        <Surface box={{ x: 0, y: 0, w: SRC.w, h: SRC.h }} dark shadow={S.capsuleShadow}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 30, textAlign: 'center', ...textBase(nameSize, 500), color: '#fff', opacity: 0.72 }}>{nameLine}</div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 30 + nameSize * 1.3 + 4, display: 'flex', justifyContent: 'center' }}>
            <Roll from={v1} to={v2} v={srcRoll} size={srcNum} w={SRC.w} color="#fff" toColor={accentOn(true)} />
          </div>
        </Surface>
      </div>

      {/* 更新：一颗新版本小胶囊沿右边的线流下去 */}
      {flow > 0 && flow < 1 && (() => {
        const w = textWidth(v2, 40) + 44, h = 64;
        return <Pill box={{ x: pulse.x - w / 2, y: pulse.y - h / 2, w, h }} shadow="0 8px 16px #0004" style={{ zIndex: 6 }}>
          <span style={{ ...textBase(40, 900), color: accentOn(true) }}>{v2}</span>
        </Pill>;
      })()}
    </Handoff>
    
    
    
    
    
  </Frame>;
}
