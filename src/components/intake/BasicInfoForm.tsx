"use client";

import { useState } from "react";
import { User, MapPin, Briefcase, Heart, Star, ChevronRight, Info, AlertCircle } from "lucide-react";

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
          <label className="text-sm font-black text-slate-800 flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
              <Heart size={18} />
            </span>
            소득 구간 (월평균)
          </label>
          
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-2">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <Info size={14} className="text-blue-500" />
              </div>
              <div className="space-y-1.5 flex-1">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">2026년 기준 중위소득 100% 정보</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-400 font-bold">
                  <div className="flex justify-between"><span>1인 가구:</span> <span className="text-slate-600">256.4만원</span></div>
                  <div className="flex justify-between"><span>2인 가구:</span> <span className="text-slate-600">419.9만원</span></div>
                  <div className="flex justify-between"><span>3인 가구:</span> <span className="text-slate-600">535.9만원</span></div>
                  <div className="flex justify-between"><span>4인 가구:</span> <span className="text-slate-600">649.5만원</span></div>
                </div>
              </div>
            </div>
          </div>

          <select 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer"
            value={formData.income_level}
            onChange={(e) => setFormData({...formData, income_level: e.target.value})}
          >
            <option value="없음">💰 소득 없음 (또는 비공개)</option>
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
