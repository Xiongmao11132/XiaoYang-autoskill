// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/63391fde9c9b/src/Transition.tsx
// 用途：章节过渡/章节标题建立（C035 选框定位=drag、C034 编号反白=reveal，另含原文件 aperture/number/push 三种建立方式）——序号＋标题＋眉题在黑/白场上建立并稳定停留。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, clamp01 } from '../src/theme';

export type YangChapterKind = 'drag' | 'reveal' | 'aperture' | 'number' | 'push';

export type YangChapterTransitionProps = {
  /** 章节序号文案，如 "Part.01" / "第一章" / "02" */
  numberLabel: string;
  title: string;
  subtitle?: string;
  kind?: YangChapterKind;
  background?: string;
  foreground?: string;
  accent?: string;
  titleSize?: number;
  labelSize?: number;
};

const curve = Easing.bezier(0.65, 0, 0.2, 1);
const phase = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { easing: curve, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const layer: React.CSSProperties = { position: 'absolute' };

const TitleText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/([A-Za-z]+)/).map((part, i) => (
      <span key={i} style={{ fontWeight: /[A-Za-z]/.test(part) ? 600 : 700, letterSpacing: /[\u4e00-\u9fff]/.test(part) ? '0.012em' : 0 }}>{part}</span>
    ))}
  </>
);

type Inner = Required<Omit<YangChapterTransitionProps, 'subtitle'>> & { subtitle?: string; contentWidth: number };

const Copy: React.FC<{ p: Inner; center?: boolean; color: string; subColor: string }> = ({ p, center = false, color, subColor }) => (
  <div style={{ width: p.contentWidth, color, textAlign: center ? 'center' : 'left', fontFamily: FONT }}>
    <div style={{ fontSize: p.labelSize, fontWeight: 500, whiteSpace: 'nowrap', lineHeight: 1.15, marginBottom: 18, color: subColor }}>{p.numberLabel}</div>
    <div style={{ fontSize: p.titleSize, fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1.15 }}><TitleText text={p.title} /></div>
    {p.subtitle ? <div style={{ fontSize: Math.round(p.labelSize * 0.72), marginTop: 20, color: subColor, whiteSpace: 'nowrap' }}>{p.subtitle}</div> : null}
  </div>
);

const Cursor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width="42" height="52" viewBox="0 0 42 52" style={{ ...layer, left: x, top: y }}><path d="M3 2 L3 38 L13 30 L22 48 L29 44 L20 26 L34 26 Z" fill="#080808" stroke="#eee" strokeWidth="2.5" strokeLinejoin="round" /></svg>
);

export const YangChapterTransition: React.FC<YangChapterTransitionProps> = (props) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const kind = props.kind ?? 'reveal';
  const dark = kind !== 'aperture' && kind !== 'push';
  const p: Inner = {
    numberLabel: props.numberLabel,
    title: props.title,
    subtitle: props.subtitle,
    kind,
    background: props.background ?? (dark ? '#000000' : '#FFFFFF'),
    foreground: props.foreground ?? (dark ? '#FFFFFF' : '#000000'),
    accent: props.accent ?? C.brass,
    titleSize: props.titleSize ?? 92,
    labelSize: props.labelSize ?? 40,
    contentWidth: Math.min(1200, Math.max(400, props.title.length * (props.titleSize ?? 92) * 0.92)),
  };
  const subColor = dark ? '#C9C9C9' : '#555555';
  const copyH = p.labelSize * 1.15 + 18 + p.titleSize * 1.15 + 20;

  let body: React.ReactNode = null;
  if (kind === 'drag') {
    // C035：选框从左上向右下框住文案，文案随选框 clip 建立，选框与光标随后退场
    const grow = phase(f, 5, 37);
    const x = (1920 - p.contentWidth) / 2, y = 362, w = p.contentWidth + 28;
    body = (
      <>
        <div style={{ ...layer, left: x, top: y, width: w, height: copyH, clipPath: `inset(0 ${100 * (1 - grow)}% ${100 * (1 - grow)}% 0)` }}>
          <Copy p={p} color={p.foreground} subColor={subColor} />
        </div>
        {f < 48 && (
          <>
            <div style={{ ...layer, left: x - 10, top: y - 8, width: w * grow, height: copyH * grow, border: '1.5px solid #909090' }} />
            {grow > 0 && ([[0, 0], [1, 0], [0, 1], [1, 1]] as const).map(([xx, yy], i) => (
              <div key={i} style={{ ...layer, left: x - 13 + w * grow * xx, top: y - 11 + copyH * grow * yy, width: 6, height: 6, background: '#080808', border: '1px solid #bbb' }} />
            ))}
            <Cursor x={x - 7 + w * grow} y={y - 5 + copyH * grow} />
          </>
        )}
      </>
    );
  } else if (kind === 'aperture') {
    const grow = phase(f, 1, 44);
    const h = 4 + 576 * grow;
    body = (
      <div style={{ ...layer, left: 240, top: 540 - h / 2, width: 1440, height: h, background: '#000', borderRadius: 28, overflow: 'hidden' }}>
        <div style={{ ...layer, left: (1440 - p.contentWidth) / 2, top: h / 2 - copyH / 2 + 10 }}><Copy p={p} color="#fff" subColor="#C9C9C9" /></div>
      </div>
    );
  } else if (kind === 'number') {
    // 编号先以巨字在场，随后缩回眉题位，标题自下翻入
    const move = phase(f, 8, 38);
    const enter = phase(f, 24, 46);
    const size = 330 + (p.labelSize - 330) * move;
    body = (
      <>
        <div style={{ ...layer, top: 342 - 4 * move, left: 0, width: 1920, textAlign: 'center', fontFamily: FONT, fontWeight: 500, whiteSpace: 'nowrap', lineHeight: 1.15, fontSize: size, color: p.foreground }}>{p.numberLabel}</div>
        <div style={{ ...layer, left: 0, top: 476, width: 1920, height: p.titleSize * 1.15, overflow: 'hidden' }}>
          <div style={{ fontFamily: FONT, fontSize: p.titleSize, fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1.15, textAlign: 'center', transform: `translateY(${(1 - enter) * 110}%)`, color: p.foreground }}><TitleText text={p.title} /></div>
        </div>
      </>
    );
  } else if (kind === 'push') {
    const push = phase(f, 0, 44);
    body = (
      <div style={{ ...layer, inset: 0, background: '#000', clipPath: `inset(0 ${100 * (1 - push)}% 0 0)` }}>
        <div style={{ ...layer, left: (1920 - p.contentWidth) / 2, top: 392 }}><Copy p={p} color="#fff" subColor="#C9C9C9" /></div>
      </div>
    );
  } else {
    // C034 reveal：标题自下擦出；一条白条（反白层）随后收成编号胶囊，标题在条内反白
    const open = phase(f, 3, 30);
    const travel = phase(f, 36, 68);
    const top = 482, h = p.titleSize * 1.15;
    const badgeWidth = p.labelSize * 3.4 + 24;
    const badgeHeight = p.labelSize * 1.15 + 12;
    const barWidth = p.contentWidth + (badgeWidth - p.contentWidth) * travel;
    const barHeight = h * open + (badgeHeight - h) * travel;
    const barTop = top + h * (1 - open) + (344 - top) * travel;
    const barLeft = (1920 - barWidth) / 2;
    const text = (
      <>
        <div style={{ ...layer, left: 0, top: 350, width: 1920, textAlign: 'center', fontFamily: FONT, fontWeight: 500, whiteSpace: 'nowrap', lineHeight: 1.15, fontSize: p.labelSize }}>{p.numberLabel}</div>
        <div style={{ ...layer, left: (1920 - p.contentWidth) / 2, top, width: p.contentWidth, height: h, clipPath: `inset(${100 * (1 - open)}% 0 0 0)`, fontFamily: FONT, fontWeight: 600, whiteSpace: 'nowrap', lineHeight: 1.15, fontSize: p.titleSize, textAlign: 'center' }}><TitleText text={p.title} /></div>
      </>
    );
    body = (
      <>
        <div style={{ color: p.foreground }}>{text}</div>
        <div style={{ ...layer, left: barLeft, top: barTop, width: barWidth, height: barHeight, background: '#E6E6E6', overflow: 'hidden' }}>
          <div style={{ ...layer, left: -barLeft, top: -barTop, width: 1920, height: 1080, color: '#000' }}>{text}</div>
        </div>
      </>
    );
  }

  return (
    <AbsoluteFill style={{ background: p.background, fontFamily: FONT }}>
      <div style={{ ...layer, left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${width / 1920}, ${height / 1080})`, transformOrigin: 'top left' }}>
        {body}
      </div>
    </AbsoluteFill>
  );
};

export { clamp01 };
