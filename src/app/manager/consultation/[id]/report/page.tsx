"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  FileText, 
  ArrowRight, 
  ChevronLeft, 
  Sparkles, 
  Loader2, 
  BrainCircuit, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  MessageCircle, 
  TrendingUp, 
  Activity,
  User,
  Clock,
  MapPin,
  Tag,
  ArrowUpRight,
  Copy,
  Check
} from "lucide-react";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";

export default function ReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [reportData, setReportData] = useState<any>(null);
  const [baseData, setBaseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadingMessages = [
    "상담 기록을 구조화하고 있습니다...",
    "AI가 핵심 키워드와 감정 상태를 분석 중입니다...",
    "맞춤형 정책 로드맵을 생성하고 있습니다...",
    "최종 상담 리포트를 구성하는 중입니다..."
  ];

  useEffect(() => {
    // 기초 데이터 로드 (내담자 프로필 등)
    const fetchBaseData = async () => {
      try {
        const res = await postToWebhook(WEBHOOK_URLS.START_CONSULTATION, { request_id: id });
        if (res) {
          setBaseData(Array.isArray(res) ? res[0] : res);
        }
      } catch (err) {
        console.error("기초 데이터 로드 실패:", err);
      }
    };
    fetchBaseData();
  }, [id]);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  // 데이터 가공 헬퍼 함수
  const processReportData = (data: any) => {
    return {
      summary: {
        main_issue: data.main_issue || "주요 이슈 분석 중",
        risk_score: typeof data.risk_grade === 'string' 
          ? (data.risk_grade.match(/\d+/) ? parseInt(data.risk_grade.match(/\d+/)[0]) : 0) 
          : (data.risk_score || 0),
        risk_description: data.risk_grade || "등급 확인 중",
        keywords: data.keywords ? (typeof data.keywords === 'string' ? data.keywords.split(',').map((k: string) => k.trim()) : data.keywords) : []
      },
      analysis: {
        dialog_summary: data.dialog_summary || "요약 내용이 없습니다.",
        engagement_change: data.engagement_change || "참여도 변화 데이터 없음",
        counselor_note: data.counselor_note || "추가 메모 없음"
      },
      action_plan: {
        policy_match: data.policy_match ? (typeof data.policy_match === 'string' ? data.policy_match.split('\n').filter((s: string) => s.trim() !== "") : data.policy_match) : [],
        next_steps: data.next_step 
          ? (typeof data.next_step === 'string' 
              ? data.next_step.split('\n').map((s: string) => s.replace(/^\d+\.\s*/, '').trim()).filter((s: string) => s !== "")
              : data.next_step)
          : []
      },
      feedback: {
        user_message: data.user_message || "내담자에게 전달할 메시지가 생성되지 않았습니다.",
        completed_at: data.completed_at || new Date().toLocaleString()
      }
    };
  };

  const handleStartReport = async (isExample = false) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // 분석 시뮬레이션 애니메이션 (예시는 더 빠르게)
      await new Promise(resolve => setTimeout(resolve, isExample ? 1500 : 6000));
      
      let data;
      if (isExample) {
        // [로컬 예시 데이터 전용] 외부 서버 요청 없이 즉시 채움
        data = {
          request_id: "EXAMPLE-MODE-24",
          name: "홍길동 (예시)",
          age: 28,
          gender: "male",
          main_issue: "주거 불안정 및 고용 중단으로 인한 심리적 무력감 호소",
          risk_grade: "8등급 (고위기)",
          keywords: "주거불안, 실업, 우울감, 긴급지원필요",
          dialog_summary: "내담자는 최근 갑작스러운 권고사직 이후 월세 체납이 발생하여 주거 지원이 절실한 상황임. 초기에는 대화에 소극적이었으나 지원 정책 안내 이후 구체적인 향후 계획에 대해 의지를 보임. 현재 심리적으로 매우 위축되어 있어 즉각적인 생활 안정 지원이 병행되어야 함.",
          engagement_change: "상담 초반 낮은 신뢰도를 보였으나, 주거 지원금 제도 안내 이후 참여도가 상향 곡선을 그리며 적극적으로 변함.",
          counselor_note: "잠을 자지 못하는 불면 증세를 언급함. 정신건강복지센터와의 연계도 함께 고려할 필요가 있음.",
          policy_match: "청년 월세 한시 특별지원\n긴급복지 주거지원 제도\n청년마음건강 지원사업",
          next_step: "1. 관할 동주민센터 방문 및 월세 지원 신청 안내\n2. 2차 심층 상담 예약 (내주 목요일)\n3. 긴급 구호물품 키트 전달 및 모니터링",
          user_message: "길동님, 혼자가 아닙니다. 지금의 불안함은 제도를 통해 충분히 해결해 나갈 수 있는 부분이기에 우리가 함께 방법을 찾겠습니다. 오늘 첫걸음을 내딛으신 것을 진심으로 응원합니다.",
          completed_at: new Date().toLocaleString()
        };
      } else {
        // [실제 데이터 모드] 웹훅 호출
        const res = await postToWebhook(WEBHOOK_URLS.GET_APPLICATION_DETAIL, { request_id: id });
        if (res) {
          data = Array.isArray(res) ? res[0] : res;
        }
      }
      
      if (data) {
        setReportData(processReportData(data));
      } else {
        setError("분석 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error("분석 로딩 중 오류:", err);
      setError("데이터 통신 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (reportData) {
    return <ReportDetailView baseData={baseData} reportData={reportData} onBack={() => setReportData(null)} />;
  }
  return (
    <div className="min-h-screen bg-zinc-50 p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-[32px] p-12 shadow-xl border border-zinc-100 flex flex-col items-center text-center relative overflow-hidden">
        
        {isAnalyzing ? (
          /* 분석 중 로딩 UI */
          <div className="flex flex-col items-center py-6 animate-in fade-in zoom-in duration-500">
            <div className="relative mb-12">
               <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center animate-pulse">
                  <BrainCircuit size={64} className="text-primary animate-bounce-subtle" />
               </div>
               <div className="absolute -top-2 -right-2 w-10 h-10 bg-white shadow-lg rounded-2xl flex items-center justify-center border border-zinc-50 animate-spin-slow">
                  <Sparkles size={20} className="text-amber-400" />
               </div>
               <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-white shadow-lg rounded-2xl flex items-center justify-center border border-zinc-50">
                  <Loader2 size={20} className="text-primary animate-spin" />
               </div>
            </div>

            <h2 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">AI 상담 분석 진행 중</h2>
            <div className="h-6 mb-10">
              <p className="text-primary font-bold animate-pulse text-lg">
                {loadingMessages[loadingStep]}
              </p>
            </div>

            <div className="w-full bg-zinc-50 rounded-2xl p-6 border border-zinc-100/50 space-y-3">
              <div className="flex justify-between text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">
                <span>Analysis Progress</span>
                <span className="text-primary">Deep Learning...</span>
              </div>
              <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-[3000ms] ease-linear"
                  style={{ width: `${(loadingStep + 1) * 25}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                대화 내용이 길 경우 분석에 최대 1~2분 정도 소요될 수 있습니다. <br />
                창을 닫지 말고 잠시만 기다려 주세요.
              </p>
            </div>
            
            {error && (
              <p className="mt-4 text-xs text-rose-500 font-bold">{error}</p>
            )}
          </div>
        ) : (
          /* 리포트 작성 시작 전 안내 UI */
          <>
            <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center text-primary mb-8 transition-transform hover:scale-110">
              <FileText size={40} />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 mb-4">최종 상담 리포트 작성</h1>
            <p className="text-zinc-500 font-medium leading-relaxed mb-10">
              상담이 성공적으로 종료되었습니다. <br />
              기록된 실시간 전사 내용과 AI 분석 실마리를 바탕으로 <br />
              내담자에게 전달할 정밀 리포트를 구성합니다.
            </p>
            
             <div className="flex gap-4 w-full">
                <button 
                  onClick={() => router.back()}
                  className="flex-none px-6 py-4 bg-zinc-100 text-zinc-500 font-bold rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => handleStartReport(true)}
                  className="flex-1 px-5 py-4 bg-white border-2 border-primary/20 text-primary font-bold rounded-2xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles size={18} /> 예시 보기
                </button>
                <button 
                  onClick={() => handleStartReport(false)}
                  className="flex-[1.5] px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  리포트 분석 및 작성 시작 
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- 상세 리포트 뷰 컴포넌트 ---
function ReportDetailView({ baseData, reportData, onBack }: { baseData: any, reportData: any, onBack: () => void }) {
  const router = useRouter();

  // 리포트 상세 뷰 진입 시 글로벌 내비게이션 숨기기
  useEffect(() => {
    document.body.classList.add('hide-global-navbar');
    return () => {
      document.body.classList.remove('hide-global-navbar');
    };
  }, []);
  
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 위험 점수 색상 설정 (0-10 기준)
  const getRiskColor = (score: number) => {
    if (score >= 8) return "text-rose-600 bg-rose-50 border-rose-100";
    if (score >= 4) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-emerald-600 bg-emerald-50 border-emerald-100";
  };

  const getRiskBarColor = (score: number) => {
    if (score >= 8) return "bg-rose-500";
    if (score >= 4) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 animate-in fade-in duration-700 report-container">
      {/* 프린트 전용 헤더 (화면에서는 숨김) */}
      <div className="hidden print:block mb-10 border-b-4 border-primary pb-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 mb-1">상담 분석 결과 보고서</h1>
            <p className="text-sm font-bold text-zinc-500 tracking-widest uppercase">AI-POWERED CONSULTATION REPORT</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-zinc-400">발급번호: {baseData?.request_id || "N/A"}</p>
            <p className="text-xs font-bold text-zinc-400">발급일시: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 상단 네비게이션 */}
      <nav className="sticky top-0 z-[60] bg-white/80 backdrop-blur-md border-b border-zinc-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-zinc-50 rounded-xl transition-colors">
              <ChevronLeft size={20} className="text-zinc-400" />
            </button>
            <div>
              <h1 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                최종 상담 리포트 <span className="text-primary text-sm font-bold">#{baseData?.request_id?.slice(-6) || "REPORT"}</span>
              </h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">
                Consultation Analysis Result
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.print()} 
              className="px-5 py-2.5 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-all text-sm flex items-center gap-2"
            >
              PDF 저장
            </button>
            <button 
              onClick={() => alert("내담자에게 리포트가 전송되었습니다.")}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center gap-2"
            >
              리포트 전송하기 <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* 좌측: 내담자 요약 & 위기 진단 */}
        <div className="lg:col-span-1 space-y-8">
          {/* 프로필 카드 */}
          <section className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-[24px] bg-zinc-50 flex items-center justify-center text-zinc-400 border border-zinc-100">
                <User size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900">{baseData?.name || "내담자"}</h3>
                <p className="text-sm font-bold text-zinc-400">{baseData?.age}세 · {baseData?.gender === "male" ? "남성" : "여성"}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-medium text-zinc-600">
                <MapPin size={16} className="text-zinc-300" />
                <span>{baseData?.location ? (typeof baseData.location === 'object' ? `${baseData.location.regional} ${baseData.location.basic}` : baseData.location) : "지역 정보 없음"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-zinc-600">
                <Clock size={16} className="text-zinc-300" />
                <span>{baseData?.schedule?.datetime || "일정 정보 없음"}</span>
              </div>
              <div className="pt-4 flex flex-wrap gap-2">
                {baseData?.interest_areas?.map((area: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-zinc-50 text-zinc-500 rounded-lg text-[11px] font-bold border border-zinc-100">
                    #{area}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* 위기 등급 카드 */}
          <section className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 overflow-hidden relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <Activity size={18} className="text-primary" /> 위기 진단 지수
              </h3>
              <div className={`px-3 py-1 rounded-full text-[11px] font-black border ${getRiskColor(reportData.summary.risk_score)}`}>
                SCORE {reportData.summary.risk_score}/10
              </div>
            </div>

            <div className="relative h-4 w-full bg-zinc-100 rounded-full mb-4 overflow-hidden">
               <div 
                 className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${getRiskBarColor(reportData.summary.risk_score)}`}
                 style={{ width: `${reportData.summary.risk_score * 10}%` }}
               />
            </div>
            
            <p className="text-sm font-bold text-zinc-900 mb-2">{reportData.summary.risk_description}</p>
            <p className="text-xs text-zinc-500 leading-relaxed italic">
              " {reportData.summary.main_issue} "
            </p>
          </section>

          {/* 핵심 키워드 */}
          <section className="bg-zinc-900 rounded-[32px] p-8 text-white shadow-xl shadow-zinc-200">
             <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Tag size={14} className="text-zinc-500" /> 핵심 키워드
             </h3>
             <div className="flex flex-wrap gap-3">
                {reportData.summary.keywords.map((word: string, idx: number) => (
                  <span key={idx} className="px-4 py-2 bg-white/10 rounded-2xl text-xs font-bold hover:bg-white/20 transition-colors cursor-default">
                    {word}
                  </span>
                ))}
             </div>
          </section>
        </div>

        {/* 중앙: 상세 분석 & 전문가 소견 */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* 대화 요약 섹션 */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500 border border-indigo-100 print:bg-transparent print:border-none print:p-0">
                <MessageCircle size={20} className="print:text-zinc-900" />
              </div>
              <h2 className="text-lg font-black text-zinc-900 print:text-xl">상담 대화 요약</h2>
              <button 
                onClick={() => handleCopy(reportData.analysis.dialog_summary, 'summary')}
                className="ml-auto p-2 text-zinc-400 hover:text-primary hover:bg-zinc-50 rounded-lg transition-all flex items-center gap-1.5 print:hidden"
                title="텍스트 복사"
              >
                {copiedId === 'summary' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span className="text-[10px] font-bold">{copiedId === 'summary' ? '복사됨' : '복사'}</span>
              </button>
            </div>
            <div className="bg-white rounded-[32px] p-10 shadow-sm border border-zinc-100 leading-relaxed text-zinc-700 font-medium">
               <p className="whitespace-pre-wrap">{reportData.analysis.dialog_summary}</p>
            </div>
          </section>

          {/* 진행 추이 & 특이사항 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-500" /> 참여도 변화
              </h3>
              <div className="bg-white p-7 rounded-[2.5rem] border border-zinc-100 shadow-sm min-h-[120px]">
                 <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                    {reportData.analysis.engagement_change}
                 </p>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" /> 상담사 특이사항
              </h3>
              <div className="bg-white p-7 rounded-[2.5rem] border border-zinc-100 shadow-sm min-h-[120px]">
                 <p className="text-sm text-zinc-600 leading-relaxed font-medium italic">
                    {reportData.analysis.counselor_note}
                 </p>
              </div>
            </div>
          </section>

          {/* 정책 실행 계획 */}
          <section className="bg-primary/5 rounded-[40px] p-10 border border-primary/10">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-lg font-black text-primary flex items-center gap-3 print:text-zinc-900">
                 <Target size={24} className="print:text-zinc-900" /> 맞춤형 실행 계획
               </h2>
               <div className="p-2 bg-white rounded-2xl shadow-sm border border-primary/10 animate-pulse">
                 <Sparkles className="text-primary" size={20} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                   <div className="flex items-center justify-between pl-1">
                     <p className="text-xs font-black text-primary/60 uppercase tracking-widest">Matching Policies</p>
                     <button 
                       onClick={() => handleCopy(reportData.action_plan.policy_match.join('\n'), 'policies')}
                       className="p-1 px-2 text-primary/60 hover:text-primary hover:bg-white rounded-lg transition-all flex items-center gap-1 print:hidden"
                     >
                       {copiedId === 'policies' ? <Check size={10} /> : <Copy size={10} />}
                       <span className="text-[9px] font-bold">전체 복사</span>
                     </button>
                   </div>
                  <div className="space-y-3">
                    {reportData.action_plan.policy_match.map((policy: string, idx: number) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm flex items-start gap-4 group hover:border-primary/20 hover:scale-[1.02] transition-all cursor-default">
                         <div className="mt-1 p-1 bg-primary/10 rounded text-primary">
                            <ArrowUpRight size={14} />
                         </div>
                         <span className="text-sm font-bold text-zinc-800 leading-tight">{policy}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="space-y-4">
                   <div className="flex items-center justify-between pl-1">
                     <p className="text-xs font-black text-primary/60 uppercase tracking-widest">Next Action Items</p>
                     <button 
                       onClick={() => handleCopy(reportData.action_plan.next_steps.join('\n'), 'steps')}
                       className="p-1 px-2 text-primary/60 hover:text-primary hover:bg-white rounded-lg transition-all flex items-center gap-1 print:hidden"
                     >
                       {copiedId === 'steps' ? <Check size={10} /> : <Copy size={10} />}
                       <span className="text-[9px] font-bold">전체 복사</span>
                     </button>
                   </div>
                  <div className="space-y-3">
                    {reportData.action_plan.next_steps.map((step: string, idx: number) => (
                      <div key={idx} className="bg-white/50 p-4 rounded-2xl border border-zinc-200/50 flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0" />
                        <span className="text-sm font-medium text-zinc-700 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </section>

          {/* 내담자 전달 메시지 */}
          <section className="bg-white rounded-[32px] p-10 border-2 border-dashed border-zinc-100">
             <h3 className="text-sm font-black text-zinc-900 mb-6 flex items-center gap-2">
               <MessageCircle size={18} className="text-zinc-300" /> 내담자 전달 메시지
               <button 
                 onClick={() => handleCopy(reportData.feedback.user_message, 'feedback')}
                 className="ml-auto p-1.5 text-zinc-400 hover:text-primary hover:bg-zinc-50 rounded-lg transition-all flex items-center gap-1 print:hidden"
               >
                 {copiedId === 'feedback' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                 <span className="text-[10px] font-bold">{copiedId === 'feedback' ? '복사 완료' : '복사'}</span>
               </button>
             </h3>
             <div className="p-8 bg-zinc-50 rounded-2xl relative">
                <div className="absolute top-0 left-8 -translate-y-1/2 w-4 h-4 bg-zinc-50 rotate-45 border-l border-t border-zinc-100" />
                <p className="text-zinc-700 font-bold text-lg leading-relaxed">
                  "{reportData.feedback.user_message}"
                </p>
                <div className="flex justify-between items-center mt-10">
                   <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white" />
                      <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white" />
                   </div>
                   <p className="text-[11px] font-bold text-zinc-400">
                     분석 완료: {reportData.feedback.completed_at}
                   </p>
                </div>
             </div>
          </section>

        </div>
      </main>
    </div>
  );
}
