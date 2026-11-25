// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T12b-StepNumber.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：步骤编号（正版 T12b）：中央一枚黑方牌，上一数字往上滚走、新数字滚入；牌往左移，
// 步骤名胶囊从牌身后抽出落位；名字可断两行，高亮词变紫。讲第几个分几步的转场牌。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 springAt/textWidth 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；
// 默认文案已换中性示例。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

const S = {
  ink: '#19191c', dark: '#19191c', faint: '#a3a3ab', accent: '#8554E8', accentDark: '#D6BEFF',
  capsuleShadow: '30px 22px 25px #0005',
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, v: number) => a + (b - a) * v;
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
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
export type YangStepNumberProps = YangHandoffProps & {
  number: number;            // 讲到第几步（牌面数字）
  name: React.ReactNode;     // 步骤名，可直接传带样式的 JSX 段落（断两行用 <br/>）
};

export const yangStepNumberDefaults: YangStepNumberProps = {
  number: 2,
  name: <>先把<b style={{ color: S.accent }}>需求</b>说清楚</>,
};

const TILE = 210;
const NAME_W = 1180;

export const YangStepNumber: React.FC<Partial<YangStepNumberProps>> = (props) => {
  const c = { ...yangStepNumberDefaults, ...props };
  const t = useT();
  const nameText = typeof c.name === 'string' ? c.name : '';
  let nameSize = 92;
  if (nameText) {
    const longest = Math.max(...nameText.split('\n').map((s) => textWidth(s, nameSize)));
    while (nameSize > 52 && longest > NAME_W - 170) nameSize -= 2;
  }
  const nameH = nameSize * 1.72;
  const roll = springAt(t, 0.12, 1.05);
  const shift = springAt(t, 0.62, 0.95);
  const cx = mix(960, 960 - (NAME_W + 44) / 2, shift);
  const tileX = cx - TILE / 2;
  const nameX = cx + TILE / 2 + 44;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: nameX - 60, top: 540 - nameH / 2, width: NAME_W + 60, height: nameH, borderRadius: nameH / 2,
        background: '#fff', boxShadow: S.capsuleShadow, opacity: clamp(shift * 2.2), overflow: 'hidden',
        transform: `translateX(${mix(-(NAME_W + 30), 0, shift)}px)`, transformOrigin: '0 50%',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, width: NAME_W + 60, height: nameH, display: 'flex', alignItems: 'center',
          paddingLeft: 96, transform: `translateX(${mix(NAME_W + 30, 0, shift)}px)`,
        }}>
          {typeof c.name === 'string'
            ? <span style={{ ...textBase(nameSize, 900), whiteSpace: 'pre-line', lineHeight: 1.16 }}>{c.name}</span>
            : <span style={{ ...textBase(nameSize, 900), lineHeight: 1.16 }}>{c.name}</span>}
        </div>
      </div>
      <div style={{
        position: 'absolute', left: tileX, top: 540 - TILE / 2, width: TILE, height: TILE, borderRadius: 40,
        background: S.dark, boxShadow: S.capsuleShadow, overflow: 'hidden', zIndex: 5,
      }}>
        {[c.number - 1, c.number].map((num, i) => {
          if (num < 1) return null;
          const isNew = i === 1;
          const dy = isNew ? mix(TILE * 0.7, 0, roll) : mix(0, -TILE * 0.7, roll);
          const op = isNew ? clamp(roll * 1.6) : 1 - clamp(roll * 1.6);
          return <div key={i} style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `translateY(${dy}px)`, opacity: op,
          }}>
            <span style={{ ...textBase(128, 900), color: isNew ? '#fff' : S.faint, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{num}</span>
          </div>;
        })}
      </div>
    </Handoff>
  </Frame>;
};
