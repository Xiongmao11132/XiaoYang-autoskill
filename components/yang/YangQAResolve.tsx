// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T21b-QAResolve.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave3-40-20261012
// （Fred 官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave3-40-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批「B 类剩余全量提炼·第二组」集成）。
// 用途：问题逐个被回答（正版 T21b）——几个问题胶囊 → 依次被答案接上，问号变对勾。
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

export type YangQAItem = {
  question: string;    // 问题（句尾问号会翻成对勾；没写问号也会留出对勾位）
  answer: string;      // 答案，1–2 行自动折行（也可用 \n 指定断行）
  highlight?: string;  // 答案里染紫的词（白底上用 #8554E8），留空不强调
};
export type YangQAResolveProps = YangHandoffProps & {
  items: YangQAItem[];     // 2–4 组
  cues?: number[];     // [i]=第 i 个问题被回答（让位 + 抽出答案）；不传用默认节奏
};

// 默认内容：第 114 期 S20“回到评论区那几个问题。地址在哪？左上角。怎么下载？有软件去 Releases，只有代码就 clone。
// 能不能帮忙部署？授权好 GitHub CLI，把地址交给 Codex 就行。”
export const yangQAResolveDefaults: YangQAResolveProps = {
  items: [
    { question: '地址在哪？', answer: '左上角：用户名 / 项目名', highlight: '左上角' },
    { question: '怎么下载？', answer: '有软件去 Releases，只有代码就 clone', highlight: 'Releases' },
    { question: '能不能帮我部署？', answer: '授权好 GitHub CLI，把地址交给 Codex', highlight: 'Codex' },
  ],
};

// 比 kit textWidth 稍保守：大写拉丁字母按 0.68 估（MiSans Heavy 大写偏宽）
const tw = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[A-Z]/.test(ch) ? 0.68 : /[\u0000-ÿ]/.test(ch) ? 0.58 : 1) * size, 0);

// 两行均衡断开：拉丁词不拆，优先在标点后断，行首不放标点
function splitTwo(s: string): string[] {
  if (s.includes('\n')) return s.split('\n').slice(0, 2).map((l) => l.trim());
  const tokens = s.match(/[A-Za-z0-9.\-_/+#]+|\s+|./gu) ?? [s];
  const total = tw(s, 1);
  let best = 1, bestScore = Infinity, acc = 0;
  for (let i = 1; i < tokens.length; i++) {
    acc += tw(tokens[i - 1], 1);
    if (/^[，,、。：:；;！!？?]$/.test(tokens[i])) continue;
    const soft = /^[，,、：:；;]$/.test(tokens[i - 1]) ? -2.2 : /^\s+$/.test(tokens[i - 1]) ? -0.4 : 0;
    const score = Math.abs(acc - total / 2) + soft;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return [tokens.slice(0, best).join('').trim(), tokens.slice(best).join('').trim()];
}

function Marked({ text, hl }: { text: string; hl?: string }) {
  const k = hl ? text.indexOf(hl) : -1;
  if (!hl || k < 0) return <>{text}</>;
  return <>{text.slice(0, k)}<span style={{ color: accentOn(false) }}>{hl}</span>{text.slice(k + hl.length)}</>;
}

const AREA = 1740;    // 整组最大宽
const GAP = 34;       // 问题胶囊与答案胶囊
const ROW_GAP = 42;
const MARK = 0.95;    // 问号 / 对勾槽宽（以字号计）

export function YangQAResolve(props: Partial<YangQAResolveProps>) {
  const c = { ...yangQAResolveDefaults, ...props };
  const t = useT();
  const items = c.items.slice(0, 4);
  const n = Math.max(1, items.length);
  const bodies = items.map((it) => it.question.trim().replace(/[？?]+$/, ''));

  // —— 版式：问题胶囊（锐字真言）右对齐到同一条竖线，答案左对齐在竖线右侧 ——
  const qUnits = Math.max(1, ...bodies.map((b) => textWidth(b, 1) + MARK));
  const qs = Math.min(n >= 4 ? 72 : 88, 760 / (qUnits + 1.2));
  const qH = qs * 1.74;
  const qW = (i: number) => (textWidth(bodies[i], 1) + MARK) * qs + qs * 1.2;
  const qColW = Math.max(...items.map((_, i) => qW(i)));
  const padA = 46;
  // 答案字号：先看一行；有一条一行放不下 ≥44 就让它折两行；所有答案共用一个字号。
  // 答案列先限宽 780（长答案折两行，整组更紧凑）；限宽后字号 < 44 再放开到全宽。
  const fitAnswers = (avail: number) => {
    const oneFit = (s: string) => (avail - padA * 2) / Math.max(1, tw(s, 1));
    const two = items.map((it) => it.answer.includes('\n') || Math.min(54, oneFit(it.answer)) < 44);
    const lines = items.map((it, i) => (two[i] ? splitTwo(it.answer) : [it.answer]));
    const size = Math.min(54, ...lines.map((ls) => Math.min(...ls.map((l) => (avail - padA * 2) / Math.max(1, tw(l, 1))))));
    return { lines, size };
  };
  let fitted = fitAnswers(Math.min(AREA - qColW - GAP, 780));
  if (fitted.size < 44) fitted = fitAnswers(AREA - qColW - GAP);
  const aLines = fitted.lines;
  const as = fitted.size;
  const aH = (i: number) => (aLines[i].length > 1 ? as * 1.3 * 2 + 52 : Math.max(qH * 0.84, as * 2));
  const aW = (i: number) => Math.max(...aLines[i].map((l) => tw(l, as))) + padA * 2;
  const rowH = (i: number) => Math.max(qH, aH(i));
  const totalH = items.reduce((h, _, i) => h + rowH(i), 0) + ROW_GAP * (n - 1);
  const groupW = qColW + GAP + Math.max(...items.map((_, i) => aW(i)));
  const spine = 960 - groupW / 2 + qColW;                 // 问题右沿 = 这条竖线
  const rowTop = (i: number) => 540 - totalH / 2 + 12 + items.slice(0, i).reduce((h, _, k) => h + rowH(k) + ROW_GAP, 0);

  // —— 时间 ——
  const enterAt = (i: number) => 0.04 + i * 0.07;
  const answerAt = (i: number) => cueAt(c.cues, i, 0.8 + i * 1.12);
  const lastCheck = answerAt(n - 1) + 0.42;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {items.map((it, i) => {
        const e = p(t, enterAt(i), enterAt(i) + 0.42);
        const a = answerAt(i);
        const s = p(t, a, a + 0.66);                       // 让位与抽出共用这一个进度
        const w = qW(i);
        const cy = rowTop(i) + rowH(i) / 2;
        const qX = mix(960 - w / 2, spine - w, s);
        const qY = cy - qH / 2;
        const ah = aH(i), aw = aW(i);
        const aY = cy - ah / 2;
        const travel = aw + GAP + w / 2;
        const aX = qX + w + GAP - (1 - s) * travel;        // 从问题胶囊中心背后出发
        const clipL = qX + w / 2;
        const flipOut = q(t, a + 0.26, a + 0.4);           // 问号翻走
        const flipIn = p(t, a + 0.4, a + 0.62);            // 对勾翻上来
        const draw = p(t, a + 0.44, a + 0.78);
        const two = aLines[i].length > 1;
        const ar = two ? Math.min(ah / 2, 60) : ah / 2;
        return <React.Fragment key={i}>
          {/* 答案：白底胶囊，裁切左边界跟着问题胶囊中心走，看起来是从它背后抽出来 */}
          {s > 0.001 && <div style={{ position: 'absolute', left: clipL, top: aY - 50, width: 1920 - clipL, height: ah + 120, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', left: aX - clipL, top: 50, width: aw, height: ah, borderRadius: ar, background: '#fff',
              boxShadow: S.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* 文字块整体居中（宽度估算偏保守，左右留白保持对称），块内左对齐 */}
              <div>
                {aLines[i].map((l, k) => <div key={k} style={{ ...textBase(as, 900), lineHeight: 1.3, color: S.ink }}>
                  <Marked text={l} hl={it.highlight} />
                </div>)}
              </div>
            </div>
          </div>}
          {/* 问题：黑胶囊（与 T08e 同外观） */}
          <div style={{
            ...abs({ x: qX, y: qY + (1 - e) * 36, w, h: qH }), borderRadius: qH / 2, background: S.dark, boxShadow: S.capsuleShadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clamp(e * 3),
            transform: `scale(${mix(0.9, 1, e)})`,
          }}>
            <span style={{ ...textBase(qs, 400, S.display), color: '#fff', display: 'flex', alignItems: 'center' }}>
              {bodies[i]}
              <span style={{ position: 'relative', display: 'inline-block', width: MARK * qs, height: qs * 1.16, perspective: qs * 6 }}>
                {flipOut < 1 && it.question.trim().match(/[？?]$/) && <span style={{
                  position: 'absolute', left: 0, right: 0, textAlign: 'center', color: accentOn(true),
                  transform: `rotateX(${flipOut * 90}deg)`, transformOrigin: '50% 50%',
                }}>？</span>}
                {flipIn > 0 && <svg viewBox="0 0 100 100" width={qs * 0.86} height={qs * 0.86} style={{
                  position: 'absolute', left: (MARK * qs - qs * 0.86) / 2, top: (qs * 1.16 - qs * 0.86) / 2,
                  transform: `rotateX(${(1 - flipIn) * -90}deg)`, overflow: 'visible',
                }}>
                  <path d="M16 54 L40 77 L86 25" fill="none" stroke={accentOn(true)} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray={110} strokeDashoffset={110 * (1 - draw)} />
                </svg>}
              </span>
            </span>
          </div>
        </React.Fragment>;
      })}
    </Handoff>
    
    
    
  </Frame>;
}
