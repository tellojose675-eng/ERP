import React from 'react';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  const lines = content.split('\n');

  const parseInline = (text: string) => {
    // Reemplaza **bold**, `code`, *italic*
    const parts: (string | JSX.Element)[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-semibold text-slate-900 dark:text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-300 font-mono text-xs"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={match.index} className="italic">{token.slice(1, -1)}</em>);
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Headers
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2">
              {parseInline(trimmed.slice(5))}
            </h4>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1">
              {parseInline(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-bold text-slate-900 dark:text-white mt-3 mb-1 border-b border-slate-200 dark:border-slate-800 pb-1">
              {parseInline(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-xl font-extrabold text-slate-900 dark:text-white mt-3 mb-1">
              {parseInline(trimmed.slice(2))}
            </h1>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <div
              key={idx}
              className="pl-3 py-1 my-1 border-l-4 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-r-lg text-xs text-indigo-900 dark:text-indigo-200"
            >
              {parseInline(trimmed.slice(2))}
            </div>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-sky-500 dark:text-sky-400 mt-1 font-bold">•</span>
              <span className="flex-1">{parseInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-sky-600 dark:text-sky-400 font-semibold text-xs min-w-[1.2rem]">
                {numMatch[1]}.
              </span>
              <span className="flex-1">{parseInline(numMatch[2])}</span>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-slate-700 dark:text-slate-300">
            {parseInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
