// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/9db3f6625112/src/BatchA.tsx (N003)
// 用途：多条问句挤成疑问墙后被答案推开：问题卡成墙，答案面板自中心长出把墙推向两侧（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, clamp01 } from '../src/theme';

const ez = (x: number) => 1 - Math.pow(1 - x, 3);
const eob = (x: number) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const seg = (t: number, a: number, b: number) => ez(clamp01((t - a) / (b - a)));
const isUrl = (s: string) => /^(https?:|data:|blob:)/.test(s);
const srcOf = (s: string) => (isUrl(s) ? s : staticFile(s));

const Stage: React.FC<{ background?: string; children: React.ReactNode }> = ({ background = C.base, children }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background, overflow: 'hidden', fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${width / 1920}, ${height / 1080})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

const MediaImg: React.FC<{ src?: string; label?: string; style?: React.CSSProperties }> = ({ src, label = '示例画面', style }) =>
  src ? (
    <Img src={srcOf(src)} style={{ objectFit: 'cover', ...style }} />
  ) : (
    <div style={{ background: 'linear-gradient(135deg,#232B36,#141920)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 30, ...style }}>
      {label}
    </div>
  );

export type YangQuestionWallProps = {
  questions: string[];
  answer: string;
  startSec?: number;
  answerAtSec?: number;
  accent?: string;
  background?: string;
};

export const YangQuestionWall: React.FC<YangQuestionWallProps> = ({
  questions, answer, startSec = 0.3, answerAtSec = 1.7, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cols = 3, cw = 500, ch = 200, gx = 34, gy = 30;
  const rowsN = Math.ceil(questions.length / cols);
  const gridW = cols * cw + (cols - 1) * gx, gridH = rowsN * ch + (rowsN - 1) * gy;
  const x0 = (1920 - gridW) / 2, y0 = (1080 - gridH) / 2;
  const ap = seg(t, answerAtSec, answerAtSec + 0.65);
  return (
    <Stage background={background}>
      {questions.map((q, i) => {
        const p = spring({ frame, fps, delay: Math.round((startSec + i * 0.09) * fps), config: { damping: 16, stiffness: 160 } });
        const cx = x0 + (i % cols) * (cw + gx) + cw / 2, cy = y0 + Math.floor(i / cols) * (ch + gy) + ch / 2;
        const push = ap * (cx < 960 ? -1 : 1) * (80 + Math.abs(cx - 960) * 0.05);
        return (
          <div key={i} style={{ position: 'absolute', left: cx - cw / 2, top: cy - ch / 2, width: cw, height: ch, borderRadius: 18, background: C.surface, border: `1px solid ${C.hair}`, opacity: p * (1 - 0.45 * ap), transform: `translateX(${push}px) rotate(${ap * (cx < 960 ? -3 : 3)}deg) scale(${0.7 + 0.3 * p})`, padding: '26px 30px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 34, color: accent, fontWeight: 800 }}>?</div>
            <div style={{ fontSize: 36, color: C.text, marginTop: 8 }}>{q}</div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 860, transform: `translate(-50%,-50%) scale(${0.5 + 0.5 * eob(ap)})`, opacity: ap, background: accent, borderRadius: 22, padding: '54px 60px', boxShadow: '0 40px 100px rgba(0,0,0,0.55)', zIndex: 5 }}>
        <div style={{ fontSize: 30, color: C.dark, fontWeight: 700, letterSpacing: 4 }}>答案</div>
        <div style={{ fontSize: 56, color: C.dark, fontWeight: 700, marginTop: 14, lineHeight: 1.3 }}>{answer}</div>
      </div>
    </Stage>
  );
};
