// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T18c-ProductPage.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 与 YangReadmeScroll 的区别：那件是单段精读（滚到一节、其余退后、停住读完）；本件是一条长页面
// 连续滚动、沿途在 1–3 个卖点处各停一次（推近＋该区域提起＋黑标签落下），停完放开继续滚。
// 用途：产品长页巡览（正版 T18c）：长页面图匀速滚动，讲到一个卖点就停住——相机推近、其余页面
// 白蒙失焦、卖点区域微微提起，旁边落下黑色说明胶囊；讲完放开，页面继续往下滚到下一个卖点。
// 页面坐标是源图像素，换页面只改 props。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/quintic/cueAt/textWidth 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；
// page 走 props（宿主 public 路径），原包默认的页面截图已置空——空串时渲染同像素几何的
// 中性 CSS 长页骨架。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
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
const quintic = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * v * (v * (v * 6 - 15) + 10); };
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

export type YangSellPoint = { region: Box; label: string };
export type YangProductPageProps = YangHandoffProps & {
  page: string;                          // 长页面图（宿主 public 路径）；空串 = 中性长页骨架
  pageWidth: number;
  pageHeight: number;
  points: YangSellPoint[];               // 1–3 个卖点（源图像素）
  scrollEnd?: number;                    // 滚动总时长（秒）
  cues?: number[];                       // [i]=停在第 i 个卖点；[n]=最后一个卖点放开
};

export const yangProductPageDefaults: YangProductPageProps = {
  page: '',
  pageWidth: 1600,
  pageHeight: 4200,
  points: [
    { region: { x: 120, y: 700, w: 1360, h: 420 }, label: '先看这一屏' },
    { region: { x: 120, y: 1900, w: 1360, h: 420 }, label: '核心卖点在这里' },
    { region: { x: 120, y: 3100, w: 1360, h: 420 }, label: '最后一屏收尾' },
  ],
  scrollEnd: 7.5,
};

const WIN = { x: 210, y: 60, w: 1500, h: 960 };

// 中性长页骨架：与 image 同像素几何的 CSS 页面（区块流）
function PageMock({ W, H, left, top, filter }: { W: number; H: number; left: number; top: number; filter?: string }) {
  const blocks: React.ReactNode[] = [];
  const rows = Math.floor(H / 300);
  for (let i = 0; i < rows; i++) {
    const y = 90 + i * 300;
    blocks.push(<React.Fragment key={i}>
      <div style={{ position: 'absolute', left: 120, top: y, width: W * 0.34, height: 44, borderRadius: 8, background: '#9d9da6' }} />
      <div style={{ position: 'absolute', left: 120, top: y + 70, width: W * 0.8, height: 26, borderRadius: 6, background: '#c9c9cf' }} />
      <div style={{ position: 'absolute', left: 120, top: y + 112, width: W * 0.72, height: 26, borderRadius: 6, background: '#c9c9cf' }} />
      <div style={{ position: 'absolute', left: 120, top: y + 168, width: W * 0.85, height: 110, borderRadius: 14, background: i % 2 ? '#dcdce1' : '#e2dcf5' }} />
    </React.Fragment>);
  }
  return <div style={{ position: 'absolute', left, top, width: W, height: H, background: '#f7f7f9', filter }}>{blocks}</div>;
}

export const YangProductPage: React.FC<Partial<YangProductPageProps>> = (props) => {
  const c = { ...yangProductPageDefaults, ...props };
  const points = (c.points.length ? c.points : yangProductPageDefaults.points).slice(0, 3);
  const n = points.length;
  const t = useT();
  const { durationInFrames, fps } = useVideoConfig();
  const dur = durationInFrames / fps;

  const k = WIN.w / c.pageWidth;
  const dispH = c.pageHeight * k;
  const maxScroll = Math.max(0, dispH - WIN.h);
  const endT = c.scrollEnd ?? Math.min(dur - 0.6, 7.5);

  // 停靠时间表：把滚动切成「滚—停—滚—停」段
  const stopY = points.map((pt) => clamp((pt.region.y + pt.region.h / 2) * k - WIN.h / 2, 0, maxScroll));
  const stopAt = points.map((_, i) => cueAt(c.cues, i, 1.2 + i * ((endT - 1.2) / Math.max(1, n))));
  const HOLD = 1.15;
  // 分段滚动：scrollY(t) 由关键帧插值（停靠点之间匀速、停靠处平台）
  const keys: { tt: number; y: number }[] = [{ tt: 0, y: 0 }];
  points.forEach((_, i) => {
    keys.push({ tt: stopAt[i], y: stopY[i] });
    keys.push({ tt: Math.min(stopAt[i] + HOLD, endT), y: stopY[i] });
  });
  keys.push({ tt: endT, y: maxScroll });
  const scrollY = (() => {
    if (t <= 0) return 0;
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i].tt) {
        const a = keys[i - 1], b = keys[i];
        if (b.tt - a.tt <= 0.001) return b.y;
        const v = q(t, a.tt, b.tt);
        return mix(a.y, b.y, v);
      }
    }
    return maxScroll;
  })();

  // 当前停靠的卖点（在停留窗内）
  let active = -1;
  points.forEach((_, i) => { if (t >= stopAt[i] - 0.3 && t <= stopAt[i] + HOLD + 0.25) active = i; });
  const focus = active >= 0 ? quintic(t, stopAt[active] - 0.3, stopAt[active] + 0.15) * (1 - quintic(t, stopAt[active] + HOLD, stopAt[active] + HOLD + 0.4)) : 0;
  const zoom = 1 + 0.13 * focus;
  const enter = p(t, 0, 0.4);

  const renderPage = (left: number, top: number, filter?: string) =>
    c.page
      ? <Img src={staticFile(c.page)} style={{ position: 'absolute', left, top, width: WIN.w, height: dispH, filter }} />
      : <PageMock W={WIN.w} H={dispH} left={left} top={top} filter={filter} />;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: S.radius, overflow: 'hidden',
        boxShadow: S.shadow, background: '#fff', opacity: enter,
      }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '50% 50%' }}>
          {renderPage(0, -scrollY, focus > 0.01 ? `blur(${10 * focus}px)` : undefined)}
          <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.68 * focus }} />
          {active >= 0 && focus > 0.01 && (() => {
            const r = points[active].region;
            const rx = r.x * k, ry = r.y * k - scrollY, rw = r.w * k, rh = r.h * k;
            return <div style={{
              position: 'absolute', left: rx - 10, top: ry - 10, width: rw + 20, height: rh + 20, borderRadius: 18, overflow: 'hidden',
              boxShadow: '0 18px 40px rgba(0,0,0,0.18)', opacity: focus, background: '#fff',
              transform: `translateY(${-8 * focus}px)`,
            }}>
              {renderPage(-(rx - 10), -(ry - 10))}
            </div>;
          })()}
        </div>
      </div>
      {active >= 0 && focus > 0.01 && (() => {
        const label = points[active].label;
        const size = 50;
        const w = textWidth(label, size) + 90;
        const r = points[active].region;
        const ry = WIN.y + (r.y * k - scrollY) * zoom + WIN.h * (1 - zoom) / 2;
        const y = clamp(ry - 118, 84, 880);
        const inn = p(t, stopAt[active] + 0.05, stopAt[active] + 0.4);
        return <div style={{
          position: 'absolute', left: clamp(WIN.x + r.x * k * zoom - 6, 60, 1860 - w), top: y, width: w, height: size * 1.72, borderRadius: size,
          background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: focus * inn, transform: `translateY(${(1 - inn) * 14}px)`, zIndex: 40,
        }}>
          <span style={{ ...textBase(size, 700), color: '#fff' }}>{label}</span>
        </div>;
      })()}
    </Handoff>
  </Frame>;
};
