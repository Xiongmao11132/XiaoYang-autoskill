// Adapted from FredTalk (https://github.com/njrhts2kvv-star/FredTalk), MIT License. Source: components/projects/news-keyword-match-cut-20261010/news-keyword-match-cut/src/NewsKeywordMatchCut.tsx
// 用途：新闻关键词快闪（NMC01）——同一关键词在多张新闻版式图之间字形锚点对齐、硬切快闪，最后定格放大。
import React from 'react';
import { AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, clamp01 } from '../src/theme';

export type YangMatchPage = {
  /** 版式图路径（public 相对路径或完整 URL）；不传时用 headline/kicker 渲染占位版式 */
  src?: string;
  headline?: string;
  kicker?: string;
  durationInFrames: number;
};

export type YangNewsKeywordMatchCutProps = {
  keyword: string;
  pages: YangMatchPage[];
  /** 笔刷色（组件标志性视觉，默认原版黄色笔刷） */
  brushColor?: string;
  background?: string;
  textColor?: string;
  /** 可选音效（完整 URL 或 public 路径）；默认不传 = 静音。原包 TextMatchCut 快门音效为 GPL-3.0，已剔除，禁止再引用。 */
  sfxSrc?: string;
  sfxVolume?: number;
};

const isUrl = (s: string) => /^(https?:|data:|blob:)/.test(s);

/** 在文本中把 keyword 包上笔刷高亮 span */
const Highlighted: React.FC<{ text: string; keyword: string; brushColor: string; progress: number }> = ({ text, keyword, brushColor, progress }) => {
  const idx = keyword ? text.indexOf(keyword) : -1;
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ position: 'relative', display: 'inline-block', fontWeight: 800 }}>
        <span
          style={{
            position: 'absolute', left: -8, right: -10, top: '8%', bottom: '2%',
            background: brushColor, opacity: 0.75, mixBlendMode: 'multiply',
            borderRadius: '14px 6px 12px 5px / 8px 14px 6px 12px',
            transformOrigin: 'left center', transform: `scaleX(${progress})`,
          }}
        />
        <span style={{ position: 'relative' }}>{keyword}</span>
      </span>
      {text.slice(idx + keyword.length)}
    </>
  );
};

export const YangNewsKeywordMatchCut: React.FC<YangNewsKeywordMatchCutProps> = ({
  keyword,
  pages,
  brushColor = '#FFE949',
  background = C.base,
  textColor = C.text,
  sfxSrc,
  sfxVolume = 0.7,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (!pages.length || pages.some((p) => !Number.isInteger(p.durationInFrames) || p.durationInFrames <= 0)) {
    throw new Error('YangNewsKeywordMatchCut requires pages with positive integer frame durations');
  }
  let cursor = 0;
  let pageIndex = pages.length - 1;
  let local = pages[pageIndex].durationInFrames - 1;
  for (let i = 0; i < pages.length; i++) {
    if (frame < cursor + pages[i].durationInFrames) { pageIndex = i; local = frame - cursor; break; }
    cursor += pages[i].durationInFrames;
  }
  const page = pages[pageIndex];
  const isLast = pageIndex === pages.length - 1;
  // 每页轻微放大（原版 pipeline 的 zoom 手感）；末页定格再推近一点
  const zoom = interpolate(local, [0, Math.max(1, page.durationInFrames - 1)], [1, isLast ? 1.07 : 1.03], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sweep = clamp01(local / 6);

  return (
    <AbsoluteFill style={{ background, fontFamily: FONT, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '50% 42%' }}>
        {page.src ? (
          <Img src={isUrl(page.src) ? page.src : staticFile(page.src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          // 占位版式：无图时用排版卡呈现同一关键词（锚点位置恒定，模拟字形对齐）
          <div style={{ position: 'absolute', left: width * 0.14, top: height * 0.14, width: width * 0.72, height: height * 0.72, background: '#F4F1EA', borderRadius: 18, boxShadow: '0 30px 80px rgba(0,0,0,.45)', padding: '54px 64px', color: '#1D1D1F' }}>
            <div style={{ fontSize: 24, letterSpacing: 6, color: '#8A8A8A', borderBottom: '2px solid #E4E0D6', paddingBottom: 16 }}>{page.kicker ?? '新闻版式 · 占位'}</div>
            <div style={{ fontSize: 62, lineHeight: 1.45, fontWeight: 600, marginTop: 34 }}>
              <Highlighted text={page.headline ?? `今日${keyword}成为头条`} keyword={keyword} brushColor={brushColor} progress={sweep} />
            </div>
            <div style={{ fontSize: 30, lineHeight: 1.9, color: '#5A5A5A', marginTop: 28 }}>
              多家媒体在同一天报道了这件事，版式各不相同，但读者第一眼都会先看到同一个词。
            </div>
          </div>
        )}
      </div>
      {/* 当前页关键词锚点提示（有图模式下也保证关键词可读） */}
      {page.src ? (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: height * 0.07, textAlign: 'center', fontSize: 44, fontWeight: 800, color: textColor, textShadow: '0 4px 24px rgba(0,0,0,.6)' }}>
          <Highlighted text={keyword} keyword={keyword} brushColor={brushColor} progress={sweep} />
        </div>
      ) : null}
      {sfxSrc ? <Audio src={isUrl(sfxSrc) ? sfxSrc : staticFile(sfxSrc)} volume={sfxVolume} /> : null}
    </AbsoluteFill>
  );
};
