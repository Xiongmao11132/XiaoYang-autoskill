/**
 * YangPainContrast — 痛点反差开场（参数化正版 T20b）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source file: fred-wave2-42-20261012/src/components/T20b-PainContrast.tsx (+ src/kit/{theme.ts,ui.tsx});
 * package publicly released 2026-10-27 on the original's visual library (fred-fu.com/visual-library).
 * Downloaded 2026-11-02 via the site's public asset route, SHA-256 verified against the original
 * member-package manifest (fa5ab7e7…97d63ef, 34,144,141 B) and imported with the original's
 * scripts/assets.py; archive kept at ~/workspace/tools/FredTalk/downloads-b/fred-wave2-42-source.zip.
 *
 * Integration notes: Sfx and Brand corner marks are NOT integrated (silent, no watermark);
 * fonts mapped to the library FONT (../src/theme); colors mapped to the library palette.
 * The original's default result image (the author's own work) is NOT integrated — pass your own via
 * `resultImage`; an empty string renders a neutral placeholder panel. Default pain steps
 * replaced with neutral wording.
 *
 * Mechanics: the "old way" is a light Mac window whose to-do steps stack in fast — once they
 * overflow the visible rows the whole list scrolls up so the newest step is always visible,
 * which is what makes it feel endless. Then one diagonal cut (from lower-left to upper-right)
 * splits the window: the two halves fly apart along the cut's normal with a slight rotation,
 * blurring and fading, revealing the finished result waiting behind; the result settles with
 * a small push-in and a dark capsule caption lands across its bottom edge, keyword in light
 * purple. cues[0] sets the cut moment (default 2.35s).
 * Layout: 1920×1080 logical stage, scaled by host width (Frame).
 */
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { FONT } from '../src/theme';

const S = {
  bg: '#fff',
  ink: '#19191c',
  dark: '#19191c',
  muted: '#83838a',
  faint: '#b9b9bf',
  accent: '#8554E8',
  accentDark: '#D6BEFF',
};

export type Box = { x: number; y: number; w: number; h: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const clamp = clamp01;
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const p = (t: number, a: number, b: number) => easeOut(clamp01((t - a) / (b - a)));
const q = (t: number, a: number, b: number) => easeInOut(clamp01((t - a) / (b - a)));
const wipe = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
export const cueAt = (cues: number[] | undefined, i: number, fallback: number) =>
  cues && cues[i] !== undefined ? cues[i] : fallback;

const isW = (ch: string) => /[一-鿿＀-￯]/.test(ch);
export function textWidth(text: string, size: number) {
  let w = 0;
  for (const ch of text) w += isW(ch) ? 0.94 : 0.56;
  return w * size;
}
const abs = (b: Box): React.CSSProperties => ({ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h });
const textBase = (size: number, weight = 500): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  lineHeight: 1.16,
  letterSpacing: 0,
  whiteSpace: 'nowrap',
});

function useT() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
}

function Frame({ children }: { children: React.ReactNode }) {
  const { width } = useVideoConfig();
  const scale = width / 1920;
  return (
    <AbsoluteFill style={{ backgroundColor: S.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        {children}
      </div>
    </AbsoluteFill>
  );
}

export type YangHandoffProps = { enter?: number; exit?: number; exitAt?: number };

function Handoff({ enter = 0, exit = 0, exitAt = 0, children }: YangHandoffProps & { children: React.ReactNode }) {
  const t = useT();
  const k = enter > 0 ? q(t, 0, enter) : 1;
  const out = exit > 0 ? q(t, exitAt, exitAt + exit) : 0;
  const ty = (1 - k) * 46 - out * 46;
  const blur = (1 - k) * 8 + out * 8;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, k * 1.6) * (1 - out), transform: `translateY(${ty}px)`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
      {children}
    </div>
  );
}

const SHADOW = '0 24px 40px 0 rgba(0,0,0,0.2)';
const CAPSULE_SHADOW = '0 18px 36px 0 rgba(0,0,0,0.3)';

function MacWindowLight({ box, bar = 90, style, children }: {
  box: Box; bar?: number; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  const dot = Math.round(bar * 0.267);
  return (
    <div style={{ ...abs(box), borderRadius: 36, overflow: 'hidden', background: '#fff', boxShadow: SHADOW, ...style }}>
      <div style={{ height: bar, background: '#f4f4f6', display: 'flex', alignItems: 'center', gap: dot, paddingLeft: bar * 0.63, position: 'relative' }}>
        {[S.accent, '#aaa', '#ddd'].map((cc) => (
          <span key={cc} style={{ width: dot, height: dot, borderRadius: dot, background: cc }} />
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, top: bar, right: 0, bottom: 0 }}>{children}</div>
    </div>
  );
}

function Pill({ box, style, children }: { box: Box; style?: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <div style={{
      ...abs(box), borderRadius: Math.min(box.w, box.h) / 2, background: S.ink, boxShadow: CAPSULE_SHADOW,
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      {children}
    </div>
  );
}

function Media({ src, box, radius = 28, style }: { src: string; box: Box; radius?: number; style?: React.CSSProperties }) {
  if (!src) {
    return (
      <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', background: 'linear-gradient(135deg, #c2ecd4 0%, #74c69d 60%, #40916c 100%)', ...style }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...textBase(64, 900), color: 'rgba(255,255,255,0.8)' }}>结果画面</span>
        </div>
      </div>
    );
  }
  const image = /\.(png|jpe?g|webp)$/i.test(src);
  const inner: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
  return (
    <div style={{ ...abs(box), borderRadius: radius, overflow: 'hidden', ...style }}>
      {image ? <Img src={staticFile(src)} style={inner} /> : <OffthreadVideo muted loop src={staticFile(src)} style={inner} />}
    </div>
  );
}

export type YangPainContrastProps = YangHandoffProps & {
  painTitle: string;     // 旧做法的标题
  painSteps: string[];   // 旧做法的步骤（越多越显得费劲；3–9）
  resultImage: string;   // 轻松的结果：真实作品/截图；空串 = 中性占位面
  caption: string;       // 结果胶囊里的一句话
  highlight: string;     // caption 里染紫的词（黑胶囊上浅紫）
  cues?: number[];       // [0]=斜切（默认 2.35s）
};

export const yangPainContrastDefaults: YangPainContrastProps = {
  painTitle: '以前：手工做一张图',
  painSteps: ['找参考、定配色', '一格一格画细节', '文字一个个对齐', '数值和按钮重新排', '导出一看，糊了', '改一处，整张重来'],
  resultImage: '',
  caption: '现在：一句话，整张直接出',
  highlight: '直接出',
};

const WIN = { x: 250, y: 120, w: 1420, h: 840 };
const BAR = 90;
const CUT_L = 770, CUT_R = 310;

export function YangPainContrast(props: Partial<YangPainContrastProps>) {
  const c = { ...yangPainContrastDefaults, ...props };
  const t = useT();
  const steps = c.painSteps.slice(0, 9);
  const n = Math.max(1, steps.length);

  const cutAt = cueAt(c.cues, 0, 2.35);
  const enter = p(t, 0, 0.45);
  const stepAt = (i: number) => 0.3 + i * Math.min(0.3, 1.75 / n);

  const titleSize = Math.min(84, (WIN.w - 200) / Math.max(1, textWidth(c.painTitle, 1)));
  const stepSize = Math.min(60, (WIN.w - 320) / Math.max(1, ...steps.map((s) => textWidth(s, 1))));
  const rowH = stepSize * 1.75;
  const listTop = 80 + titleSize * 1.16 + 50;
  const listH = WIN.h - BAR - listTop - 50;
  const visRows = Math.max(1, Math.floor(listH / rowH));
  let scroll = 0;
  steps.forEach((_, i) => { if (i >= visRows) scroll += rowH * p(t, stepAt(i), stepAt(i) + 0.25); });

  const painLayer = (
    <MacWindowLight box={{ ...WIN, y: WIN.y + (1 - enter) * 50 }} bar={BAR} style={{ opacity: enter }}>
      <div style={{ ...textBase(titleSize, 900), position: 'absolute', left: 100, top: 80, color: S.ink }}>{c.painTitle}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: listTop, height: listH, overflow: 'hidden' }}>
        {steps.map((s, i) => {
          const v = p(t, stepAt(i), stepAt(i) + 0.3);
          return (
            <div key={i} style={{ position: 'absolute', left: 100, top: i * rowH - scroll + (1 - v) * 30, height: rowH, display: 'flex', alignItems: 'center', gap: stepSize * 0.7, opacity: v }}>
              <span style={{ ...textBase(stepSize, 500), color: S.faint, width: stepSize * 1.2, textAlign: 'right' }}>{i + 1}</span>
              <span style={{ ...textBase(stepSize, 500), color: '#3a3a40' }}>{s}</span>
            </div>
          );
        })}
      </div>
    </MacWindowLight>
  );

  const k = wipe(t, cutAt, cutAt + 0.75);
  const dx = 150 * k, dy = 720 * k;
  const upper = `polygon(0 0, 1920px 0, 1920px ${CUT_R}px, 0 ${CUT_L}px)`;
  const lower = `polygon(0 ${CUT_L}px, 1920px ${CUT_R}px, 1920px 1080px, 0 1080px)`;
  const piece = (clip: string, sx: number, sy: number, rot: number) => (
    <div style={{ position: 'absolute', inset: 0, clipPath: clip, transform: `translate(${sx}px, ${sy}px) rotate(${rot}deg)`, transformOrigin: '960px 540px',
      opacity: 1 - clamp01((k - 0.55) / 0.45), filter: k > 0 ? `blur(${k * 6}px)` : undefined }}>{painLayer}</div>
  );

  const reveal = p(t, cutAt + 0.05, cutAt + 0.9);
  const IMG = { x: 300, y: 128, w: 1320, h: 742.5 };
  const capSize = Math.min(84, 1300 / Math.max(1, textWidth(c.caption, 1)));
  const capW = textWidth(c.caption, capSize) + capSize * 1.8;
  const capH = capSize * 2;
  const cap = p(t, cutAt + 0.55, cutAt + 1.0);
  const [pre, post = ''] = c.highlight && c.caption.includes(c.highlight) ? c.caption.split(c.highlight) : [c.caption];

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        {t >= cutAt && (
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${mix(0.92, 1, reveal)})`, transformOrigin: '960px 500px' }}>
            <Media src={c.resultImage} box={IMG} style={{ boxShadow: SHADOW }} />
            <Pill box={{ x: 960 - capW / 2, y: IMG.y + IMG.h - capH * 0.45 + (1 - cap) * 24, w: capW, h: capH }} style={{ opacity: cap }}>
              <span style={{ ...textBase(capSize, 400), color: '#fff' }}>
                {pre}{c.highlight && c.caption.includes(c.highlight) && <span style={{ color: S.accentDark }}>{c.highlight}</span>}{post}
              </span>
            </Pill>
          </div>
        )}
        {t < cutAt ? painLayer : (
          <>
            {piece(upper, -dx, -dy, -4 * k)}
            {piece(lower, dx, dy, 4 * k)}
          </>
        )}
      </Handoff>
    </Frame>
  );
}

export { interpolate };
