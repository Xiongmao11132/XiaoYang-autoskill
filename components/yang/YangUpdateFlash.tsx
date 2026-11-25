/**
 * YangUpdateFlash — 更新快讯开场（参数化正版 T20c）.
 * Adapted from FredTalk (github.com/njrhts2kvv-star/FredTalk, v2.5), MIT License.
 * Source file: fred-wave2-42-20261012/src/components/T20c-UpdateFlash.tsx (+ src/kit/{theme.ts,ui.tsx});
 * package publicly released 2026-10-27 on the original visual library.
 * Downloaded 2026-11-02 via the site's public asset route, SHA-256 verified against the original
 * member-package manifest (fa5ab7e7…97d63ef, 34,144,141 B) and imported with the original
 * scripts/assets.py; archive kept in the original package download dir (downloads-b/fred-wave2-42-source.zip).
 *
 * Integration notes: Sfx and Brand corner marks are NOT integrated (silent, no watermark);
 * fonts mapped to the library FONT (../src/theme); colors mapped to the library palette.
 * The original defaults named a real product with its captured launch artwork — NOT integrated:
 * defaults here are a neutral placeholder product with no logo/backdrop (both props accept
 * '' to skip, exactly as the original allows); pass a real product name, logo and official
 * launch image when using it.
 *
 * Mechanics: not a news montage — one product object stays on stage throughout. The official
 * launch image sits behind, blurred under a white veil, as context. Logo + product name land
 * big at center (scale settle + deblur), then lift up and shrink to 0.8 to make room; the
 * 2–4 update points pop out one by one from beneath the name (damped-spring scale) and line
 * up in a row — wrapping to two rows when a single row would shrink the type below 50px.
 * cues[0] = name lift / points start; cues[1..n] = each point's moment.
 * Layout: 1920×1080 logical stage, scaled by host width (Frame).
 */
import React from 'react';
import {
  AbsoluteFill,
  Img,
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
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const p = (t: number, a: number, b: number) => easeOut(clamp01((t - a) / (b - a)));
export const q = (t: number, a: number, b: number) => easeInOut(clamp01((t - a) / (b - a)));
export const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp01((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
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

const CAPSULE_SHADOW = '0 18px 36px 0 rgba(0,0,0,0.3)';

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

export type YangUpdateFlashProps = YangHandoffProps & {
  product: string;
  logo: string;          // 产品 Logo（透明底），'' 不显示
  backdrop: string;      // 退后的官方发布图/截图，'' 不用
  points: string[];      // 2–4 个更新点
  highlight: string;     // 某个更新点里染紫的词（黑胶囊上浅紫）
  cues?: number[];       // [0]=名字上移、开始出更新点（默认 1.0s）；[1..n]=第 i 个更新点
};

export const yangUpdateFlashDefaults: YangUpdateFlashProps = {
  product: '示例产品 2.0',
  logo: '',
  backdrop: '',
  points: ['新增一个模式', '速度快了一倍', '界面重新设计'],
  highlight: '一倍',
};

export function YangUpdateFlash(props: Partial<YangUpdateFlashProps>) {
  const c = { ...yangUpdateFlashDefaults, ...props };
  const t = useT();
  const points = c.points.slice(0, 4);
  const n = Math.max(1, points.length);

  const liftAt = cueAt(c.cues, 0, 1.0);
  const pointAt = (i: number) => cueAt(c.cues, i + 1, liftAt + 0.12 + i * 0.26);

  const land = p(t, 0, 0.55);
  const lift = q(t, liftAt, liftAt + 0.5);
  const nameSize0 = Math.min(150, 1300 / Math.max(1, textWidth(c.product, 1)));
  const logo0 = c.logo ? nameSize0 * 1.15 : 0;
  const scale = mix(1, 0.8, lift);
  const rowW0 = logo0 + (c.logo ? nameSize0 * 0.35 : 0) + textWidth(c.product, nameSize0);

  const pad = 1.5, gap = 36;
  const em = points.reduce((a, x) => a + textWidth(x, 1) + pad, 0);
  let ptSize = Math.min(72, (1640 - (n - 1) * gap) / Math.max(1, em));
  let rows: string[][] = [points];
  if (ptSize < 50 && n > 2) {
    const half = Math.ceil(n / 2);
    rows = [points.slice(0, half), points.slice(half)];
    const w1 = Math.max(...rows.map((r) => r.reduce((a, x) => a + textWidth(x, 1) + pad, 0)));
    ptSize = Math.min(72, (1640 - gap) / w1);
  }
  const ptH = ptSize * 2;
  const rowGap = 30;
  const blockH = rows.length * ptH + (rows.length - 1) * rowGap;
  const nameH = nameSize0 * 1.2 * 0.8;
  const endTop = (1080 - (nameH + 70 + blockH)) / 2;
  const nameCy = mix(540, endTop + nameH / 2, lift);
  const ptTop = endTop + nameH + 70;

  const bd = p(t, 0, 0.6);
  let idx = 0;

  return (
    <Frame>
      <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
        {c.backdrop && (
          <AbsoluteFill style={{ opacity: bd }}>
            <Img src={staticFile(c.backdrop)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${mix(6, 16, bd)}px)`, transform: 'scale(1.08)' }} />
            <AbsoluteFill style={{ background: 'rgba(255,255,255,0.76)' }} />
          </AbsoluteFill>
        )}
        <div style={{ position: 'absolute', left: 960 - rowW0 / 2, top: nameCy - nameSize0 * 0.6, width: rowW0, height: nameSize0 * 1.2,
          display: 'flex', alignItems: 'center', gap: nameSize0 * 0.35, transform: `scale(${scale * mix(1.12, 1, land)})`, transformOrigin: 'center center',
          opacity: land, filter: `blur(${(1 - land) * 10}px)`, zIndex: 10 }}>
          {c.logo && <Img src={staticFile(c.logo)} style={{ width: logo0, height: logo0, objectFit: 'contain' }} />}
          <span style={{ ...textBase(nameSize0, 900), color: S.ink }}>{c.product}</span>
        </div>
        {rows.map((row) => {
          const rw = row.reduce((a, x) => a + textWidth(x, ptSize) + ptSize * pad, 0) + (row.length - 1) * gap;
          let x = 960 - rw / 2;
          return row.map((pt) => {
            const i = idx++;
            const r = rows.indexOf(row);
            const w = textWidth(pt, ptSize) + ptSize * pad;
            const a = pointAt(i);
            const v = p(t, a, a + 0.38);
            const s = springAt(t, a, 0.55);
            const tx = x, ty = ptTop + r * (ptH + rowGap);
            const fx = 960 - w / 2, fy = nameCy;
            x += w + gap;
            const hl = c.highlight && pt.includes(c.highlight);
            const [pre, post = ''] = hl ? pt.split(c.highlight) : [pt];
            return (
              <Pill key={i} box={{ x: mix(fx, tx, v), y: mix(fy, ty, v), w, h: ptH }}
                style={{ opacity: Math.max(0, Math.min(1, v * 3)), transform: `scale(${mix(0.6, 1, s)})`, zIndex: 5 }}>
                <span style={{ ...textBase(ptSize, 400), color: '#fff' }}>
                  {pre}{hl && <span style={{ color: S.accentDark }}>{c.highlight}</span>}{post}
                </span>
              </Pill>
            );
          });
        })}
      </Handoff>
    </Frame>
  );
}

export { interpolate };
