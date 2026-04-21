import React from 'react';
import { getAllDocs } from '@/lib/docs';
import Link from 'next/link';
import { FileText, ArrowRight, ShieldCheck, BookOpen, Settings, Database, Activity } from 'lucide-react';

export const metadata = {
  title: '기술 문서 센터 | 도도한 안심 상담',
  description: '프로젝트 개발 가이드, 기술 명세서 및 보안 점검 이력 문서 센터입니다.',
};

const iconMap: { [key: string]: any } = {
  'security': ShieldCheck,
  'tech': Settings,
  'manual': BookOpen,
  'db': Database,
  'audit': Activity,
};

function getIconForSlug(slug: string) {
  const s = slug.toLowerCase();
  if (s.includes('security') || s.includes('audit')) return iconMap['security'];
  if (s.includes('tech') || s.includes('dev')) return iconMap['tech'];
  if (s.includes('manual') || s.includes('guide')) return iconMap['manual'];
  if (s.includes('db') || s.includes('schema')) return iconMap['db'];
  return FileText;
}

export default function DocsListPage() {
  const docs = getAllDocs();

  return (
    <div className="min-h-screen bg-[#fafafa] py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mb-4 uppercase tracking-wider">
            Internal Documentation Center
          </div>
          <h1 className="text-4xl font-black text-zinc-900 mb-4 tracking-tight">
            기술 문서 센터
          </h1>
          <p className="text-zinc-500 text-lg leading-relaxed">
            도도한 안심 상담 서비스의 개발 가이드, 기획서 및 보안 점검 이력을 관리합니다.<br />
            모든 문서는 깃허브 실시간 데이터와 동기화됩니다.
          </p>
        </header>

        <div className="grid gap-4">
          {docs.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-zinc-100 text-center">
              <FileText className="mx-auto text-zinc-200 mb-4" size={48} />
              <p className="text-zinc-400">등록된 문서가 아직 없습니다.</p>
            </div>
          ) : (
            docs.map((doc: any) => {
              const Icon = getIconForSlug(doc.slug);
              return (
                <Link 
                  key={doc.slug} 
                  href={`/docs/${doc.slug}`}
                  className="group bg-white p-8 rounded-[2.5rem] border border-zinc-100 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex items-start justify-between"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-zinc-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0">
                      <Icon className="text-zinc-400 group-hover:text-blue-500 transition-colors" size={28} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-zinc-900 group-hover:text-blue-600 transition-colors tracking-tight">
                        {doc.title}
                      </h3>
                      <p className="text-zinc-500 text-sm leading-relaxed max-w-xl">
                        {doc.description}
                      </p>
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest bg-zinc-50 px-2 py-0.5 rounded-md">
                          {doc.slug}.md
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 group-hover:bg-blue-600 flex items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 shadow-lg group-hover:shadow-blue-500/30 flex-shrink-0">
                    <ArrowRight className="text-zinc-300 group-hover:text-white" size={20} />
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <footer className="mt-16 pt-8 border-t border-zinc-100">
          <p className="text-xs text-zinc-300 text-center">
            &copy; 2026 Dodohan Admin Panel. All Security Audit Documents are Synchronized via GitHub.
          </p>
        </footer>
      </div>
    </div>
  );
}
