// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T01b-TermDefine.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-42-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第一组」集成）。
// 用途：概念定义（正版 T01b）：术语先以黑色大卡单独立住 → 黑卡上移收窄，一张白色释义卡从黑卡下沿抽出展开，
// 逐行读出人话定义，最后关键处点紫。
// 与近名件区别：YangConditionCapsule（正版 T01e）是胶囊逐字补条件；YangDarkWindowType（正版 T01g）是黑窗打字；
// 本件是「术语卡 → 下方抽出释义卡」的上下两层关系，不是重复集成。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；
// Brand 角标未集成；kit 的 p/q/cueAt/textWidth 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；
// 原包默认示例（原版第 112 期内容）已换中性示例。舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
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
const cueAt = (cues: readonly number[] | undefined, i: number, fb: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fb;
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

export type YangTermDefineProps = YangHandoffProps & {
  term: string;         // 术语
  alias: string;        // 术语的全称/译名（可空）
  definition: string;   // 一句人话定义
  highlight: string;    // definition 里染紫的词（浅底 #8554E8），留空不强调
  cues?: number[];      // [0]=释义卡抽出，[1]=关键词点紫
};

export const yangTermDefineDefaults: YangTermDefineProps = {
  term: 'API',
  alias: '应用程序编程接口',
  definition: '按约定的规则，调用别人做好的能力',
  highlight: '别人做好的能力',
};

// 把一句话折成 n 行，优先在标点/空格处断
function splitLines(text: string, lines: number): string[] {
  if (lines <= 1) return [text];
  const chars = Array.from(text);
  const total = textWidth(text, 1);
  const out: string[] = [];
  let start = 0;
  for (let k = 1; k < lines; k++) {
    const target = (total * k) / lines;
    let acc = textWidth(chars.slice(0, start).join(''), 1), best = start + 1, bestScore = Infinity;
    for (let i = start + 1; i < chars.length; i++) {
      acc += textWidth(chars[i - 1], 1);
      const brk = /[，,、：:；; ]/.test(chars[i - 1]) ? -2.5 : 0;
      const score = Math.abs(acc - target) + brk;
      if (score < bestScore) { bestScore = score; best = i; }
    }
    out.push(chars.slice(start, best).join('').trim());
    start = best;
  }
  out.push(chars.slice(start).join('').trim());
  return out.filter(Boolean);
}

const MAX_W = 1640;
const DEF_PAD_X = 96, DEF_PAD_Y = 72;

export const YangTermDefine: React.FC<Partial<YangTermDefineProps>> = (props) => {
  const c = { ...yangTermDefineDefaults, ...props };
  const t = useT();
  const openAt = cueAt(c.cues, 0, 1.15);
  const hlAt = cueAt(c.cues, 1, 2.75);

  const units = Math.max(1, textWidth(c.definition, 1));
  const innerMax = MAX_W - 80 - DEF_PAD_X * 2;
  const nLines = [1, 2, 3].find((L) => Math.min(112, innerMax / (units / L * 1.08)) >= 84) ?? 3;
  const lines = splitLines(c.definition, nLines);
  const lineUnits = Math.max(1, ...lines.map((l) => textWidth(l, 1)));
  const defSize = Math.min(112, innerMax / lineUnits);
  const defLH = defSize * 1.3;
  const defW = Math.max(980, lineUnits * defSize + DEF_PAD_X * 2);
  const defH = lines.length * defLH + DEF_PAD_Y * 2 - (defLH - defSize * 1.16);

  const termBig = Math.min(260, 1300 / Math.max(1, textWidth(c.term, 1)));
  const termSmall = Math.min(164, 900 / Math.max(1, textWidth(c.term, 1)));
  const aliasSize = c.alias ? Math.min(58, 600 / Math.max(1, textWidth(c.alias, 1))) : 0;
  const m = q(t, openAt, openAt + 0.6);
  const termSize = mix(termBig, termSmall, m);
  const aliasGap = c.alias ? mix(56, 44, m) : 0;
  const contentW = textWidth(c.term, termSize) + (c.alias ? aliasGap + textWidth(c.alias, aliasSize) : 0);
  const cardW0 = contentW + termBig * 1.2;
  const cardW1 = Math.max(defW + 80, textWidth(c.term, termSmall) + (c.alias ? 44 + textWidth(c.alias, aliasSize) : 0) + termSmall * 0.9);
  const cardW = mix(cardW0, cardW1, m);
  const cardH = mix(termBig * 1.55, termSmall * 1.6, m);
  const tuck = 34;
  const blockH = termSmall * 1.6 + defH - tuck;
  const cardY1 = 540 - blockH / 2;
  const cardY = mix(540 - termBig * 1.55 / 2, cardY1, m);
  const enter = p(t, 0, 0.4);

  const unfold = p(t, openAt + 0.2, openAt + 0.85);
  const defX = 960 - (cardW1 - 80) / 2, defBoxW = cardW1 - 80;
  const defTop = cardY + cardH - tuck;
  const hl = p(t, hlAt, hlAt + 0.35);
  const hlColor = `rgb(${Math.round(mix(0x19, 0x85, hl))}, ${Math.round(mix(0x19, 0x54, hl))}, ${Math.round(mix(0x1c, 0xe8, hl))})`;

  const renderLine = (l: string) => {
    const k = c.highlight ? l.indexOf(c.highlight) : -1;
    if (k < 0) {
      const all = c.definition.indexOf(c.highlight);
      if (!c.highlight || all < 0) return l;
      const lineStart = c.definition.indexOf(l);
      const a = Math.max(all, lineStart), b = Math.min(all + c.highlight.length, lineStart + l.length);
      if (b <= a) return l;
      return <>{l.slice(0, a - lineStart)}<span style={{ color: hlColor }}>{l.slice(a - lineStart, b - lineStart)}</span>{l.slice(b - lineStart)}</>;
    }
    return <>{l.slice(0, k)}<span style={{ color: hlColor }}>{c.highlight}</span>{l.slice(k + c.highlight.length)}</>;
  };

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {unfold > 0 && <div style={{ position: 'absolute', left: defX - 60, top: defTop, width: defBoxW + 120, height: defH + 80, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 60, top: -(1 - unfold) * defH, width: defBoxW, height: defH,
          background: '#fff', borderRadius: `0 0 ${S.radius}px ${S.radius}px`, boxShadow: S.shadow,
        }}>
          {lines.map((l, i) => {
            const e = p(t, openAt + 0.45 + i * 0.16, openAt + 0.85 + i * 0.16);
            return <div key={i} style={{
              ...textBase(defSize, 900), position: 'absolute', left: 0, right: 0, textAlign: 'center',
              top: DEF_PAD_Y + tuck * 0.5 + i * defLH, color: S.ink, opacity: e, transform: `translateY(${(1 - e) * 20}px)`,
            }}>{renderLine(l)}</div>;
          })}
        </div>
      </div>}
      <div style={{
        position: 'absolute', left: 960 - cardW / 2, top: cardY, width: cardW, height: cardH, borderRadius: S.radius,
        background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: aliasGap,
        opacity: Math.min(1, enter * 1.6), transform: `scale(${mix(0.9, 1, enter)})`,
      }}>
        <span style={{ ...textBase(termSize, 400), color: '#fff' }}>{c.term}</span>
        {c.alias && <span style={{ ...textBase(aliasSize, 500), color: S.faint, transform: `translateY(${termSize * 0.08}px)` }}>{c.alias}</span>}
      </div>
    </Handoff>
  </Frame>;
};
