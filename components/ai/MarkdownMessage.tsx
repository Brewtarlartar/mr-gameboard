'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  children: string;
  className?: string;
}

export default function MarkdownMessage({ children, className = '' }: Props) {
  return (
    <div className={`prose prose-invert prose-sm max-w-none text-stone-200 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-stone-200">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-amber-200">{children}</strong>,
          em: ({ children }) => <em className="text-stone-100">{children}</em>,
          h1: ({ children }) => <h1 className="text-lg font-bold text-stone-100 mt-3 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-stone-100 mt-3 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-stone-100 mt-2 mb-1">{children}</h3>,
          code: ({ children }) => (
            <code className="bg-stone-800 text-amber-200 px-1 py-0.5 rounded text-xs">{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-amber-500/40 pl-3 my-2 text-stone-300">{children}</blockquote>
          ),
          hr: () => <hr className="border-stone-700 my-3" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
