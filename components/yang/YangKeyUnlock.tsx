// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T04f-KeyUnlock.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：一把钥匙解锁几件事（正版 T04f）——一把钥匙插入 → 几项能力依次从锁定变成可用。
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

export type YangAbility = { label: string; sub?: string };
export type YangKeyUnlockProps = YangHandoffProps & {
  keyName: string;          // 钥匙上的名字
  logo?: string;            // public/ 下的真实 Logo（可省，省了就只有文字）
  abilities: YangAbility[];     // 2–4 项能力
  cues?: number[];          // [0]=钥匙开始转动 [1+i]=第 i 项解锁
};

export const yangKeyUnlockDefaults: YangKeyUnlockProps = {
  keyName: 'GitHub CLI',
  abilities: [
    { label: '下载', sub: '把别人的项目拉下来' },
    { label: '上传', sub: '把改动推上去' },
    { label: '建仓库', sub: '新建一个项目文件夹' },
  ],
};

const CORE = { x: 760, y: 540, r: 98 };
const CARD_X = 1010, CARD_W = 800, GAP = 34;
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, v: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((x, i) => Math.round(mix(x, B[i], v))).join(',')})`;
};

function Padlock({ size, open, body, shackle }: { size: number; open: number; body: string; shackle: string }) {
  // 锁：身体 + 锁梁（SVG 只用于锁）；打开 = 锁梁抬起并绕右脚转开
  return <svg width={size} height={size} viewBox="0 0 48 48">
    <g style={{ transform: `translate(${open * 3}px, ${-open * 7}px) rotate(${-open * 38}deg)`, transformOrigin: '34px 22px' }}>
      <path d="M14 22 V15 a10 10 0 0 1 20 0 V22" fill="none" stroke={shackle} strokeWidth={5} strokeLinecap="round" />
    </g>
    <rect x="7" y="21" width="34" height="23" rx="6" fill={body} />
    <circle cx="24" cy="31.5" r="3.2" fill={shackle === '#fff' ? S.dark : '#fff'} opacity={0.0} />
  </svg>;
}

export function YangKeyUnlock(props: Partial<YangKeyUnlockProps>) {
  const c = { ...yangKeyUnlockDefaults, ...props };
  const t = useT();
  const items = c.abilities.slice(0, 4);
  const n = items.length;
  const enter = p(t, 0, 0.55);
  const turnAt = cueAt(c.cues, 0, 1.7);
  const unlockAt = items.map((_, i) => cueAt(c.cues, 1 + i, turnAt + 0.55 + i * 0.36));

  // ---------- 钥匙 ----------
  const nameSize = Math.min(58, 380 / Math.max(1, textWidth(c.keyName, 1) * 1.1));
  const logoW = c.logo ? 82 : 0;
  const headW = textWidth(c.keyName, nameSize) * 1.1 + nameSize * 1.8 + (c.logo ? logoW + 16 : 0);
  const headH = 120, shaftW = 190, shaftH = 30;
  const keyLen = headW + shaftW;
  const slide = p(t, 0.25, 1.25);
  const slideX = mix(-keyLen + 120, 0, slide);
  const tip = { x: CORE.x, y: CORE.y };
  const keyLeft = tip.x - keyLen + slideX + 8;   // 尖端稍微插进锁芯
  const turn = q(t, turnAt, turnAt + 0.5);
  const tilt = -7 * turn;                         // 钥匙随锁芯微微转一下

  // ---------- 卡 ----------
  const CH = Math.min(200, (820 - (n - 1) * GAP) / n);
  const y0 = (1080 - (n * CH + (n - 1) * GAP)) / 2;
  const cy = (i: number) => y0 + i * (CH + GAP) + CH / 2;
  const cardIn = (i: number) => p(t, 0.12 + i * 0.1, 0.7 + i * 0.1);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 连线：锁芯 → 各卡 */}
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: enter }}>
        {items.map((_, i) => {
          const d = p(t, unlockAt[i] - 0.35, unlockAt[i] + 0.02);
          const done = q(t, unlockAt[i], unlockAt[i] + 0.4);
          return <path key={i} d={`M ${CORE.x + CORE.r - 4} ${CORE.y} H ${CORE.x + CORE.r + 70} V ${cy(i)} H ${CARD_X - 6}`} pathLength={1} fill="none"
            stroke={mixHex('#a3a3ab', '#19191c', done)} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - d} opacity={d > 0 ? 1 : 0} />;
        })}
      </svg>

      {/* 锁芯 */}
      <div style={{ position: 'absolute', left: CORE.x - CORE.r, top: CORE.y - CORE.r + (1 - enter) * 30, width: CORE.r * 2, height: CORE.r * 2, borderRadius: CORE.r, background: '#fff', boxShadow: S.shadow, opacity: enter }}>
        <div style={{ position: 'absolute', inset: 14, borderRadius: CORE.r, background: '#f2f2f5', transform: `rotate(${turn * 90}deg)` }}>
          <div style={{ position: 'absolute', left: '50%', top: 8, width: 12, height: 34, marginLeft: -6, borderRadius: 6, background: accentOn(false) }} />
        </div>
        <div style={{ position: 'absolute', left: CORE.r - 24, top: CORE.r - 24, width: 48, height: 48, borderRadius: 24, background: S.dark }} />
      </div>

      {/* 钥匙：头（胶囊 + 名字）+ 杆 + 齿 */}
      <div style={{
        position: 'absolute', left: keyLeft, top: tip.y - headH / 2, width: keyLen, height: headH, opacity: enter * clamp(slide * 5),
        transformOrigin: `${keyLen}px ${headH / 2}px`, transform: `rotate(${tilt}deg)`, zIndex: 20,
      }}>
        <div style={{ position: 'absolute', left: headW - 12, top: headH / 2 - shaftH / 2, width: shaftW + 12, height: shaftH, borderRadius: shaftH / 2, background: S.dark, boxShadow: S.capsuleShadow }} />
        {[shaftW - 70, shaftW - 130].map((x, i) => <div key={i} style={{ position: 'absolute', left: headW + x, top: headH / 2 + shaftH / 2 - 4, width: 28, height: 42 - i * 6, borderRadius: '0 0 8px 8px', background: S.dark }} />)}
        <div style={{ position: 'absolute', left: 0, top: 0, width: headW, height: headH, borderRadius: headH / 2, background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          {c.logo && <ImgFill src={c.logo} style={{ width: logoW, height: logoW, borderRadius: logoW / 2, background: '#fff', objectFit: 'contain' }} />}
          <span style={{ ...textBase(nameSize, 400, S.display), color: '#fff' }}>{c.keyName}</span>
        </div>
      </div>

      {/* 能力卡 */}
      {items.map((it, i) => {
        const u = q(t, unlockAt[i], unlockAt[i] + 0.4);
        const uT = clamp((u - 0.25) * 2.4);   // 字和锁比底色先翻，避免中间态对比过低
        const pop = springAt(t, unlockAt[i], 0.6);
        const open = springAt(t, unlockAt[i] + 0.05, 0.55);
        const lSize = Math.min(78, (CARD_W - 230) / Math.max(1, textWidth(it.label, 1) * 1.05));
        const sSize = it.sub ? Math.min(36, (CARD_W - 230) / Math.max(1, textWidth(it.sub, 1) * 1.05)) : 0;
        const ci = cardIn(i);
        const sc = 1 + 0.035 * Math.sin(Math.PI * clamp(pop > 0 ? (t - unlockAt[i]) / 0.5 : 0));
        return <div key={i} style={{
          position: 'absolute', left: CARD_X, top: cy(i) - CH / 2 + (1 - ci) * 40, width: CARD_W, height: CH, borderRadius: S.radius,
          background: mixHex('#ececef', '#19191c', u), boxShadow: u > 0.5 ? S.capsuleShadow : '0 8px 14px 0 rgba(0,0,0,0.07)', opacity: ci, transform: `scale(${sc})`,
        }}>
          <div style={{ position: 'absolute', left: 44, top: CH / 2 - 36 }}>
            <Padlock size={72} open={open} body={mixHex('#a3a3ab', '#D6BEFF', uT)} shackle={mixHex('#a3a3ab', '#D6BEFF', uT)} />
          </div>
          <div style={{ position: 'absolute', left: 156, top: it.sub ? CH / 2 - lSize * 0.95 : CH / 2 - lSize * 0.58, ...textBase(lSize, 900), color: mixHex('#a3a3ab', '#ffffff', uT) }}>{it.label}</div>
          {it.sub && <div style={{ position: 'absolute', left: 156, top: CH / 2 + lSize * 0.3, ...textBase(sSize, 500), color: mixHex('#a3a3ab', '#c9c9cf', uT) }}>{it.sub}</div>}
        </div>;
      })}
    </Handoff>
    
    
    
    
  </Frame>;
}
