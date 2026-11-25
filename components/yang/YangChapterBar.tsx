// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T12e-ChapterBar.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：章名白条（正版 T12e）：暗场上先只有一行大白标题；念到章名，一条白条从标题底部向上长开
// （条里是反黑的章名），随即整条上移、收窄，落到标题上方成为正式章名签。约两秒的转场件。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 quintic/textWidth 与 Frame(dark)/Handoff 已内嵌移植，逻辑与原版一致；
// 默认文案已换中性示例。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放，暗场。
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  capsuleShadow: '30px 22px 25px #0005',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, v: number) => a + (b - a) * v;
const quintic = (t: number, a: number, b: number) => { const v = clamp((t - a) / (b - a)); return v * v * v * (v * (v * 6 - 15) + 10); };
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900): React.CSSProperties => ({
  fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
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

export type YangChapterBarProps = YangHandoffProps & {
  title: string;      // 大标题
  label: string;      // 章名（白条里的字，后成章名签）
  cues?: number[];    // [0]=白条长开；[1]=上移收成章名签
};

export const yangChapterBarDefaults: YangChapterBarProps = {
  title: '先看它解决了什么问题',
  label: '第一章',
};

const TITLE_SIZE = 120;

export const YangChapterBar: React.FC<Partial<YangChapterBarProps>> = (props) => {
  const c = { ...yangChapterBarDefaults, ...props };
  const t = useT();
  const openAt = c.cues?.[0] ?? 0.45;
  const dockAt = c.cues?.[1] ?? 1.25;

  const titleW = textWidth(c.title, TITLE_SIZE);
  const titleX = 960 - titleW / 2;
  const titleY = 470;
  const open = quintic(t, openAt, openAt + 0.5);
  const dock = quintic(t, dockAt, dockAt + 0.6);
  const BAR_H = 108;
  const fullW = titleW + 30;
  const tagSize = 62;
  const tagW = textWidth(c.label, tagSize) + tagSize * 1.5;
  const barW = mix(fullW, tagW, dock);
  const barY = mix(titleY + TITLE_SIZE * 1.16 - BAR_H, titleY - BAR_H - 34, dock);
  const barX = mix(titleX - 15, titleX - 6, dock);

  return <Frame dark>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', left: titleX, top: titleY, ...textBase(TITLE_SIZE, 900), color: '#fff' }}>{c.title}</div>
      {open > 0 && <div style={{
        position: 'absolute', left: barX, top: barY + BAR_H * (1 - open), width: barW, height: BAR_H * open,
        background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: -BAR_H * (1 - open), width: barW, height: BAR_H,
          display: 'flex', alignItems: 'center', justifyContent: dock > 0.5 ? 'center' : 'flex-start',
          paddingLeft: dock > 0.5 ? 0 : 28,
        }}>
          <span style={{ ...textBase(mix(TITLE_SIZE * 0.62, tagSize, dock), 900), color: S.ink }}>{c.label}</span>
        </div>
      </div>}
    </Handoff>
  </Frame>;
};
