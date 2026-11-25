// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T02f-BlurList.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：虚化界面上点出几种方式（正版 T02f，升级自 X006）：真实界面/录屏先清晰给 0.25s，再黑蒙＋失焦＋轻放大退后；
// 前景紫色序号「1、2、3、」先就位，白色标签逐行按组（4–6 组）点亮。项数 2–5，字号按行数与最长标签自适应。
// 与近名件区别：库内 A 类 YangBlurListFocus 是纯舞台上文字列表自身逐行去模糊＋黄铜边标；
// 本件是「真实界面虚化作背景＋序号标签在虚化面上点亮」，载体与机制不同，不是重复集成。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/cueAt/textWidth 与 Frame/Handoff/Media 已内嵌移植，逻辑与原版一致；
// background 走 props（宿主 public 路径），原包默认的原版截图已置空——空串时 Media 渲染中性骨架占位。
// 舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  radius: 24, capsuleShadow: '30px 22px 25px #0005', shadow: '0 16px 25px 0 rgba(0,0,0,0.1333)', textShadowDark: '8px 9px 5px #000',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, v: number) => a + (b - a) * v;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const q = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * (3 - 2 * v); };
const cueAt = (cues: readonly number[] | undefined, i: number, fb: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fb;
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
const accentOn = (dark: boolean) => (dark ? '#D6BEFF' : '#8554E8');
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900): React.CSSProperties => ({
  fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
type Box = { x: number; y: number; w: number; h: number };
function Frame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const { width } = useVideoConfig();
  return <AbsoluteFill style={{
    background: dark ? S.dark : '#fff', overflow: 'hidden', fontFamily: FONT,
    fontWeight: 500, fontSynthesis: 'none', color: dark ? '#fff' : S.ink,
  }}>
    <div style={{ position: 'absolute', width: 1920, height: 1080, transform: `scale(${width / 1920})`, transformOrigin: '0 0', overflow: 'hidden' }}>
      {children}
    </div>
  </AbsoluteFill>;
}
export type YangEnter = 'cut' | 'fade' | 'rise' | 'grow';
export type YangExit = 'none' | 'recede' | 'fade' | 'cut' | 'slide-left' | 'slide-up';
export type YangHandoffProps = { enter?: YangEnter; exit?: YangExit; exitAt?: number };
function Handoff({ enter = 'cut', exit = 'none', enterAt = 0, enterDur = 0.45, exitAt, exitDur = 0.5, children }: {
  enter?: YangEnter; exit?: YangExit; enterAt?: number; enterDur?: number; exitAt?: number; exitDur?: number; children: React.ReactNode;
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
const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
function Media({ src, start = 0, box, radius = 0, style }: { src?: string; start?: number; box: Box; radius?: number; style?: React.CSSProperties }) {
  const { fps } = useVideoConfig();
  if (!src) return <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: radius, background: 'linear-gradient(135deg,#3a3a40,#26262b)', overflow: 'hidden', ...style }}>
    <div style={{ position: 'absolute', inset: Math.max(10, Math.min(18, box.h * 0.08)), border: '3px dashed #55555e', borderRadius: Math.max(8, radius - 6) }} />
  </div>;
  const common: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: radius, overflow: 'hidden', background: '#fff', ...style }}>
    {IMG_EXT.test(src)
      ? <Img src={staticFile(src)} style={common} />
      : <OffthreadVideo muted src={staticFile(src)} startFrom={Math.round(start * fps)} style={common} />}
  </div>;
}

export type YangBlurListProps = YangHandoffProps & {
  background: string;   // 真实界面截图/录屏（宿主 public 相对路径）；空串 = 中性骨架占位
  items: string[];      // 2–5 种方式
  dim?: number;         // 黑蒙强度，默认 .6；浅色截图可调到 .68 让白字更稳
  cues?: number[];      // [i] = 第 i 行开始点亮（秒）
};

export const yangBlurListDefaults: YangBlurListProps = {
  background: '',
  items: ['文字生成', '图片生成', '参考图生成'],
};

const groupsOf = (n: number) => Math.min(n, n <= 4 ? 4 : 6);

export const YangBlurList: React.FC<Partial<YangBlurListProps>> = (props) => {
  const c = { ...yangBlurListDefaults, ...props };
  const t = useT();
  const items = c.items.slice(0, 5);
  const n = Math.max(1, items.length);

  const recede = q(t, 0.25, 0.95);

  const pitch = Math.min(246, 820 / n);
  const numUnit = textWidth(`${n}、`, 1) + 0.18;
  const labelUnit = Math.max(...items.map((s) => textWidth(s, 1)));
  const size = Math.min(184, pitch * 0.74, 1560 / (numUnit + labelUnit * 0.96));
  const labelSize = size * 0.96;
  const blockW = size * numUnit + labelSize * labelUnit;
  const left = Math.max(150, 960 - blockW / 2 - 20);
  const top0 = 540 - (pitch * (n - 1) + size) / 2 + 10;

  const gap = Math.min(0.8, 2.5 / Math.max(1, n - 1));
  const rowAt = items.map((_, i) => cueAt(c.cues, i, 1.05 + i * gap));

  const shadow = S.textShadowDark;
  return <Frame dark>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, filter: `blur(${16 * recede}px)`, transform: `scale(${1 + 0.06 * recede})`, transformOrigin: '45% 47%' }}>
        <Media src={c.background} box={{ x: 0, y: 0, w: 1920, h: 1080 }} radius={0} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: (c.dim ?? 0.6) * recede }} />

      {items.map((label, i) => {
        const y = top0 + i * pitch;
        const numIn = p(t, 0.4 + i * 0.08, 0.75 + i * 0.08);
        const chars = Array.from(label);
        const g = groupsOf(chars.length);
        return <React.Fragment key={i}>
          <div style={{ ...textBase(size, 900), position: 'absolute', left: left + (1 - numIn) * -24, top: y, lineHeight: 1,
            color: accentOn(true), textShadow: shadow, opacity: numIn }}>{i + 1}、</div>
          <div style={{ ...textBase(labelSize, 900), position: 'absolute', left: left + size * numUnit, top: y + (size - labelSize) * 0.5, lineHeight: 1,
            color: '#fff', textShadow: shadow }}>
            {chars.map((ch, j) => {
              const k = Math.min(g - 1, Math.floor((j / chars.length) * g));
              const at = rowAt[i] + k * 0.085;
              return <span key={j} style={{ opacity: clamp((t - at) / 0.12) }}>{ch}</span>;
            })}
          </div>
        </React.Fragment>;
      })}
    </Handoff>
  </Frame>;
};
