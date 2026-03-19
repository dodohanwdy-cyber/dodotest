export default function Footer() {
  return (
    <footer className="w-full bg-zinc-50 border-t border-zinc-200 py-8 px-6">
      {/* 홍보 섹션 최상단으로 이동 */}
      <div className="max-w-7xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <a 
          href="https://www.opcl.kr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group block p-4 bg-white border border-zinc-200 rounded-2xl hover:border-primary/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-primary uppercase tracking-wider">Information Platform</p>
              <h5 className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors">
                2030을 위한 정보공유 플랫폼, <span className="text-primary">열고닫기</span>
              </h5>
            </div>
            <div className="p-1.5 bg-zinc-50 group-hover:bg-primary/5 rounded-full text-zinc-400 group-hover:text-primary transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </div>
          </div>
        </a>
        <a 
          href="https://www.opcl.kr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group block p-4 bg-white border border-zinc-200 rounded-2xl hover:border-primary/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-primary uppercase tracking-wider">Insight & Research</p>
              <h5 className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors">
                청년세대를 바라보는 인사이트, <span className="text-primary">열고닫기 리서치</span>
              </h5>
            </div>
            <div className="p-1.5 bg-zinc-50 group-hover:bg-primary/5 rounded-full text-zinc-400 group-hover:text-primary transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </div>
          </div>
        </a>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-5 col-span-1 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-sm text-white font-black shadow-lg shadow-blue-100">열</div>
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">열고닫기</h3>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mt-0.5">Official Partner of Youth Center</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-bold break-keep">
            청년들의 고민을 데이터로 분석하여 가장 필요한 정책으로 연결합니다. 
            AI 기반 상담 매칭 웹앱 '열고닫기'입니다.
          </p>
          <div className="pt-4 text-[10px] leading-5 text-slate-400 font-bold border-t border-slate-100 mt-4">
            <p>도도한콜라보 주식회사 | 대표자: 원규희 | 사업자번호: 462-88-01490</p>
            <p>서울특별시 영등포구 영등포로27길 7, 302호(당산동1가)</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">서비스</h4>
          <ul className="text-xs text-zinc-500 space-y-2 font-semibold">
            <li><a href="https://www.opcl.kr" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">열고닫기 플랫폼</a></li>
            <li><a href="#" className="hover:text-zinc-900 transition-colors">이용약관</a></li>
            <li><a href="#" className="hover:text-zinc-900 transition-colors">개인정보처리방침</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">고객지원</h4>
          <div className="text-xs text-zinc-500 space-y-2 font-semibold">
            <p className="flex items-center gap-2">
              <span className="text-zinc-400 text-[9px]">EMAIL</span> 
              <a href="mailto:helloworld@dodohancollabo.com" className="hover:text-zinc-900">helloworld@dodohancollabo.com</a>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-zinc-400 text-[9px]">TEL</span> 
              <span>070-4578-8635</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-8 pt-5 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">
          © 2026 OPCL. All rights reserved.
        </p>
        <div className="flex gap-6 items-center grayscale opacity-40 hover:opacity-100 transition-opacity">
          <img src="/logo_opcl.png" alt="OPCL Logo" className="h-3.5 object-contain" />
        </div>
      </div>
    </footer>
  );
}
