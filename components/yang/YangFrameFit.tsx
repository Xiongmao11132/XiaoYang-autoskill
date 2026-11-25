// YangFrameFit —— 本管线自研适配件（非原版源码）：Yang 组件按 1920×1080
// 设计坐标渲染，本包装器把整件等比缩放装进任意目标框（如 CollScene 的
// 1216×668 证据框），使 AbsoluteFill 型 Yang 组件可作框内覆盖层使用。
// 2026-10-30 首用于 ep-20261030-ai-jobs：MatchCut / HighlighterSweep /
// TerminalRun / StepChain 四件均经此包装入框，关键帧验证通过。
import React from 'react';

export const YangFrameFit: React.FC<{
  /** 目标框宽（px，组件设计宽按 designW 等比缩放至此） */
  width?: number;
  designW?: number;
  designH?: number;
  children: React.ReactNode;
}> = ({ width = 1216, designW = 1920, designH = 1080, children }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
    <div style={{
      position: 'absolute', left: 0, top: 0, width: designW, height: designH,
      transform: `scale(${width / designW})`, transformOrigin: '0 0',
    }}>{children}</div>
  </div>
);
