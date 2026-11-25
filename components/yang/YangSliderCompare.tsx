// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T05a-SliderCompare.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：滑杆对比（正版 T05a）：同一主体的前后两张图叠在 1500×843.75 框里，一条竖直分界线从右边缘出发
// （全是「之前」）用 wipe 曲线横扫到左、把「之后」整幅揭开，再回到 rest 停点（默认 0.64）停住并排读；
// 两侧标签只在自己那侧够宽时淡入；顶部可挂一句说明胶囊。前后素材走 props（图片或视频）。
// 与近名件区别：shotcraft 的 YangBeforeAfterSlider 是视线/光标拖动分界线、灰度对彩色的仪表盘 mock；
// 本件是编排好的「全扫揭示＋回停点＋标签/说明」叙事动作、任意同主体素材对，交互与内容模型不同，并行保留。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/wipe/cueAt/textWidth 与 Frame/Handoff/Media 已内嵌移植，逻辑与原版一致；
// 原包默认示例已换中性示例，前后素材走 props、空串时渲染中性占位面（之前=灰调、之后=紫调）。
// 舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  radius: 24, capsuleShadow: '30px 22px 25px #0005', shadow: '0 16px 25px 0 rgba(0,0,0,0.1333)',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, v: number) => a + (b - a) * v;
const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: easeOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const q = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * (3 - 2 * v); };
const wipe = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: Easing.bezier(0.65, 0, 0.2, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const cueAt = (cues: readonly number[] | undefined, i: number, fb: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fb;
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
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
function Media({ src, start = 0, box, radius = 0, style, tone }: { src?: string; start?: number; box: Box; radius?: number; style?: React.CSSProperties; tone?: 'before' | 'after' }) {
  const { fps } = useVideoConfig();
  if (!src) return <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: radius, overflow: 'hidden',
    background: tone === 'after' ? 'linear-gradient(135deg,#cdbcf5,#a582ec)' : 'linear-gradient(135deg,#d8d8dd,#b5b5bc)', ...style }}>
    <div style={{ position: 'absolute', left: box.w * 0.12, top: box.h * 0.16, width: box.w * 0.42, height: box.h * 0.1, borderRadius: 12, background: tone === 'after' ? '#8a63e0' : '#9a9aa2' }} />
    <div style={{ position: 'absolute', left: box.w * 0.12, top: box.h * 0.34, width: box.w * 0.66, height: box.h * 0.34, borderRadius: 16, background: tone === 'after' ? '#b79df0' : '#c2c2c9' }} />
  </div>;
  const common: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: radius, overflow: 'hidden', background: '#fff', ...style }}>
    {IMG_EXT.test(src)
      ? <Img src={staticFile(src)} style={common} />
      : <OffthreadVideo muted src={staticFile(src)} startFrom={Math.round(start * fps)} style={common} />}
  </div>;
}

export type YangSliderCompareProps = YangHandoffProps & {
  before: string;        // 「之前」素材（宿主 public 路径，图片或视频）；空串 = 中性占位
  after: string;         // 「之后」素材；空串 = 中性占位
  beforeLabel?: string;  // 左侧标签，缺省「之前」
  afterLabel?: string;   // 右侧标签，缺省「之后」
  caption?: string;      // 顶部说明胶囊，可空
  rest?: number;         // 横扫后分界线停的位置（0–1，画面宽比例），默认 0.64
  cues?: number[];       // [0]=开始横扫，[1]=回到停点；不传用默认节奏
};

export const yangSliderCompareDefaults: YangSliderCompareProps = {
  before: '',
  after: '',
  beforeLabel: '之前',
  afterLabel: '之后',
  caption: '同一张图，处理前后',
  rest: 0.64,
};

const FRAME_BOX: Box = { x: 210, y: 180, w: 1500, h: 843.75 };

export const YangSliderCompare: React.FC<Partial<YangSliderCompareProps>> = (props) => {
  const c = { ...yangSliderCompareDefaults, ...props };
  const t = useT();
  const rest = clamp(c.rest ?? 0.64, 0.05, 0.95);
  const sweepAt = cueAt(c.cues, 0, 0.9);
  const restAt = cueAt(c.cues, 1, sweepAt + 1.5);
  // 分界线位置（画面宽比例）：1 = 全是之前 → 横扫到 0（全是之后）→ 回到 rest
  const sweep = wipe(t, sweepAt, sweepAt + 1.15);
  const back = q(t, restAt, restAt + 0.8);
  const pos = mix(mix(1, 0, sweep), rest, back);
  const enter = p(t, 0, 0.45);
  const dividerX = FRAME_BOX.x + FRAME_BOX.w * pos;
  const capIn = p(t, 0.25, 0.6);

  const label = (text: string, side: 'left' | 'right', visible: number) => {
    const size = 52;
    const w = textWidth(text, size) + size * 1.5;
    const x = side === 'left' ? FRAME_BOX.x + 36 : FRAME_BOX.x + FRAME_BOX.w - 36 - w;
    return <div style={{
      position: 'absolute', left: x, top: FRAME_BOX.y + 36, width: w, height: size * 1.8, borderRadius: size * 0.9,
      background: 'rgba(25,25,28,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: visible * enter,
    }}>
      <span style={{ ...textBase(size, 900), color: '#fff' }}>{text}</span>
    </div>;
  };

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, opacity: enter, transform: `scale(${mix(0.97, 1, enter)})` }}>
        {/* 之后（底层全幅） */}
        <Media src={c.after} tone="after" box={FRAME_BOX} radius={S.radius} style={{ boxShadow: S.shadow }} />
        {/* 之前（上层，按分界线裁切左半） */}
        <div style={{ position: 'absolute', left: FRAME_BOX.x, top: FRAME_BOX.y, width: FRAME_BOX.w * pos, height: FRAME_BOX.h, overflow: 'hidden', borderRadius: `${S.radius}px 0 0 ${S.radius}px` }}>
          <Media src={c.before} tone="before" box={{ x: 0, y: 0, w: FRAME_BOX.w, h: FRAME_BOX.h }} radius={0} />
        </div>
        {/* 分界线 */}
        <div style={{ position: 'absolute', left: dividerX - 4, top: FRAME_BOX.y - 14, width: 8, height: FRAME_BOX.h + 28, borderRadius: 4, background: '#fff', boxShadow: '0 4px 18px rgba(0,0,0,0.35)' }} />
        <div style={{ position: 'absolute', left: dividerX - 34, top: FRAME_BOX.y + FRAME_BOX.h / 2 - 34, width: 68, height: 68, borderRadius: 34, background: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...textBase(34, 900), color: S.ink }}>‹›</span>
        </div>
        {c.beforeLabel !== '' && label(c.beforeLabel ?? '之前', 'left', clamp(pos / 0.3))}
        {c.afterLabel !== '' && label(c.afterLabel ?? '之后', 'right', clamp((1 - pos) / 0.3))}
      </div>
      {c.caption && <div style={{
        position: 'absolute', left: 960 - (textWidth(c.caption, 56) + 56 * 1.7) / 2, top: 62 + (1 - capIn) * 20,
        width: textWidth(c.caption, 56) + 56 * 1.7, height: 56 * 1.8, borderRadius: 56 * 0.9,
        background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: capIn,
      }}>
        <span style={{ ...textBase(56, 400), color: '#fff' }}>{c.caption}</span>
      </div>}
    </Handoff>
  </Frame>;
};
