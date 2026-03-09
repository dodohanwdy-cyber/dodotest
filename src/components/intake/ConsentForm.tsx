import React, { useState } from "react";
import { CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";

interface ConsentFormProps {
  onNext: () => void;
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-lg">서비스 이용 동의</h4>
          <p className="text-sm text-slate-500">안전한 맞춤 상담을 위해 약관에 동의해 주세요.</p>
        </div>
      </div>

      {/* 전체 동의 버튼 */}
      <div 
        onClick={handleAllAgree}
        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group ${
          allAgreed 
            ? "bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-100" 
            : "bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-slate-100"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
            allAgreed ? "bg-indigo-500 text-white" : "bg-white border-2 border-slate-300 text-transparent"
          }`}>
             <CheckCircle size={16} className={allAgreed ? "opacity-100" : "opacity-0"} />
          </div>
          <span className={`font-black text-lg ${allAgreed ? "text-indigo-900" : "text-slate-700 group-hover:text-indigo-900"}`}>
            개인정보 수집 이용 및 개인정보 제3자 제공, 조회 모두 동의합니다. <span className="text-indigo-600">(필수)</span>
          </span>
        </div>
        {allAgreed && <span className="text-sm font-bold text-indigo-600 animate-pulse">동의 완료</span>}
      </div>

      <div className="space-y-4">
        {/* 개별 약관 1 */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div 
            onClick={() => toggleAgreement('privacy')}
            className={`p-4 border-b border-slate-100 flex items-center gap-3 cursor-pointer transition-colors ${
              agreements.privacy ? "bg-slate-50" : "hover:bg-slate-50"
            }`}
          >
            <div className={`w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${
              agreements.privacy ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
            }`}>
               {agreements.privacy && <CheckCircle size={14} />}
            </div>
            <span className="font-bold text-slate-700">1. 개인정보 수집 및 이용 동의 <span className="text-rose-500">(필수)</span></span>
          </div>
          <div className="p-4 bg-slate-50 h-40 overflow-y-auto text-sm text-slate-600 space-y-4 custom-scrollbar">
            <ul className="space-y-3 list-disc list-inside">
              <li><strong>개인정보 수집·이용목적 :</strong> 청년지원 CRM의 종합상담 진행을 위함</li>
              <li><strong>개인정보 수집항목(필수) :</strong> 성함, 아이디, 휴대폰번호, 성별, 나이, 주소, 상담신청내용, 상담결과 (기초설문 일체)</li>
              <li>
                <strong>개인정보의 보유 및 이용기간 :</strong> 청년 연령 경과 시까지 (단, 의무복무 제대군인은 복무기간을 고려하여 최대 3살의 범위에서 참여 대상자 연령 상한을 연장하여 적용)
                <div className="bg-white p-3 rounded-lg mt-2 border border-slate-200 text-xs">
                  <p className="font-bold mb-1 text-slate-700">청년(만19세 ~ 39세) 회원</p>
                  <p className="mb-2">*일반: 만 19세 ~ 39세 (86년 ~ 07년생)</p>
                  <p className="font-bold mb-1 text-slate-700">의무복무 제대군인</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>1년 미만 복무 - 만 19세 ~ 40세 (85년 ~ 07년생)</li>
                    <li>1년 이상 ~ 2년 미만 복무 - 만 19세 ~ 41세 (84년 ~ 07년생)</li>
                    <li>2년 이상 ~ 5년 미만 복무 - 만 19세 ~ 42세 (83년 ~ 07년생)</li>
                  </ul>
                </div>
              </li>
              <li className="text-amber-700"><strong>동의거부 권리 및 동의거부에 따른 불이익 :</strong> 귀하는 개인정보 제공 및 동의를 거부할 권리가 있으며, 위 항목 동의 거부 시 종합상담 서비스 이용이 제한될 수 있습니다.</li>
            </ul>
          </div>
        </div>

        {/* 개별 약관 2 */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div 
            onClick={() => toggleAgreement('thirdParty')}
            className={`p-4 border-b border-slate-100 flex items-center gap-3 cursor-pointer transition-colors ${
              agreements.thirdParty ? "bg-slate-50" : "hover:bg-slate-50"
            }`}
          >
            <div className={`w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${
              agreements.thirdParty ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
            }`}>
               {agreements.thirdParty && <CheckCircle size={14} />}
            </div>
            <span className="font-bold text-slate-700">2. 개인정보의 제3자 제공·조회 동의 <span className="text-rose-500">(필수)</span></span>
          </div>
          <div className="p-4 bg-slate-50 h-40 overflow-y-auto text-sm text-slate-600 space-y-3 custom-scrollbar">
            <ul className="space-y-3 list-disc list-inside">
              <li><strong>개인정보를 제공받는 자 :</strong> 청년센터, 도도한콜라보(주)</li>
              <li><strong>개인정보를 제공받는 자의 이용 목적 :</strong> 청년센터, 도도한콜라보(주)가 향상된 상담서비스를 제공하기 위함, 청년정책 제안을 위한 데이터 수집을 위함</li>
              <li><strong>제공하는 개인정보의 항목 :</strong> 성함, 아이디, 휴대폰번호, 성별, 나이, 주소, 상담신청내용, 상담결과 (기초설문 일체)</li>
              <li><strong>개인정보를 제공받는 자의 개인정보 보유 및 이용 기간 :</strong> 상담 참여일로부터 2년 (단, 다른 법령에 의해 보존할 필요가 있는 경우에는 제외함)</li>
              <li className="text-amber-700"><strong>동의거부 권리 및 동의거부에 따른 불이익 :</strong> 귀하는 개인정보 제공 및 동의를 거부할 권리가 있으며, 위 항목 동의 거부 시 프로그램 참여가 제한될 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 안내 메시지 및 버튼 */}
      {!allAgreed && (
        <div className="flex items-start gap-2 text-rose-500 bg-rose-50 p-4 rounded-xl">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm font-bold">원활한 상담 진행을 위해 위의 필수 약관 사항에 동의하여 주시기 바랍니다.</p>
        </div>
      )}

      <div className="flex gap-4 pt-6 mt-8 border-t border-slate-100">
        <button
          className="flex-1 py-4 px-6 rounded-2xl font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-primary transition-colors btn-interactive"
          onClick={onPrev}
        >
          이전 단계로
        </button>
        <button
          className={`flex-[2] py-4 px-6 rounded-2xl font-bold transition-all duration-300 btn-interactive ${
            allAgreed
              ? "bg-primary text-white shadow-lg shadow-indigo-100 hover:shadow-xl hover:bg-indigo-600"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
          // TODO(Backend Integration): onNext 호출 시 agreements 데이터를 넘겨받아 최종 Intake 데이터에 병합되도록 상위 코드(page.tsx)와 이 라인을 맞춰서 수정하세요.
          // 예시: onClick={() => allAgreed && onNext({ agreements })}
          onClick={allAgreed ? (() => onNext()) : undefined}
          disabled={!allAgreed}
        >
          {allAgreed ? "동의하고 확인하기" : "약관에 동의해 주세요"}
        </button>
      </div>

    </div>
  );
}
