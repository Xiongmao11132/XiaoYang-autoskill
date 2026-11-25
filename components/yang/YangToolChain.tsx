// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License.
// Source: T18b-ToolChain.tsx + src/kit/theme.ts + src/kit/ui.tsx, from package fred-wave2-fix5-20261012
// （官网视觉库公开下载；ZIP 归档 ~/workspace/tools/FredTalk/downloads-b/fred-wave2-fix5-20261012-source.zip，
// 2026-11-02 经公开路线下载、SHA-256 与 manifest 一致后 import，本批提炼集成）。
// 用途：多工具组合成一条工作流（正版 T18b）：几个工具 Logo 先散着，依次归位排成一行（顺序本身就是流程）；
// 然后一枚黑胶囊「活儿」从左边进入，依次穿过每个工具（穿过时被卡片挡住、每穿过一个就换成这个工具的产出），
// 最后移到链下方正中放大成结论胶囊。不画箭头：先后出现＋对象移动表达上下游。
// 与近名件的区别：YangMediaChain 是图片→视频→成片三张载体卡＋箭头串联（静态链）；本件是 Logo 归位成链＋
// 活儿胶囊逐站穿行变形，末站落成结论——机制不同，不重复。
// 集成注记：原包 Sfx 音效未随 MIT 集成（已剔除，本件静音）；原包字体未集成，字体走本库 FONT；Brand 角标未集成；
// kit 的 p/q/springAt/cueAt/textWidth 与 Frame/Handoff 已内嵌移植，逻辑与原版一致；原包默认 Logo 为真实品牌图、
// 未集成——tools 的 logo 走 props（宿主 public 下的透明 PNG），logo 为空串时渲染中性字母占位块。
// 舞台为 1920×1080 逻辑坐标，Frame 按宿主宽度等比缩放。调色板保留原版浅底设计。
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FONT } from '../src/theme';

// —— kit/theme 最小移植（MIT，逻辑逐字） ——
const S = {
  ink: '#19191c',
  dark: '#19191c',
  accent: '#8554E8',
  accentDark: '#D6BEFF',
  capsuleShadow: '30px 22px 25px #0005',
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
const springAt = (t: number, delay: number, duration = 0.8) => {
  const v = clamp((t - delay) / duration);
  return v === 1 ? 1 : 1 - Math.exp(-8 * v) * Math.cos(9 * v);
};
const cueAt = (cues: readonly number[] | undefined, i: number, fallback: number) =>
  cues && typeof cues[i] === 'number' && Number.isFinite(cues[i]) ? cues[i] : fallback;
const textWidth = (s: string, size: number) =>
  Array.from(s).reduce((w, ch) => w + (/[\u0000-\u00ff]/.test(ch) ? 0.58 : 1) * size, 0);

// —— kit/ui 最小移植（Frame/Handoff/textBase，去 Brand、Fonts 与 Sfx） ——
const useT = () => useCurrentFrame() / useVideoConfig().fps;
const textBase = (size: number, weight = 900): React.CSSProperties => ({
  fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.16, fontSynthesis: 'none', whiteSpace: 'nowrap',
});
function Frame({ children, dark = false, background }: { children: React.ReactNode; dark?: boolean; background?: string }) {
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

export type YangChainTool = {
  logo: string;     // 真实 Logo（抠干净的透明 PNG 宿主 public 路径）；空串 = 中性字母占位块
  name: string;     // 工具名
  output: string;   // 经过它之后，这份活儿变成什么
};

export type YangToolChainProps = YangHandoffProps & {
  tools: YangChainTool[];  // 2–4 个，按流程先后
  input: string;           // 一开始的那份活儿
  cues?: number[];         // [0]=开始归位，[1+i]=活儿穿过第 i 个工具
};

export const yangToolChainDefaults: YangToolChainProps = {
  tools: [
    { logo: '', name: '写作助手', output: '资料' },
    { logo: '', name: '编程助手', output: '代码' },
    { logo: '', name: '排版助手', output: '整套文档' },
  ],
  input: '想法',
};

const ROW_Y = 420;          // 卡片中线
const MARGIN = 80;

// 散开时的初始位置（固定种子，确定渲染）
const SCATTER = [
  { x: 760, y: 430, r: -10, s: 0.92 }, { x: 1110, y: 560, r: 8, s: 1.0 }, { x: 900, y: 650, r: -4, s: 0.86 },
  { x: 1230, y: 380, r: 12, s: 0.9 }, { x: 640, y: 610, r: 6, s: 0.88 },
];

export const YangToolChain: React.FC<Partial<YangToolChainProps>> = (props) => {
  const c = { ...yangToolChainDefaults, ...props };
  const t = useT();
  const tools = c.tools.slice(0, 4);
  const n = tools.length;

  // —— 版面：n 张卡 + (n+1) 个间隔（两端间隔放起点和结果） ——
  const total = 1920 - MARGIN * 2;
  const card = Math.min(290, (total - (n + 1) * 220) / n);
  const gap = (total - n * card) / (n + 1);
  const cardX = (i: number) => MARGIN + gap * (i + 1) + card * i;          // 卡片左边
  const gapCx = (i: number) => MARGIN + gap * i + card * i + gap / 2;     // 第 i 个间隔中心
  const words = [c.input, ...tools.map((x) => x.output)];
  let tokenSize = 54;
  const maxTokW = gap - 14;
  while (tokenSize > 30 && Math.max(...words.map((w) => textWidth(w, tokenSize) + tokenSize * 1.3)) > maxTokW) tokenSize -= 2;
  let nameSize = 56;
  while (nameSize > 34 && Math.max(...tools.map((x) => textWidth(x.name, nameSize))) > card + gap - 30) nameSize -= 2;

  // —— 时间线 ——
  const arrangeAt = cueAt(c.cues, 0, 0.5);
  const landAt = (i: number) => arrangeAt + i * 0.16;
  const tokenIn = arrangeAt + (n - 1) * 0.16 + 0.75;
  const passStep = n <= 3 ? 0.64 : 0.54;
  const passAt = tools.map((_, i) => cueAt(c.cues, 1 + i, tokenIn + 0.3 + i * passStep));
  const PASS = 0.5;
  const finalAt = passAt[n - 1] + PASS;

  // 活儿（token）的位置与文字
  let tokenX = gapCx(0), word = c.input;
  tools.forEach((_, i) => {
    const v = q(t, passAt[i], passAt[i] + PASS);
    if (v > 0) {
      tokenX = mix(gapCx(i), gapCx(i + 1), v);
      if (v >= 0.5) word = words[i + 1];
    }
  });
  // 结果落定：最后一份产出从链尾移到链下方正中，放大成结论胶囊
  const settle = q(t, finalAt + 0.05, finalAt + 0.66);
  const settleY = q(t, finalAt + 0.05, finalAt + 0.4), settleX = q(t, finalAt + 0.28, finalAt + 0.66);
  let finalSize = 96;
  while (finalSize > 56 && textWidth(words[n], finalSize) > 1100) finalSize -= 2;
  const fs = mix(tokenSize, finalSize, settle);
  const tokW = textWidth(word, fs) + fs * 1.3, tokH = fs * 1.9;
  const tokCx = mix(tokenX, 960, settleX);
  const tokCy = mix(ROW_Y, ROW_Y + card / 2 + 34 + 56 * 1.16 + 80 + finalSize * 0.95, settleY);
  const tokenAppear = springAt(t, tokenIn, 0.6);
  const landPop = springAt(t, finalAt + 0.45, 0.6);
  const tokScale = mix(0.4, 1, clamp(tokenAppear)) * (settle > 0.8 ? mix(0.94, 1, landPop) : 1);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 活儿：在卡片下层移动，穿过时被卡片挡住 */}
      {t >= tokenIn && <div style={{
        position: 'absolute', left: tokCx - tokW / 2, top: tokCy - tokH / 2, width: tokW, height: tokH, borderRadius: tokH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${tokScale})`, opacity: clamp((t - tokenIn) / 0.1), zIndex: settle > 0.05 ? 20 : 1,
      }}>
        <span style={{ ...textBase(fs, 900), lineHeight: 1, color: settle > 0.3 ? S.accentDark : '#fff' }}>{word}</span>
      </div>}

      {tools.map((tool, i) => {
        const s = SCATTER[i % SCATTER.length];
        const pop = springAt(t, 0.03 + i * 0.07, 0.6);
        const appear = clamp((t - 0.03 - i * 0.07) / 0.12);
        const m = q(t, landAt(i), landAt(i) + 0.6);
        const x = mix(s.x - card / 2, cardX(i), m), y = mix(s.y - card / 2, ROW_Y - card / 2, m);
        const rot = mix(s.r, 0, m), sc = mix(s.s, 1, m) * mix(0.4, 1, clamp(pop));
        // 活儿穿过时，这张卡“接住”一下
        const busy = passAt[i] ? Math.sin(clamp((t - passAt[i] - 0.1) / 0.32) * Math.PI) : 0;
        const nameIn = p(t, landAt(i) + 0.45, landAt(i) + 0.8);
        const active = t >= passAt[i] + 0.1 && t < passAt[i] + PASS + 0.2;
        return <React.Fragment key={i}>
          <div style={{
            position: 'absolute', left: x, top: y, width: card, height: card,
            opacity: appear, transform: `rotate(${rot}deg) scale(${sc * (1 + 0.06 * busy)})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 + (m > 0.5 ? 0 : i),
          }}>
            {tool.logo
              ? <Img src={staticFile(tool.logo)} style={{ width: card * 1.0, height: card * 1.0, objectFit: 'contain' }} />
              : <div style={{
                width: card * 0.82, height: card * 0.82, borderRadius: card * 0.2,
                background: `linear-gradient(135deg, hsl(${222 + i * 34} 30% 88%), hsl(${252 + i * 26} 32% 72%))`,
                boxShadow: '0 14px 26px rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ ...textBase(card * 0.34, 900), color: S.ink }}>{Array.from(tool.name)[0] ?? '·'}</span>
              </div>}
          </div>
          <div style={{
            position: 'absolute', left: cardX(i) + card / 2 - 400, width: 800, top: ROW_Y + card / 2 + 34 + (1 - nameIn) * 16,
            textAlign: 'center', ...textBase(nameSize, 900), color: active ? S.accent : S.ink, opacity: nameIn,
          }}>{tool.name}</div>
        </React.Fragment>;
      })}
    </Handoff>
  </Frame>;
};
