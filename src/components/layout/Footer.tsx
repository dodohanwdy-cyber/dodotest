export default function Footer() {
  return (
    <footer className="w-full bg-zinc-50 border-t border-zinc-200 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-6 col-span-1 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-lg text-white font-black shadow-xl shadow-blue-100">열</div>
            <div className="flex flex-col">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">열고닫기</h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mt-0.5">Official Partner of Youth Center</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-bold break-keep">
            청년들의 고민을 데이터로 분석하여 가장 필요한 정책으로 연결합니다. 
            청년센터와 함께하는 AI 기반 상담 매칭 웹앱 '열고닫기'입니다.
          </p>
          <div className="pt-6 text-[11px] leading-6 text-slate-400 font-bold border-t border-slate-100 mt-6">
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
