"use client";

import React from "react";
// @ts-ignore
import katex from "katex";
import "katex/dist/katex.min.css";

// インライン数式 ($...$) を安全に描画するサブパーツ
const InlineMath = ({ math }: { math: string }) => {
  try {
    const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (error) {
    return <span>{math}</span>;
  }
};

// ブロック数式 ($$...$$) を安全に描画するサブパーツ
const BlockMath = ({ math }: { math: string }) => {
  try {
    const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (error) {
    return <div>{math}</div>;
  }
};

interface LatexRendererProps {
  text: string;
  mounted: boolean;
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({ text, mounted }) => {
  if (!text) return null;
  
  // ハイドレーションエラーを防ぐため、マウントされるまでは素のテキストを返す
  if (!mounted) {
    return <span className="font-mono text-xs opacity-75">{text}</span>;
  }

  // $$（ブロック）と $（インライン）でテキストをスプリットする
  const parts = text.split(/(\$\$[\s\S]*?\ExternalLink\$\$|\$.*?\$)/g);

  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const formula = part.slice(2, -2);
          return <BlockMath key={i} math={formula} />;
        } else if (part.startsWith("$") && part.endsWith("$")) {
          const formula = part.slice(1, -1);
          return <InlineMath key={i} math={formula} />;
        }
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </span>
  );
};