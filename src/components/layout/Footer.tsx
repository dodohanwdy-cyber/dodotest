export default function Footer() {
  return (
    <footer className="w-full bg-zinc-50 border-t border-zinc-200 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-6 col-span-1 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-sm text-white font-bold shadow-lg shadow-blue-100">열</div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">열고닫기</h3>
          </div>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-medium">
            청년들의 목소리를 데이터로 분석하여 실질적인 정책 수혜로 연결합니다. 
            AI 기반 상담 지능화 서비스 '열고닫기'가 더 나은 미래를 만듭니다.
          </p>
          <div className="pt-4 text-[11px] leading-6 text-zinc-400 font-medium border-t border-zinc-100/50 mt-6">
            <p>도도한콜라보 주식회사 | 대표자: 원규희</p>
            <p>사업자등록번호: 462-88-01490</p>
            <p>서울특별시 영등포구 영등포로27길 7, 302호(당산동1가)</p>
          </div>
        </div>
        
        <div className="space-y-5">
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">서비스</h4>
          <ul className="text-sm text-zinc-500 space-y-3 font-semibold">
            <li><a href="https://www.opcl.kr" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors">열고닫기 플랫폼</a></li>
            <li><a href="#" className="hover:text-zinc-900 transition-colors">이용약관</a></li>
            <li><a href="#" className="hover:text-zinc-900 transition-colors">개인정보처리방침</a></li>
          </ul>
        </div>

        <div className="space-y-5">
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">고객지원</h4>
          <div className="text-sm text-zinc-500 space-y-3 font-semibold">
            <p className="flex items-center gap-2">
              <span className="text-zinc-400">EMAIL</span> 
              <a href="mailto:helloworld@dodohancollabo.com" className="hover:text-zinc-900">helloworld@dodohancollabo.com</a>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-zinc-400">TEL</span> 
              <span>070-4578-8635</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[11px] text-zinc-400 font-bold tracking-widest uppercase">
          © 2026 OPCL. All rights reserved.
        </p>
        <div className="flex gap-6 items-center grayscale opacity-40 hover:opacity-100 transition-opacity">
          <img src="/logo_opcl.png" alt="OPCL Logo" className="h-4 object-contain" />
        </div>
      </div>
    </footer>
  );
}
