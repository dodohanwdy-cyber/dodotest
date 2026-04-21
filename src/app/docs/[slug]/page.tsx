'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Share2, Printer, ChevronRight } from 'lucide-react';

export default function DocDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDoc() {
      try {
        const response = await fetch(`/api/docs?slug=${slug}`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
        } else {
          setContent('# 해당 문서를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('Failed to fetch doc:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDoc();
  }, [slug]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 상단 네비게이션 */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/docs"
              className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 overflow-hidden text-ellipsis whitespace-nowrap">
              <span>Docs</span>
              <ChevronRight size={14} />
              <span className="text-zinc-600 truncate">{slug}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
              title="인쇄하기"
            >
              <Printer size={20} />
            </button>
            <button 
              className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
              title="링크 복사"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('링크가 복사되었습니다.');
              }}
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        <article className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || ''}
          </ReactMarkdown>
        </article>
      </main>

      <style jsx global>{`
        .markdown-body {
          font-family: inherit;
          line-height: 1.8;
          color: #1a1a1a;
        }
        .markdown-body h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 2.5rem;
          margin-top: 0;
          line-height: 1.2;
          letter-spacing: -0.025em;
          border-bottom: 1px solid #f1f1f1;
          padding-bottom: 1.5rem;
        }
        .markdown-body h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-top: 3.5rem;
          margin-bottom: 1.5rem;
          letter-spacing: -0.015em;
        }
        .markdown-body h3 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }
        .markdown-body p {
          margin-bottom: 1.25rem;
        }
        .markdown-body ul, .markdown-body ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        .markdown-body li {
          margin-bottom: 0.5rem;
        }
        .markdown-body table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }
        .markdown-body th {
          background: #f9fafb;
          font-weight: 700;
          text-align: left;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
        }
        .markdown-body td {
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
        }
        .markdown-body blockquote {
          border-left: 4px solid #3b82f6;
          background: #eff6ff;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border-radius: 0 1rem 1rem 0;
          color: #1e40af;
        }
        .markdown-body code {
          background: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.4rem;
          font-family: monospace;
          font-size: 0.9em;
          color: #ef4444;
        }
        .markdown-body pre {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 1.5rem;
          border-radius: 1rem;
          overflow-x: auto;
          margin-bottom: 2rem;
        }
        .markdown-body pre code {
          background: none;
          color: inherit;
          padding: 0;
        }
        @media print {
          nav { display: none; }
          .markdown-body h2 { margin-top: 2rem; }
        }
      `}</style>
    </div>
  );
}
