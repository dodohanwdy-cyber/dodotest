export default function Footer() {
  return (
    <footer className="w-full bg-zinc-50 border-t border-zinc-200 py-4 sm:py-5 px-3.5 sm:px-6">
      {/* 1. 슬림 인라인 캡슐 배너 */}
      <div className="max-w-7xl mx-auto mb-3.5 flex flex-col sm:flex-row items-center gap-2">
        <a 
          href="https://www.opcl.kr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full sm:w-auto flex-1 flex items-center justify-between px-3.5 py-2 bg-white border border-zinc-200/80 rounded-xl hover:border-primary/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-primary bg-blue-50 px-1.5 py-0.5 rounded uppercase">Platform</span>
            <span className="text-xs font-bold text-zinc-800 group-hover:text-primary transition-colors">
              2030 정보공유 플랫폼, <strong>열고닫기</strong>
            </span>
          </div>
          <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
        </a>
        <a 
          href="https://www.dodohancollabo.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full sm:w-auto flex-1 flex items-center justify-between px-3.5 py-2 bg-white border border-zinc-200/80 rounded-xl hover:border-primary/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-primary bg-blue-50 px-1.5 py-0.5 rounded uppercase">Insight</span>
            <span className="text-xs font-bold text-zinc-800 group-hover:text-primary transition-colors">
              청년세대 인사이트, <strong>열고닫기 리서치</strong>
            </span>
          </div>
          <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
        </a>
      </div>

      {/* 2. 회사 법적 정보 및 링크 (슬림 1~2줄 통합) */}
      <div className="max-w-7xl mx-auto pt-3 border-t border-zinc-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-[10px] sm:text-[11px] text-zinc-400 font-medium">
        <div className="space-y-0.5 leading-relaxed">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-bold text-zinc-600">도도한콜라보(주)</span>
            <span>대표: 원규희</span>
            <span>사업자번호: 462-88-01490</span>
            <span>TEL: 070-4578-8635</span>
            <span>EMAIL: <a href="mailto:helloworld@dodohancollabo.com" className="hover:text-zinc-600 underline">helloworld@dodohancollabo.com</a></span>
          </p>
          <p className="text-zinc-400 hidden sm:block">서울특별시 영등포구 영등포로27길 7, 302호(당산동1가)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 text-zinc-400 font-semibold pt-1 md:pt-0">
          <a href="#" className="hover:text-zinc-700 transition-colors">이용약관</a>
          <span>·</span>
          <a href="#" className="hover:text-zinc-700 transition-colors font-bold text-zinc-600">개인정보처리방침</a>
          <span>·</span>
          <span className="font-mono text-zinc-400">© 2026 OPCL</span>
        </div>
      </div>
    </footer>
  );
}
