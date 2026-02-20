"use client";

import { X, User, MapPin, Briefcase, DollarSign, Heart, Calendar, MapPinned, Phone, Sparkles, FileText, Lightbulb, Route, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { postToWebhook } from '@/lib/api';
import { WEBHOOK_URLS } from '@/config/webhooks';

interface ConsultationDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  isLoading: boolean;
}

export default function ConsultationDetailPopup({ 
  isOpen, 
  onClose, 
  data,
  isLoading 
}: ConsultationDetailPopupProps) {
  const router = useRouter();
  if (!isOpen) return null;

  // 빈 값 체크 헬퍼
  const isEmpty = (value: any) => {
    if (!value) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  };

  const renderField = (value: any, emptyText = "상담자가 응답하지 않은 항목입니다.") => {
    if (isEmpty(value)) {
      return <span className="text-zinc-400 italic">{emptyText}</span>;
    }
    return <span className="text-zinc-900 font-medium">{value}</span>;
  };

  const renderArrayField = (arr: any[], emptyText = "상담자가 응답하지 않은 항목입니다.") => {
    if (isEmpty(arr)) {
      return <span className="text-zinc-400 italic">{emptyText}</span>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {arr.map((item, idx) => (
          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg">
            {item}
          </span>
        ))}
      </div>
    );
  };

  const renderJsonField = (value: any, emptyText = "상담자가 응답하지 않은 항목입니다.") => {
    if (isEmpty(value)) {
      return <span className="text-zinc-400 italic">{emptyText}</span>;
    }
    if (typeof value === 'string') {
      return <p className="text-zinc-900 whitespace-pre-wrap">{value}</p>;
    }
    return (
      <pre className="text-sm text-zinc-900 whitespace-pre-wrap bg-zinc-50 p-4 rounded-xl border border-zinc-200">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  };

  // 어떤 값이든 안전하게 문자열로 추출 (객체면 null 반환)
  const extractString = (val: any): string | null => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return val.trim() || null;
    if (typeof val === 'number') return String(val);
    return null; // 객체, 배열 등은 null 반환
  };

  // 정책 배열/JSON문자열을 카드 형태로 렌더링
  const renderPolicyList = (rawData: any, title: string, emptyMsg: string) => {
    if (!rawData) return null;

    let items: any[] = [];

    try {
      if (Array.isArray(rawData)) {
        items = rawData;
      } else if (typeof rawData === 'string') {
        const trimmed = rawData.trim();
        const parsed = JSON.parse(trimmed);
        items = Array.isArray(parsed) ? parsed : [parsed];
      } else if (typeof rawData === 'object') {
        items = [rawData];
      }
    } catch (e) {
      // JSON 파싱 실패 시 일반 텍스트로 표시
      const str = String(rawData);
      if (str && str !== '[object Object]') {
        return (
          <div className="space-y-2">
            <p className="text-sm font-bold text-indigo-900/70 uppercase tracking-wide">{title}</p>
            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">{str}</p>
          </div>
        );
      }
      return null; // 표시 불가 시 숨김
    }

    // 각 아이템에서 유효한 텍스트 필드 추출
    const renderableItems = items
      .map((item: any, idx: number) => {
        if (typeof item === 'string' && item.trim()) {
          return { idx, titleText: item, descText: '' };
        }
        if (typeof item !== 'object' || item === null) return null;

        // 한글/영문 필드명 순서대로 시도 (??는 null/undefined만 통과하므로 extractString 사용)
        const titleText =
          extractString(item['제목']) ??
          extractString(item['title']) ??
          extractString(item['name']) ??
          extractString(item['단계']) ??
          extractString(item['step']) ??
          extractString(item['정책명']) ??
          null;

        const descText =
          extractString(item['추천이유']) ??
          extractString(item['reason']) ??
          extractString(item['내용']) ??
          extractString(item['description']) ??
          extractString(item['desc']) ??
          extractString(item['설명']) ??
          '';

        // 유효한 텍스트가 하나도 없으면 null (필터링)
        if (!titleText && !descText) return null;

        return { idx, id: item.ID, titleText: titleText || `항목 ${idx + 1}`, descText: descText || '' };
      })
      .filter(Boolean);

    // 렌더링 가능한 항목이 없으면 섹션 자체 숨김
    if (renderableItems.length === 0) return null;

    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-indigo-900/70 uppercase tracking-wide">{title}</p>
        <div className="space-y-3">
          {renderableItems.map((r: any) => (
            <div
              key={r.id ?? r.idx}
              className="bg-indigo-50/40 rounded-xl p-4 border border-indigo-100/60 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                  {r.idx + 1}
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-zinc-900 text-base">{r.titleText}</h4>
                  {r.descText && (
                    <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap">{r.descText}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleStartConsultation = async () => {
    if (!data?.request_id) {
      alert("상담 ID가 없어 상담을 시작할 수 없습니다.");
      return;
    }

    try {
      // 1. 상담 시작 웹훅 호출 (send-all-data)
      await postToWebhook(WEBHOOK_URLS.START_CONSULTATION, {
        request_id: data.request_id,
        email: data.email,
        timestamp: new Date().toISOString()
      });

      // 2. 새 창으로 상담 페이지 이동
      const consultationUrl = `/manager/consultation/${data.request_id}`;
      window.open(consultationUrl, '_blank', 'noopener,noreferrer');
      
      // 팝업 닫기 (선택 사항)
      onClose();
    } catch (error) {
      console.error("상담 시작 실패:", error);
      alert("상담 시작 웹훅 호출 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-zinc-100">
        {/* 헤더 - 깨끗하고 세련된 흰색 배경 */}
        <div className="bg-white px-8 py-7 flex items-center justify-between border-bottom border-zinc-100">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">상담 상세 정보</h2>
            <p className="text-zinc-500 text-sm mt-1.5 font-medium">상담 준비를 위한 모든 데이터를 한눈에 확인하세요</p>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mb-5"></div>
              <p className="text-zinc-400 font-medium">정보를 안전하게 불러오는 중입니다</p>
            </div>
          ) : data ? (
            <div className="space-y-8">
              {/* 1. 기본 정보 - 부드러운 파스텔 블루 */}
              <div className="bg-[#f2f8ff] rounded-3xl p-7 border border-blue-50/50">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center">
                    <User className="text-blue-500" size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">기본 정보</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">이름</p>
                    {renderField(data.name)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">이메일</p>
                    <div className="break-all">{renderField(data.email)}</div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">나이</p>
                    {renderField(data.age ? `${data.age}세` : null)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">성별</p>
                    {renderField(data.gender === 'male' ? '남성' : data.gender === 'female' ? '여성' : data.gender)}
                  </div>
                </div>
              </div>

              {/* 2 & 3 그리드 배치 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 2. 지역 정보 - 파스텔 그린 */}
                <div className="bg-[#f0f9f4] rounded-3xl p-7 border border-green-50/50">
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center">
                      <MapPin className="text-green-500" size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">지역 정보</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-green-500/70 uppercase tracking-wider mb-2">광역 자치단체</p>
                      {renderField(data.region?.regional)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-green-500/70 uppercase tracking-wider mb-2">기초 자치단체</p>
                      {renderField(data.region?.basic)}
                    </div>
                  </div>
                </div>

                {/* 3. 사회적 상태 - 파스텔 퍼플 */}
                <div className="bg-[#f5f3ff] rounded-3xl p-7 border border-purple-50/50">
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center">
                      <Briefcase className="text-purple-500" size={22} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">사회적 상태</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                    <div>
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">직업 상태</p>
                      {renderField(data.job_status)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">소득 수준</p>
                      {renderField(data.income_level)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. 관심 분야 & 수혜 정책 - 넓게 배치 */}
              <div className="bg-zinc-50 rounded-3xl p-7 border border-zinc-100">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center">
                    <Heart className="text-rose-400" size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">관심 및 수혜</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-bold text-zinc-500 mb-3 ml-1">주요 관심 분야</p>
                    {renderArrayField(data.interest_areas)}
                  </div>
                  <div className="pt-4 border-t border-zinc-200/60">
                    <p className="text-sm font-bold text-zinc-500 mb-2 ml-1">현재 수혜 중인 정책</p>
                    {renderField(data.benefited_policy)}
                  </div>
                </div>
              </div>

              {/* 5. 상담 확정 정보 - 강조된 파스텔 에메랄드 */}
              <div className="bg-emerald-50/50 rounded-3xl p-7 border border-emerald-100">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center">
                    <Calendar className="text-emerald-500" size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">상담 확정 정보</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white/60 p-4 rounded-2xl border border-white">
                    <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-2 text-center">확정 일시</p>
                    <p className="text-zinc-900 font-bold text-center">{data.confirmed?.datetime || "-"}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-white">
                    <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-2 text-center">상담 장소</p>
                    <p className="text-zinc-900 font-bold text-center">{data.confirmed?.location === 'center' ? '청년센터' : (data.confirmed?.location || "-")}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl border border-white">
                    <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-2 text-center">상담 방식</p>
                    <p className="text-zinc-900 font-bold text-center">
                      {data.confirmed?.method === 'online' ? '💻 온라인' :
                       data.confirmed?.method === 'offline' ? '🤝 오프라인' :
                       data.confirmed?.method === 'phone' ? '📞 전화' : (data.confirmed?.method || "-")}
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. AI 분석 및 상담 준비 데이터 - 파스텔 옐로우/오렌지 */}
              <div className="bg-[#fff9eb] rounded-[32px] p-8 border border-amber-100/50">
                <div className="flex items-center gap-3.5 mb-8">
                  <div className="w-12 h-12 bg-white shadow-sm rounded-[20px] flex items-center justify-center">
                    <Sparkles className="text-amber-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-zinc-900">AI 상담 가이드</h3>
                    <p className="text-amber-600/70 text-sm font-medium">더 나은 상담을 위한 AI의 심층 분석 리포트</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 대화 요약 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 px-1">
                      <FileText size={18} className="text-amber-500" />
                      <p className="font-bold text-zinc-800">대화 요약</p>
                    </div>
                    <div className="bg-white/80 p-5 rounded-[24px] border border-white min-h-[100px] leading-relaxed">
                      {renderJsonField(data.ai_analysis?.chat_summary)}
                    </div>
                  </div>

                  {/* 특이사항 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 px-1">
                      <AlertCircle size={18} className="text-rose-400" />
                      <p className="font-bold text-zinc-800">중요 특이사항</p>
                    </div>
                    <div className="bg-rose-50/30 p-5 rounded-[24px] border border-rose-100/30 min-h-[100px] leading-relaxed text-rose-700">
                      {renderJsonField(data.ai_analysis?.special_notes)}
                    </div>
                  </div>

                  {/* 상담 가이드 */}
                  <div className="space-y-3 lg:col-span-2 mt-4">
                    <div className="flex items-center gap-2.5 px-1">
                      <Lightbulb size={20} className="text-amber-500" />
                      <p className="font-bold text-zinc-800">추천 상담 가이드라인</p>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-amber-100 shadow-sm leading-relaxed">
                      {renderJsonField(data.ai_analysis?.consultation_guide)}
                    </div>
                  </div>

                  {/* 정책 로드맵 및 추천 */}
                  <div className="space-y-3 lg:col-span-2">
                    <div className="flex items-center gap-2.5 px-1">
                      <Route size={20} className="text-indigo-400" />
                      <p className="font-bold text-zinc-800">맞춤 정책 로드맵 & 추천</p>
                    </div>
                    <div className="bg-white p-6 rounded-[28px] border border-indigo-50 shadow-sm space-y-6">
                      
                      {/* 정책 데이터 렌더링 */}
                      <div className="space-y-8">
                        {renderPolicyList(data.ai_analysis?.policy_roadmap, "정책 로드맵", "로드맵 정보가 없습니다.")}
                        <div className="border-t border-zinc-100"></div>
                        {renderPolicyList(data.ai_analysis?.recommended_policies, "추천 정책 리스트", "추천 정책 정보가 없습니다.")}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-zinc-300" size={40} />
              </div>
              <p className="text-zinc-500 font-medium">상세 데이터를 불러올 수 없습니다</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="bg-white px-8 py-5 flex justify-end gap-3 border-t border-zinc-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <button
            onClick={onClose}
            className="px-8 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-2xl font-bold transition-all duration-200 active:scale-95"
          >
            닫기
          </button>
          {!isLoading && data && !data.error && (
            <button
              onClick={handleStartConsultation}
              className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-100"
            >
              <Play size={18} fill="currentColor" />
              상담 시작하기
            </button>
          )}
        </div>
      </div>
    </div>
  );

}
