"use client";

import { useState } from "react";
import { User, MapPin, Briefcase, Heart, Star, ChevronRight, Info, AlertCircle, X, ChevronDown, CheckCircle2 } from "lucide-react";

export default function BasicInfoForm({ data, onNext }: { data: any, onNext: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: data?.name || "",
    age: data?.age || "",
    gender: data?.gender || "male",
    regional_local_government: data?.regional_local_government || "서울특별시",
    basic_local_government: data?.basic_local_government || "",
    job_status: data?.job_status || "취업준비생",
    income_level: data?.income_level || "없음",
    education_level: "",
    marital_statues: "",
    interest_areas: Array.isArray(data?.interest_areas) ? data.interest_areas : [] as string[],
    benefited_policy: data?.benefited_policy || "",
    special_notes: Array.isArray(data?.special_notes) ? data.special_notes : [] as string[],
  });

  const [showBenefitedInput, setShowBenefitedInput] = useState(!!formData.benefited_policy);
  const [showIncomeInfo, setShowIncomeInfo] = useState(false);
  const [toast, setToast] = useState<string>("");

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const regions = ["서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시", "광주광역시", "대전광역시", "울산광역시", "세종특별자치시", "강원도", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도"];
  
  const jobStatuses = [
    { label: "취업준비생", emoji: "🎓" },
    { label: "대학생/대학원생", emoji: "🏫" },
    { label: "신입사원 (1년 미만)", emoji: "🌱" },
    { label: "재직자", emoji: "💼" },
    { label: "이직 준비 중", emoji: "🔄" },
    { label: "자영업자/창업자", emoji: "🏪" },
    { label: "프리랜서", emoji: "💻" },
    { label: "무직", emoji: "🏠" }
  ];
  
  const interestAreas = [
    { label: "주거 (청년주택, 전세자금 등)", emoji: "🏠" },
    { label: "일자리 (취업지원, 창업 지원)", emoji: "💼" },
    { label: "금융 (자산형성, 대출 지원)", emoji: "💰" },
    { label: "문화/예술 지원", emoji: "🎨" },
    { label: "복지/건강 케어", emoji: "🏥" },
    { label: "교육/역량 강화", emoji: "📚" }
  ];
  
  const specialNotes = ["군복무 중/예정", "장애인", "다문화가정", "한부모가정", "탈가정청년", "자립준비청년", "고립은둔청년", "저소득층"];

  const toggleArrayItem = (key: "interest_areas" | "special_notes", value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter((item: string) => item !== value)
        : [...prev[key], value]
    }));
  };

  return (
    <div className="space-y-10 py-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* 기본 정보 */}
        <div className="group space-y-4">
          <label className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <User size={18} />
            </span>
            기본 인적사항
          </label>
          <div className="flex gap-3">
            <div className="flex-[2] relative">
              <input 
                type="text" 
                placeholder="성함"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-primary outline-none transition-all text-sm font-bold placeholder:text-slate-300"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="flex-1 relative">
              <input 
                type="number" 
                placeholder="만 나이"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-primary outline-none transition-all text-sm font-bold placeholder:text-slate-300"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">세</span>
            </div>
          </div>
        </div>

        {/* 성별 */}
        <div className="space-y-4">
          <label className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
             <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-bold">W/M</span>
             성별
          </label>
          <div className="flex gap-3">
            {[
              { id: "male", label: "남성", icon: "👨‍💼" },
              { id: "female", label: "여성", icon: "👩‍💼" }
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setFormData({...formData, gender: g.id})}
                className={`flex-1 py-4 rounded-2xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                  formData.gender === g.id 
                    ? "bg-primary text-white border-primary shadow-xl shadow-blue-100 scale-[1.02]" 
                    : "bg-white border-slate-200 text-slate-500 hover:border-blue-200"
                }`}
              >
                <span>{g.icon}</span> {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 거주지 */}
        <div className="space-y-4 md:col-span-2">
          <label className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
              <MapPin size={18} />
            </span>
            활동 지역
          </label>
          <div className="flex flex-col md:flex-row gap-3">
            <select 
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer"
              value={formData.regional_local_government}
              onChange={(e) => setFormData({...formData, regional_local_government: e.target.value})}
            >
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input 
              type="text" 
              placeholder="상세 지역 (예: 영등포구, 수원시 영통구 등)"
              className="flex-[2] bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none text-sm font-bold placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all border-slate-100"
              value={formData.basic_local_government}
              onChange={(e) => setFormData({...formData, basic_local_government: e.target.value})}
            />
          </div>
        </div>

        {/* 취업 상태 */}
        <div className="space-y-4">
          <label className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
              <Briefcase size={18} />
            </span>
            현재 상태
          </label>
          <select 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer"
            value={formData.job_status}
            onChange={(e) => setFormData({...formData, job_status: e.target.value})}
          >
            {jobStatuses.map(s => <option key={s.label} value={s.label}>{s.emoji} {s.label}</option>)}
          </select>
        </div>

        {/* 소득 수준 */}
        <div className="space-y-4 group">
          <label className="text-sm font-black text-slate-800 flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
                <Heart size={18} />
              </span>
              소득 구간 (월평균)
            </div>
          </label>
          
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                  <Info size={14} className="text-blue-500" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">어떤 걸 골라야 할지 헷갈리시나요?</p>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                    청년 정책 지원 기준이 되는 소득 비율입니다. 정확한 소득이 헷갈리신다면 
                    건강보험료 금액으로도 대략적인 확인이 가능합니다.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowIncomeInfo(true)}
                className="w-full text-[13px] font-black text-primary bg-blue-50/50 py-3 rounded-xl border border-blue-100 shadow-sm hover:bg-primary hover:text-white hover:border-primary hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                💡 [필독] 나의 정확한 소득 구간 알아보기
              </button>
            </div>
          </div>

          <select 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer"
            value={formData.income_level}
            onChange={(e) => setFormData({...formData, income_level: e.target.value})}
          >
            <option value="없음">💰 소득 없음 (개인 소득 및 납부 건보료 없음)</option>
            <option value="50% 이하">📉 가구 소득 50% 이하</option>
            <option value="100% 이하">📊 가구 소득 100% 이하</option>
            <option value="150% 이하">📈 가구 소득 150% 이하</option>
            <option value="150% 초과">💎 가구 소득 150% 초과</option>
          </select>
        </div>
      </div>

      {/* 관심 분야 (멀티 체크) */}
      <div className="space-y-4">
        <label className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
            <Star size={18} />
          </span>
          가장 알고 싶은 정책 (중복 가능)
        </label>
        <div className="flex flex-wrap gap-3">
          {interestAreas.map((area) => (
            <button
              key={area.label}
              onClick={() => toggleArrayItem("interest_areas", area.label)}
              className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all border flex items-center gap-2 ${
                formData.interest_areas.includes(area.label)
                  ? "bg-primary border-primary text-white shadow-xl shadow-blue-100 scale-105"
                  : "bg-white border-slate-200 text-slate-500 hover:border-primary/30"
              }`}
            >
              <span>{area.emoji}</span> {area.label}
            </button>
          ))}
        </div>
      </div>

      {/* 혜택 본 정책 (토글) */}
      <div className="space-y-4">
        <button 
          onClick={() => setShowBenefitedInput(!showBenefitedInput)}
          className="flex items-center gap-2 text-sm font-black text-slate-500 hover:text-primary transition-colors"
        >
          <span className={`transition-transform duration-300 ${showBenefitedInput ? "rotate-90" : ""}`}>
            <ChevronRight size={18} />
          </span>
          내가 혜택을 받았던 정책이 있다면 적어주세요 (선택)
        </button>
        
        {showBenefitedInput && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <textarea 
              placeholder="예: 청년수당 6개월 수급, 버팀목 전세자금 대출 이용 중 등"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none text-sm font-bold placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all min-h-[100px] resize-none"
              value={formData.benefited_policy}
              onChange={(e) => setFormData({...formData, benefited_policy: e.target.value})}
            />
          </div>
        )}
      </div>

      {/* 특수 상황 (멀티 체크) */}
      <div className="space-y-4 pt-4 border-t border-slate-50">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-black text-slate-800">혹시 해당되시는 특별한 상황이 있나요?</label>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold bg-slate-50 px-3 py-1.5 rounded-full">
            <AlertCircle size={14} /> 선택 사항
          </div>
        </div>
        
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 mb-4">
          <p className="text-xs text-amber-700 font-bold leading-relaxed flex gap-2">
            <span>✨</span> 
            <span>민감한 내용은 여기서 선택하지 않고, 나중에 <b>AI 채팅</b>에서 상담사에게만 더 자세히 말씀해 주셔도 괜찮아요.</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {specialNotes.map((note) => (
            <button
              key={note}
              onClick={() => toggleArrayItem("special_notes", note)}
              className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                formData.special_notes.includes(note)
                  ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
              }`}
            >
              {note}
            </button>
          ))}
        </div>
      </div>

      {/* 토스트 메시지 */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-3">
            <AlertCircle size={20} className="flex-shrink-0" />
            <span className="font-bold text-sm">{toast}</span>
          </div>
        </div>
      )}

      {/* 소득 구간(중위소득/건보료) 정보 모달 + 쉬운 용어 가이드 */}
      {showIncomeInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowIncomeInfo(false)} />
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 md:p-8 relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => setShowIncomeInfo(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors z-20"
            >
              <X size={20} />
            </button>
            
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-5 shadow-inner">
              <Info size={24} />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-2 mt-1">나의 진단 소득 구간 알아보기</h3>
            <p className="text-xs text-slate-500 font-bold mb-6 leading-relaxed">
              정책 신청에 가장 기본이 되는 정보입니다. 아래 가이드와 기준표를 참고해 선택해 보세요.
            </p>

            {/* 용어 설명 카드 영역 */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 space-y-3">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={12} className="text-primary" /> 알기 쉬운 용어 사전
              </h4>
              <div className="grid gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-black text-slate-800 block mb-1">💸 실수령액 vs 세전 소득</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    통장에 실제로 찍히는 돈이 <b>'실수령액'</b>입니다. 하지만 정책 기준은 보통 여기서 <b>세금을 떼기 전의 원래 금액인 '세전 소득'</b>을 기준으로 합니다. (통장 입금액에 약 10~15%를 더한 금액)
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-xs font-black text-slate-800 block mb-1">🏥 건강보험 납부액 (건보료)</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    매달 월급이나 소득에서 나가는 건강보험 요금입니다. 건보료는 내 소득에 비례해서 나오기 때문에, <b>내 소득을 정확히 모를 땐 납부하는 건보료 금액으로 소득 구간을 유추</b>할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 내 소득 확인 꿀팁 (토글) */}
            <details className="bg-blue-50/40 rounded-2xl border border-blue-100 md:mb-6 mb-8 group overflow-hidden">
              <summary className="p-4 cursor-pointer text-sm font-black text-primary flex items-center justify-between hover:bg-blue-50/80 transition-colors select-none">
                <span className="flex items-center gap-2">💡 답답했던 내 소득, 여기서 1분 만에 확인하세요!</span>
                <ChevronDown size={18} className="text-blue-400 group-open:rotate-180 transition-transform duration-300" />
              </summary>
              <div className="p-4 pt-0 border-t border-blue-100/50 mt-1 space-y-4">
                <div className="pt-2">
                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold mb-1">방법 1</span>
                  <h5 className="text-xs font-black text-slate-800 mb-1">앱(App)으로 즉시 열람하기 (가장 쉽고 빠름)</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    • <b>토스(Toss), 모바일 뱅킹 등</b>: 전체 메뉴에서 [내 소득/건강보험료 확인]을 누르면 간편인증만으로 확인됩니다.<br/>
                    • <b>The건강보험 앱</b>: [민원요기요] &gt; [증명서 확인] 메뉴 이용.
                  </p>
                </div>
                <div className="pt-1">
                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold mb-1">방법 2</span>
                  <h5 className="text-xs font-black text-slate-800 mb-1">알바/프리랜서 계산법</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    명세서 없이 한 달 동안 받은 입금액(실수령액)에 <b>약 3.4%를 곱해 더하면</b> 대략적인 세전 소득이 됩니다.
                  </p>
                </div>
                <div className="pt-1">
                  <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold mb-1">참고</span>
                  <h5 className="text-xs font-black text-slate-800 mb-1">저는 현재 무직/취준생이에요</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    부모님 밑으로 건보료가 들어가는 피부양자이고, 본인 명의의 알바/근로 소득이 0원이라면 최상단의 <b>[소득 없음 (0원)]</b>을 선택하시면 됩니다.
                  </p>
                </div>
              </div>
            </details>

            <div className="space-y-6">
              {/* 월소득 기준표 */}
              <div>
                <h4 className="text-[13px] font-black text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> 가구별 월소득 기준표 (세전)
                </h4>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-3">가구원 수</th>
                        <th className="p-3">기준 중위소득 100%</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-slate-700">
                      <tr className="border-b border-slate-100"><td className="p-3 bg-white">1인 가구</td><td className="p-3 bg-white">2,564,000원</td></tr>
                      <tr className="border-b border-slate-100"><td className="p-3 bg-white">2인 가구</td><td className="p-3 bg-white">4,199,000원</td></tr>
                      <tr className="border-b border-slate-100"><td className="p-3 bg-white">3인 가구</td><td className="p-3 bg-white">5,359,000원</td></tr>
                      <tr><td className="p-3 bg-white">4인 가구</td><td className="p-3 bg-white">6,495,000원</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 건보료 기준표 */}
              <div className="pb-4">
                <h4 className="text-[13px] font-black text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 건강보험료 본인부담금 기준 (월액)
                </h4>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-[11px] text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-2.5">가구원 수</th>
                        <th className="p-2.5 border-l border-slate-200">직장가입자</th>
                        <th className="p-2.5 border-l border-slate-200">지역가입자</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-slate-700">
                      <tr className="border-b border-slate-100">
                        <td className="p-2.5 bg-white">1인 가구</td><td className="p-2.5 bg-white border-l border-slate-100">89,200원</td><td className="p-2.5 bg-white border-l border-slate-100">80,300원</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-2.5 bg-white">2인 가구</td><td className="p-2.5 bg-white border-l border-slate-100">146,100원</td><td className="p-2.5 bg-white border-l border-slate-100">133,500원</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="p-2.5 bg-white">3인 가구</td><td className="p-2.5 bg-white border-l border-slate-100">186,400원</td><td className="p-2.5 bg-white border-l border-slate-100">170,400원</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 bg-white">4인 가구</td><td className="p-2.5 bg-white border-l border-slate-100">225,900원</td><td className="p-2.5 bg-white border-l border-slate-100">206,500원</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-2 sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-white via-white to-transparent">
              <button 
                onClick={() => setShowIncomeInfo(false)}
                className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold text-sm shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-8 flex justify-end">
        <button 
          onClick={() => {
            if (!formData.name || !formData.age) {
              showToast("이름과 나이는 필수 입력 항목입니다.");
              return;
            }
            if (!formData.basic_local_government) {
              showToast("거주지(기초단위)를 입력해 주세요.");
              return;
            }
            if (formData.interest_areas.length === 0) {
              showToast("관심 분야를 최소 1개 이상 선택해 주세요.");
              return;
            }
            onNext(formData);
          }}
          className="bg-primary text-white px-12 py-5 rounded-[1.5rem] font-black text-lg flex items-center gap-3 btn-interactive shadow-2xl shadow-blue-200 transition-all hover:translate-y-[-2px]"
        >
          기본 정보 저장 및 다음 단계 <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}
