// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T21d-SaveChecklist.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：可截图清单（正版 T21d）——本期要点 → 逐条打勾，整页停住方便截图。
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

export type YangSaveChecklistProps = YangHandoffProps & {
  title: string;         // 清单标题（纸面第一行）
  items: string[];       // 3–7 条
  highlights?: string[]; // 每条里打勾后染紫的词，可留空
  hint: string;          // 底部小字，如“截图保存”
  cues?: number[];       // [i]=第 i 条打勾；[items.length]=整页定格
};

export const yangSaveChecklistDefaults: YangSaveChecklistProps = {
  title: '用 GitHub 上的开源软件',
  items: ['找项目', '下载对的版本', '授权 GitHub CLI', '一句话跑起来', '传之前备好三个文件'],
  highlights: ['', '对的版本', '', '一句话', '三个文件'],
  hint: '截图保存',
};

const PAD_X = 84, PAD_TOP = 70, PAD_BOTTOM = 66;

export function YangSaveChecklist(props: Partial<YangSaveChecklistProps>) {
  const c = { ...yangSaveChecklistDefaults, ...props };
  const t = useT();
  const items = c.items.slice(0, 7);
  const n = Math.max(1, items.length);

  // —— 终态版式：字号克制，纸面贴合内容宽度、整体在字幕区上方 ——
  // 条目少时整体放大一档，避免小纸片 + 大块空白；条目多时行距压缩，正文不小于约 34px
  const boost = n <= 3 ? 1.3 : n === 4 ? 1.12 : 1;
  const rowH = Math.min(98 * boost, 520 / n);
  const maxUnits = Math.max(1, ...items.map((s) => textWidth(s, 1)));
  const iSize = Math.min(54 * boost, rowH * 0.56, 900 / maxUnits);
  const box = Math.round(Math.max(44, iSize * 1.12));       // 勾选圈直径
  const gap = iSize * 0.62;
  const tSize = Math.min(68 * boost, (1100 - PAD_X * 2) / Math.max(1, textWidth(c.title, 1)));
  const titleGap = 40;
  const itemsW = box + gap + maxUnits * iSize;
  const paperW = Math.max(760, Math.max(itemsW, textWidth(c.title, tSize)) + PAD_X * 2 + iSize);
  const paperH = PAD_TOP + tSize * 1.16 + titleGap + n * rowH + PAD_BOTTOM;
  const hSize = 36;
  const blockH = paperH + 30 + hSize * 1.16;
  const paperX = 960 - paperW / 2;
  // 纸 + 小字整体中心约在 y=480；纸面右缘碰到角标列时，顶边让到角标下方
  const paperY = Math.max(paperX + paperW > 1530 ? 140 : 60, 480 - blockH / 2);
  const listX = PAD_X, listY = PAD_TOP + tSize * 1.16 + titleGap;

  // —— 时间 ——
  const enter = p(t, 0, 0.55);
  const at = items.map((_, i) => cueAt(c.cues, i, 0.95 + i * (n > 5 ? 0.5 : 0.62)));
  const snapAt = cueAt(c.cues, n, at[n - 1] + 0.62);
  const flash = clamp((t - snapAt) / 0.06) * (1 - q(t, snapAt + 0.06, snapAt + 0.42));
  const press = Math.sin(clamp((t - snapAt) / 0.3) * Math.PI) * 0.014;
  const hintIn = p(t, snapAt + 0.18, snapAt + 0.6);

  const ink = (k: number) => `rgb(${mix(0xa3, 0x19, k)}, ${mix(0xa3, 0x19, k)}, ${mix(0xab, 0x1c, k)})`;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <Surface box={{ x: paperX, y: paperY + (1 - enter) * 60, w: paperW, h: paperH }}
        style={{ opacity: clamp(enter * 1.6), transform: `scale(${1 - press})` }}>
        {/* 标题 */}
        <div style={{ ...textBase(tSize, 900), position: 'absolute', left: PAD_X, top: PAD_TOP, color: S.ink }}>{c.title}</div>

        {items.map((s, i) => {
          const rowIn = p(t, 0.12 + i * 0.06, 0.12 + i * 0.06 + 0.42);           // 整页铺开：一行行摊开
          const done = springAt(t, at[i], 0.5);                                   // 黑圆长出（一次回弹）
          const fill = clamp((t - at[i]) / 0.08);
          const stroke = p(t, at[i] + 0.08, at[i] + 0.34);                        // 白勾一笔画出
          const lit = p(t, at[i], at[i] + 0.3);
          const hl = c.highlights?.[i] && s.includes(c.highlights[i]) ? c.highlights[i] : '';
          const [pre, post = ''] = hl ? s.split(hl) : [s];
          const y = listY + i * rowH;
          return <div key={i} style={{
            position: 'absolute', left: listX, top: y, height: rowH, display: 'flex', alignItems: 'center', gap,
            opacity: rowIn, transform: `translateY(${(1 - rowIn) * 18}px)`,
          }}>
            <div style={{ position: 'relative', width: box, height: box, flex: 'none' }}>
              {/* 空圈 */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `4px solid ${S.faint}`, boxSizing: 'border-box', opacity: 1 - fill }} />
              {/* 黑圆 + 白勾 */}
              {fill > 0 && <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%', background: S.dark, opacity: fill,
                transform: `scale(${mix(0.4, 1, done)})`,
              }}>
                <svg width={box} height={box} viewBox="0 0 24 24" style={{ position: 'absolute', inset: 0 }}>
                  <path d="M6.6 12.4 L10.4 16 L17.6 8.4" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="17" strokeDashoffset={17 * (1 - stroke)} />
                </svg>
              </div>}
            </div>
            <span style={{ ...textBase(iSize, 500), color: ink(lit) }}>
              {pre}{hl && <span style={{ color: lit > 0.5 ? accentOn(false) : ink(lit) }}>{hl}</span>}{post}
            </span>
          </div>;
        })}

        {/* 定格那一下：纸面白闪 */}
        {flash > 0 && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.85 * flash }} />}
      </Surface>

      {/* 底部小字 */}
      {hintIn > 0 && <div style={{
        position: 'absolute', left: 0, right: 0, top: paperY + paperH + 30, textAlign: 'center',
        opacity: hintIn, transform: `translateY(${(1 - hintIn) * 12}px)`,
      }}>
        <span style={{ ...textBase(hSize, 500), color: S.muted }}>{c.hint}</span>
      </div>}
    </Handoff>
    
    
  </Frame>;
}
