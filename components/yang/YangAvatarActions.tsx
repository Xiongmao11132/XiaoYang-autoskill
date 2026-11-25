// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/9db3f6625112/src/RebuiltN037.tsx (N037)
// 用途：头像先脉冲，三个行动图标依次跳出：头像圆盘带脉冲环落位，行动片沿弧线逐个跳出并连线（A 类提炼件：只取视觉机制、用本库参数化实现重写；文案/数字/图片走 props，原版字体/音效/素材未集成）
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

export type YangAvatarActionsProps = {
  avatar?: string;
  actions: string[];
  startSec?: number;
  gapSec?: number;
  accent?: string;
  background?: string;
};

export const YangAvatarActions: React.FC<YangAvatarActionsProps> = ({
  avatar, actions, startSec = 0.3, gapSec = 0.38, accent = C.brass, background = C.base,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const intro = spring({ frame, fps, delay: Math.round(startSec * fps), config: { damping: 14, stiffness: 160 } });
  const pulse = (t * 0.7) % 1;
  const cx = 620, cy = 540, R = 330;
  const angles = [-52, 0, 52];
  return (
    <Stage background={background}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {actions.slice(0, 3).map((_, i) => {
          const a = (angles[i] * Math.PI) / 180;
          const x2 = cx + Math.cos(a) * R, y2 = cy + Math.sin(a) * R;
          const draw = seg(t, startSec + 0.5 + i * gapSec, startSec + 0.8 + i * gapSec);
          return <line key={i} x1={cx + Math.cos(a) * 120} y1={cy + Math.sin(a) * 120} x2={cx + Math.cos(a) * (120 + (R - 120) * draw)} y2={cy + Math.sin(a) * (120 + (R - 120) * draw)} stroke={C.panel} strokeWidth={4} />;
        })}
      </svg>
      <div style={{ position: 'absolute', left: cx, top: cy, width: 240, height: 240, borderRadius: '50%', border: `2px solid ${accent}`, transform: `translate(-50%,-50%) scale(${1 + pulse * 0.5})`, opacity: (1 - pulse) * 0.7 }} />
      <div style={{ position: 'absolute', left: cx - 120, top: cy - 120, width: 240, height: 240, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${accent}`, transform: `scale(${intro})`, boxShadow: '0 30px 80px rgba(0,0,0,0.5)', zIndex: 3 }}>
        <MediaImg src={avatar} label="头像" style={{ width: '100%', height: '100%' }} />
      </div>
      {actions.slice(0, 3).map((a, i) => {
        const ang = (angles[i] * Math.PI) / 180;
        const x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R;
        const p = spring({ frame, fps, delay: Math.round((startSec + 0.55 + i * gapSec) * fps), config: { damping: 11, stiffness: 200, mass: 0.8 } });
        return (
          <div key={i} style={{ position: 'absolute', left: x + 130, top: y, transform: `translateY(-50%) scale(${Math.max(0, p)})`, background: accent, color: C.dark, borderRadius: 999, padding: '22px 42px', fontSize: 42, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>{a}</div>
        );
      })}
    </Stage>
  );
};
