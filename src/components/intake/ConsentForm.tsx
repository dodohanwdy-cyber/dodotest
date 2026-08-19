import React, { useState } from "react";
import { CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";

interface ConsentFormProps {
  onNext: (data: any) => void;
  onPrev: () => void;
}

export default function ConsentForm({ onNext, onPrev }: ConsentFormProps) {
  // TODO(Backend Integration): 추후 개인정보 및 제3자 제공 동의 여부를 DB에 저장해야 할 경우,
  // 이 상태값(privacy, thirdParty)을 상위 컴포넌트(page.tsx)의 onNext({ privacy: true, thirdParty: true }) 형태로 전달하도록 수정하세요.
  const [agreements, setAgreements] = useState({
    privacy: false,
    thirdParty: false,
  });

  const allAgreed = agreements.privacy && agreements.thirdParty;

  const handleAllAgree = () => {
    setAgreements({
      privacy: !allAgreed,
      thirdParty: !allAgreed,
    });
  };

  const toggleAgreement = (key: keyof typeof agreements) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
          <ShieldCheck size={18} className="sm:w-5 sm:h-5" />
        </div>
        <div>
          <h4 className="font-black text-slate-800 text-sm sm:text-lg">서비스 이용 동의</h4>
        </div>
      </div>

      {/* 전체 동의 버튼 */}
      <div 
        onClick={handleAllAgree}
        className={`p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border sm:border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group ${
          allAgreed 
            ? "bg-indigo-50 border-indigo-500 shadow-sm sm:shadow-md shadow-indigo-100" 
            : "bg-slate-50 border-slate-200 hover:border-indigo-300"
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            allAgreed ? "bg-indigo-500 text-white" : "bg-white border-2 border-slate-300 text-transparent"
          }`}>
             <CheckCircle size={14} className={allAgreed ? "opacity-100 sm:w-4 sm:h-4" : "opacity-0"} />
          </div>
          <span className={`font-black text-xs sm:text-base break-keep ${allAgreed ? "text-indigo-900" : "text-slate-700 group-hover:text-indigo-900"}`}>
            개인정보 수집 및 제3자 제공에 전체 동의합니다.
          </span>
        </div>
        {allAgreed && <span className="text-[11px] sm:text-sm font-bold text-indigo-600 shrink-0">동의 완료</span>}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* 개별 약관 1 */}
        <div className="border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden bg-white">
          <div 
            onClick={() => toggleAgreement('privacy')}
            className={`p-3 sm:p-4 border-b border-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors ${
              agreements.privacy ? "bg-slate-50" : "hover:bg-slate-50"
            }`}
          >
            <div className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${
              agreements.privacy ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
            }`}>
               {agreements.privacy && <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" />}
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-700">1. 개인정보 수집 및 이용 동의 <span className="text-rose-500 font-bold">(필수)</span></span>
          </div>
          <div className="p-3 sm:p-4 bg-slate-50 h-28 sm:h-40 overflow-y-auto text-[11px] sm:text-xs text-slate-600 space-y-2 sm:space-y-3 custom-scrollbar">
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>개인정보 수집·이용목적 :</strong> 청년지원 CRM 종합상담 진행</li>
              <li><strong>수집항목 :</strong> 성함, 연락처, 성별, 나이, 주소, 상담내용 및 진단 데이터</li>
              <li><strong>보유 및 이용기간 :</strong> 청년 연령 경과 시 또는 법정 보존기간까지</li>
              <li className="text-amber-700"><strong>동의 거부 권리 :</strong> 동의 거부 시 상담 서비스 이용이 제한될 수 있습니다.</li>
            </ul>
          </div>
        </div>

        {/* 개별 약관 2 */}
        <div className="border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden bg-white">
          <div 
            onClick={() => toggleAgreement('thirdParty')}
            className={`p-3 sm:p-4 border-b border-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors ${
              agreements.thirdParty ? "bg-slate-50" : "hover:bg-slate-50"
            }`}
          >
            <div className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${
              agreements.thirdParty ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
            }`}>
               {agreements.thirdParty && <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" />}
            </div>
            <span className="font-bold text-xs sm:text-sm text-slate-700">2. 개인정보 제3자 제공 동의 <span className="text-indigo-500 font-bold">(선택)</span></span>
          </div>
          <div className="p-3 sm:p-4 bg-slate-50 h-28 sm:h-40 overflow-y-auto text-[11px] sm:text-xs text-slate-600 space-y-2 sm:space-y-3 custom-scrollbar">
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>제공받는 자 :</strong> 관할 청년센터, 도도한콜라보(주)</li>
              <li><strong>이용 목적 :</strong> 맞춤 정책 추천 및 사후 관리 지원</li>
              <li><strong>보유 기간 :</strong> 상담 참여일로부터 2년</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 안내 메시지 및 버튼 */}
      {!agreements.privacy && (
        <div className="flex items-start gap-2 text-rose-500 bg-rose-50 p-3 sm:p-4 rounded-xl">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p className="text-xs sm:text-sm font-bold break-keep">원활한 상담 진행을 위해 필수 약관에 동의해 주세요.</p>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-4 pt-4 sm:pt-6 mt-4 sm:mt-8 border-t border-slate-100">
        <button
          className="w-full sm:w-auto py-3 sm:py-4 px-5 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors btn-interactive text-center"
          onClick={onPrev}
        >
          이전 단계로
        </button>
        <button
          className={`w-full sm:flex-1 py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 btn-interactive ${
            agreements.privacy
              ? "bg-primary text-white shadow-md sm:shadow-lg shadow-indigo-100 hover:bg-indigo-600"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
          onClick={() => {
            if (agreements.privacy) {
              onNext({
                is_agreed_general_privacy: agreements.privacy,
                is_agreed_third_party: agreements.thirdParty
              });
            }
          }}
          disabled={!agreements.privacy}
        >
          {agreements.privacy ? "동의 완료 및 최종 확인하기 ➔" : "필수 약관에 동의해 주세요"}
        </button>
      </div>
    </div>
  );
}
