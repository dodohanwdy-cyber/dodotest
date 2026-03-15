"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
  Check,
  X,
  Send,
  Share2,
  Link as LinkIcon,
  ExternalLink
} from "lucide-react";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";

export default function ReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCompletedMode = searchParams.get('status') === 'completed';

  const { user, isLoading: isLoadingAuth } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [reportData, setReportData] = useState<any>(null);
  const [baseData, setBaseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);


  // --- 추가된 매니저 알림톡 옵션 State ---
  const [managerWantsAlert, setManagerWantsAlert] = useState(true);

  // --- 알림톡 발송 모달 State ---
  const [showEndConsultationModal, setShowEndConsultationModal] = useState(false);
  const [endConsultationStatus, setEndConsultationStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleEndConsultationAction = async () => {
    setEndConsultationStatus("loading");
    // "상담 수고하셨습니다. 리포트는 추후 준비됩니다." 알림 발송 동작 모의
    await new Promise((res) => setTimeout(res, 1200));
    setEndConsultationStatus("success");
    setTimeout(() => {
      setShowEndConsultationModal(false);
      setEndConsultationStatus("idle");
    }, 2000);
  };

  const loadingMessages = [
    "상담 기록을 구조화하고 있습니다...",
    "AI가 핵심 키워드와 감정 상태를 분석 중입니다...",
    "맞춤형 정책 로드맵을 생성하고 있습니다...",
    "최종 상담 리포트를 구성하는 중입니다..."
  ];

  useEffect(() => {
    const initFetch = async () => {
      try {
        if (isCompletedMode) {
          // 이전 화면(Manager)에서 넘어온 기본 데이터를 쿼리에서 파싱
          const queryBaseData = {
            request_id: id,
            id: id, // id 필드도 호환성을 위해 추가
            name: searchParams.get('name') || '',
            age: searchParams.get('age') || '',
            gender: searchParams.get('gender') || '',
            location: searchParams.get('location') || '',
            schedule: { datetime: searchParams.get('datetime') || '' },
            interest_areas: searchParams.get('interest_areas') ? searchParams.get('interest_areas')?.split(',') : []
          };

          const reportRes = await postToWebhook(WEBHOOK_URLS.GET_COMPLETED_DETAIL, { request_id: id });

          let loadedData = null;
          if (reportRes) {
            // 응답이 [{ success: true, data: { ... } }] 형태인 경우 처리
            if (Array.isArray(reportRes)) {
              loadedData = reportRes[0]?.data || reportRes[0];
            } else {
              loadedData = reportRes?.data || reportRes;
            }
          } else {
            const fallbackRes = await postToWebhook(WEBHOOK_URLS.GET_APPLICATION_DETAIL, { request_id: id });
            if (fallbackRes) {
               if (Array.isArray(fallbackRes)) {
                 loadedData = fallbackRes[0]?.data || fallbackRes[0];
               } else {
                 loadedData = fallbackRes?.data || fallbackRes;
               }
            }
          }

          if (loadedData) {
            // URL 쿼리로 가져온 기본 정보와 새로 불러온 분석 데이터를 병합(Merge)
            const mergedData = { ...queryBaseData, ...loadedData };
            setBaseData(mergedData);
            setReportData(processReportData(mergedData));
          } else {
            setBaseData(queryBaseData);
          }
        } else {
          const res = await postToWebhook(WEBHOOK_URLS.START_CONSULTATION, { request_id: id });
          if (res) {
            let data = null;
            if (Array.isArray(res)) {
               data = res[0]?.data || res[0];
            } else {
               data = res?.data || res;
            }

            setBaseData(data);
            if (data?.status === "completed") {
               handleAutoLoadReport();
            }
          }
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    initFetch();
  }, [id, isCompletedMode, searchParams]);

  const handleAutoLoadReport = async () => {
    setIsAnalyzing(true);
    try {
      const res = await postToWebhook(WEBHOOK_URLS.GET_COMPLETED_DETAIL, { request_id: id });
      if (res) {
        let data = null;
        if (Array.isArray(res)) {
           data = res[0]?.data || res[0];
        } else {
           data = res?.data || res;
        }
        setReportData(processReportData(data));
      } else {
        const fallbackRes = await postToWebhook(WEBHOOK_URLS.GET_APPLICATION_DETAIL, { request_id: id });
        if (fallbackRes) {
          let data = null;
          if (Array.isArray(fallbackRes)) {
             data = fallbackRes[0]?.data || fallbackRes[0];
          } else {
             data = fallbackRes?.data || fallbackRes;
          }
          setReportData(processReportData(data));
        }
      }
    } catch (err) {
      console.error("자동 로딩 실패:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

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

  const handleFinishAndReturn = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // (중복 발송 방지) 상담 종료 시점의 데이터 전송은 이미 '상담 진행' 페이지에서 처리되었습니다.
      // 여기서는 분석 상태 표시와 탭 닫기/이동만 수행합니다.

      // 지연 시간을 두어 '전송 중' 효과만 부여
      await new Promise(resolve => setTimeout(resolve, 800));

      sessionStorage.removeItem(`consultation_${id}_stt`);
      sessionStorage.removeItem(`consultation_${id}_notes`);
      
      // 탭 닫기 (새 탭에서 열린 경우)
      if (window.opener) {
        window.close();
      } else {
        router.push('/manager/completed');
      }

    } catch (err) {
      console.error("최종 전송 중 오류:", err);
      setError("데이터 전송 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setIsAnalyzing(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-zinc-50 p-8 flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-primary animate-spin" />
      </div>
    );
  }

  if (reportData) {
    return <ReportDetailView baseData={baseData} reportData={reportData} onBack={() => setReportData(null)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-[32px] p-12 shadow-xl border border-zinc-100 flex flex-col items-center text-center relative overflow-hidden">
        
        {isAnalyzing ? (
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

            <h2 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">AI에 텍스트 및 분석 데이터 전송 중</h2>
            <div className="h-6 mb-10">
              <p className="text-primary font-bold animate-pulse text-lg">
                완료되면 목록으로 자동 이동합니다...
              </p>
            </div>

            {error && (
              <p className="mt-4 text-xs text-rose-500 font-bold">{error}</p>
            )}
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-primary/10 rounded-[28px] flex items-center justify-center text-primary mb-8 transition-transform hover:scale-110">
              <FileText size={40} />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 mb-4">최종 상담 리포트 작성</h1>
            <p className="text-zinc-500 font-medium leading-relaxed mb-6">
              상담이 성공적으로 종료되었습니다. <br />
              기록된 실시간 전사 내용과 AI 분석 실마리를 바탕으로 <br />
              내담자에게 전달할 정밀 리포트를 백그라운드에서 구성합니다.
            </p>

            <div className="w-full max-w-sm bg-zinc-50 border border-zinc-100 rounded-2xl p-4 mb-8 text-left">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-1">
                  <input 
                    type="checkbox" 
                    checked={managerWantsAlert}
                    onChange={(e) => setManagerWantsAlert(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-800 group-hover:text-primary transition-colors">매니저에게 분석 완료 알림 받기</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">AI 리포트 분석이 완료되면 화면 우측 하단 팝업 알림으로 즉시 알려드립니다.</p>
                </div>
              </label>
            </div>
            
            <button 
              onClick={() => setShowEndConsultationModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-700 font-bold rounded-2xl hover:bg-zinc-200 transition-all mb-8 shadow-sm"
            >
              종료 알림 먼저 보내기 <MessageCircle size={18} />
            </button>
            
             <div className="flex gap-4 w-full">
                <button 
                  onClick={() => router.back()}
                  className="flex-none px-6 py-4 bg-zinc-100 text-zinc-500 font-bold rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={handleFinishAndReturn}
                  disabled={isAnalyzing}
                  className="flex-1 px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
                >
                  {isAnalyzing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      완료하고 상담 내역으로 돌아가기 
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
             </div>
          </>
        )}

        {showEndConsultationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowEndConsultationModal(false)}></div>
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
              <button 
                onClick={() => setShowEndConsultationModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors z-20"
              >
                <X size={20} />
              </button>
              
              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-500 mb-5 shadow-inner">
                <MessageCircle size={24} />
              </div>

              <h2 className="text-xl font-bold text-zinc-900 mb-2">상담 종료 알림 발송</h2>
              <p className="text-[13px] text-zinc-500 mb-6 font-medium leading-relaxed">
                내담자({baseData?.name || "고객"}님)에게 상담 종료 인사말과 함께, AI 리포트가 추후 분석되어 제공될 예정이라는 안내 문자를 우선 발송합니다.
              </p>

              <button
                onClick={handleEndConsultationAction}
                disabled={endConsultationStatus !== "idle"}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  endConsultationStatus === "success" 
                    ? "bg-green-100 text-green-700 shadow-none" 
                    : "bg-zinc-800 text-white hover:bg-zinc-700 hover:translate-y-[-1px] active:translate-y-[1px]"
                } disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed`}
              >
                {endConsultationStatus === "loading" ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> 
                    발송 중...
                  </>
                ) : endConsultationStatus === "success" ? (
                  <><CheckCircle2 size={18} /> 알림이 발송되었어요</>
                ) : (
                  <>우선 종료 알림 보내기 <Send size={18} /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportDetailView({ baseData, reportData, onBack }: { baseData: any, reportData: any, onBack: () => void }) {
  const router = useRouter();

  useEffect(() => {
    document.body.classList.add('hide-global-navbar');
    return () => {
      document.body.classList.remove('hide-global-navbar');
    };
  }, []);
  
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [sendResultStatus, setSendResultStatus] = useState<"idle" | "loading" | "success">("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleSendResultAction = async () => {
    if (sendResultStatus === "loading") return;
    setSendResultStatus("loading");
    try {
      const baseUrl = window.location.origin;
      const generatedUrl = `${baseUrl}/report/${baseData?.request_id || baseData?.id}`;
      
      // (중복 발송 방지) 최종 데이터와 상태 업데이트는 상담 종료 시점에 이미 수행되었습니다.
      // 내담자 전송 시에는 별도의 웹훅 호출 없이 즉시 완료 처리합니다.
      
      setShareUrl(generatedUrl);
      setSendResultStatus("success");
      
      // 2초 뒤에 탭 닫기
      setTimeout(() => {
        setShowResultModal(false);
        if (window.opener) {
          window.close();
        } else {
          router.push('/manager/completed');
        }
      }, 2500);
    } catch (err) {
      console.error("리포트 전송 및 상태 업데이트 실패:", err);
      setSendResultStatus("idle");
      alert("전송 중 오류가 발생했습니다.");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const fullText = `[AI 상담 분석 결과 보고서]
발급번호: ${baseData?.request_id || "N/A"}
발급일시: ${new Date().toLocaleString()}

■ 내담자 정보
- 이름: ${baseData?.name || "내담자"} (${baseData?.age}세, ${baseData?.gender === "male" ? "남성" : "여성"})
- 지역: ${baseData?.location ? (typeof baseData.location === 'object' ? baseData.location.regional : baseData.location) : "N/A"}

■ 위기 진단 지수
- 점수: SCORE ${reportData.summary.risk_score} / 10
- 위험도: ${reportData.summary.risk_description}
- 주요 이슈: ${reportData.summary.main_issue}
- 핵심 키워드: ${reportData.summary.keywords.join(', ')}

■ 상담 대화 요약
${reportData.analysis.dialog_summary}

■ 상세 분석
[참여도 변화]
${reportData.analysis.engagement_change}

[상담사 특이사항]
${reportData.analysis.counselor_note}

■ 맞춤형 실행 계획
[추천 정책 솔루션]
${reportData.action_plan.policy_match.map((p: string) => "- " + p).join('\n')}

[다음 액션 플랜]
${reportData.action_plan.next_steps.map((s: string) => "- " + s).join('\n')}

■ 내담자 전달 메시지
"${reportData.feedback.user_message}"`;

    handleCopy(fullText, 'all');
  };

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
    <div className="min-h-screen bg-[#F8F9FA] pb-20 animate-in fade-in duration-700 report-container print:bg-white print:pb-0">
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
          <div className="flex gap-3 print:hidden">
            <button 
              onClick={() => window.print()} 
              className="px-5 py-2.5 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-all text-sm flex items-center gap-2"
            >
              PDF 저장
            </button>
            <button 
              onClick={handleCopyAll} 
              className="px-5 py-2.5 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-900 transition-all text-sm flex items-center gap-2 shadow-sm"
            >
              {copiedId === 'all' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              전체 복사
            </button>
            <button 
              onClick={() => setShowResultModal(true)}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center gap-2"
            >
              내담자에게 리포트 전송 <Send size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <section className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 print:shadow-none print:border-zinc-300">
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
            </div>
          </section>

          <section className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 overflow-hidden relative print:shadow-none print:border-zinc-300">
            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2 mb-6">
              <Activity size={18} className="text-primary" /> 위기 진단 지수
            </h3>
            <div className={`px-3 py-1 rounded-full text-[11px] font-black border mb-4 inline-block ${getRiskColor(reportData.summary.risk_score)}`}>
              SCORE {reportData.summary.risk_score}/10
            </div>
            <div className="relative h-4 w-full bg-zinc-100 rounded-full mb-4 overflow-hidden">
               <div 
                 className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${getRiskBarColor(reportData.summary.risk_score)}`}
                 style={{ width: `${reportData.summary.risk_score * 10}%` }}
               />
            </div>
            <p className="text-sm font-bold text-zinc-900 mb-2">{reportData.summary.risk_description}</p>
            <p className="text-xs text-zinc-500 leading-relaxed italic">" {reportData.summary.main_issue} "</p>
          </section>

          <section className="bg-zinc-900 rounded-[32px] p-8 text-white shadow-xl shadow-zinc-200 print:bg-zinc-100 print:text-zinc-900 print:shadow-none print:border print:border-zinc-300">
             <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Tag size={14} className="text-zinc-500" /> 핵심 키워드
             </h3>
             <div className="flex flex-wrap gap-3">
                {reportData.summary.keywords.map((word: string, idx: number) => (
                  <span key={idx} className="px-4 py-2 bg-white/10 rounded-2xl text-xs font-bold print:border print:border-zinc-300 print:bg-white print:text-zinc-800">
                    {word}
                  </span>
                ))}
             </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-10">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500 border border-indigo-100 print:bg-transparent print:border-none print:p-0">
                <MessageCircle size={20} className="print:text-zinc-900" />
              </div>
              <h2 className="text-lg font-black text-zinc-900 print:text-xl">상담 대화 요약</h2>
              <button 
                onClick={() => handleCopy(reportData.analysis.dialog_summary, 'summary')}
                className="ml-auto p-2 text-zinc-400 hover:text-primary hover:bg-zinc-50 rounded-lg transition-all flex items-center gap-1.5 print:hidden"
              >
                {copiedId === 'summary' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span className="text-[10px] font-bold">{copiedId === 'summary' ? '복사됨' : '복사'}</span>
              </button>
            </div>
            <div className="bg-white rounded-[32px] p-10 shadow-sm border border-zinc-100 leading-relaxed text-zinc-700 font-medium print:shadow-none print:border-zinc-300 h-full">
               <p className="whitespace-pre-wrap">{reportData.analysis.dialog_summary}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-500" /> 참여도 변화
              </h3>
              <div className="bg-white p-7 rounded-[2.5rem] border border-zinc-100 shadow-sm print:shadow-none print:border-zinc-300">
                 <p className="text-sm text-zinc-600">{reportData.analysis.engagement_change}</p>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" /> 상담사 특이사항
              </h3>
              <div className="bg-white p-7 rounded-[2.5rem] border border-zinc-100 shadow-sm print:shadow-none print:border-zinc-300">
                 <p className="text-sm text-zinc-600 italic">{reportData.analysis.counselor_note}</p>
              </div>
            </div>
          </section>

          <section className="bg-primary/5 rounded-[40px] p-10 border border-primary/10 print:bg-white print:border-zinc-300 mt-8">
            <h2 className="text-lg font-black text-primary flex items-center gap-3 mb-8 print:text-zinc-900">
              <Target size={24} /> 맞춤형 실행 계획
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <p className="text-xs font-black text-primary/60 uppercase tracking-widest pl-1">Matching Policies</p>
                  <div className="space-y-3">
                    {reportData.action_plan.policy_match.map((policy: string, idx: number) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-primary/5 shadow-sm flex items-start gap-4 print:border-zinc-200">
                         <div className="mt-1 p-1 bg-primary/10 rounded text-primary print:bg-transparent">
                            <ArrowUpRight size={14} />
                         </div>
                         <span className="text-sm font-bold text-zinc-800 leading-tight">{policy}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="space-y-4">
                  <p className="text-xs font-black text-primary/60 uppercase tracking-widest pl-1">Next Action Items</p>
                  <div className="space-y-3">
                    {reportData.action_plan.next_steps.map((step: string, idx: number) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-primary mt-0.5" />
                        <span className="text-sm font-medium text-zinc-700">{step}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </section>

          <section className="bg-white rounded-[32px] p-10 border-2 border-dashed border-zinc-100 print:border-solid print:border-zinc-300">
             <h3 className="text-sm font-black text-zinc-900 mb-6 flex items-center gap-2">
               <MessageCircle size={18} className="text-zinc-300" /> 내담자 전달 메시지
             </h3>
             <div className="p-8 bg-zinc-50 rounded-2xl relative">
                <div className="absolute top-0 left-8 -translate-y-1/2 w-4 h-4 bg-zinc-50 rotate-45 border-l border-t border-zinc-100" />
                <p className="text-zinc-700 font-bold text-lg leading-relaxed">"{reportData.feedback.user_message}"</p>
                <div className="flex justify-between items-center mt-10">
                   <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white" />
                      <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white" />
                   </div>
                   <p className="text-[11px] font-bold text-zinc-400">분석 완료: {reportData.feedback.completed_at}</p>
                </div>
             </div>
          </section>
        </div>
      </main>

      {showResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowResultModal(false)}></div>
          <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowResultModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-black text-zinc-900 mb-6 flex items-center gap-2">
              <Send className="text-primary" size={24} /> 내담자에게 리포트 전송
            </h2>
            <div className="flex-1 overflow-y-auto mb-6 border border-zinc-200 rounded-2xl p-6 bg-zinc-50 relative custom-scrollbar">
               <div className="bg-white p-8 rounded-xl shadow-sm border border-zinc-100 space-y-8">
                 <div className="text-center border-b border-zinc-100 pb-6">
                    <h3 className="text-xl font-black text-zinc-900">상담 분석 결과 보고서 요약</h3>
                    <p className="text-xs text-zinc-400 mt-2 font-bold">발급번호: {baseData?.request_id || "N/A"}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-6 text-left">
                   <div>
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">내담자 정보</h4>
                      <p className="text-sm font-bold text-zinc-800">{baseData?.name || "내담자"} <span className="text-zinc-500 font-medium">({baseData?.age}세, {baseData?.gender === "male" ? "남성" : "여성"})</span></p>
                   </div>
                   <div>
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">위기 진단 지수</h4>
                      <p className="text-sm font-bold text-amber-600">위험도 {reportData.summary.risk_score} / 10</p>
                   </div>
                 </div>
                 <div className="text-left">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-3 bg-zinc-50 py-1.5 px-3 rounded-md inline-block">주요 이슈</h4>
                    <p className="text-sm text-zinc-800 font-bold mb-3">{reportData.summary.main_issue}</p>
                    <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">{reportData.analysis.dialog_summary}</p>
                 </div>
                 <div className="text-left">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-3 bg-blue-50 py-1.5 px-3 text-blue-600 rounded-md inline-block">추천 정책 & 실행 계획</h4>
                    <ul className="text-sm text-zinc-700 space-y-2 mt-2">
                      {reportData.action_plan.policy_match.map((p: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-blue-500 mt-0.5 shrink-0" />
                          <span className="font-bold">{p}</span>
                        </li>
                      ))}
                    </ul>
                 </div>
               </div>
            </div>

            <div className="shrink-0 space-y-4">
              {sendResultStatus === "success" && shareUrl ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-left">
                    <p className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
                       <CheckCircle2 size={16} /> 내담자 대시보드로 전송이 완료되었습니다!
                    </p>
                    <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-emerald-200">
                      <p className="flex-1 text-xs text-zinc-500 truncate font-mono">{shareUrl}</p>
                      <button 
                        onClick={() => handleCopy(shareUrl, 'share')}
                        className="p-2 hover:bg-zinc-50 rounded-lg text-primary transition-colors"
                      >
                        {copiedId === 'share' ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <a 
                    href={shareUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg"
                  >
                    생성된 페이지 확인하기 <ExternalLink size={20} />
                  </a>
                </div>
              ) : (
                <>
                  <p className="text-center text-[15px] font-black text-blue-600 bg-blue-50 py-4 rounded-xl border border-blue-100 flex items-center justify-center gap-2">
                    <MessageCircle size={18} /> 전송 시 내담자 대시보드에 즉시 알림이 표시됩니다.
                  </p>
                  <button
                    onClick={handleSendResultAction}
                    disabled={sendResultStatus !== "idle"}
                    className="w-full h-14 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50 text-lg shadow-lg shadow-blue-200"
                  >
                    {sendResultStatus === "loading" ? (
                      <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                    <>전송 확인 및 알림 보내기 <Send size={20} /></>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
