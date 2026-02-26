"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import * as Accordion from "@radix-ui/react-accordion";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, Info, Calendar, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";
import BasicInfoForm from "@/components/intake/BasicInfoForm";
import ScheduleForm from "@/components/intake/ScheduleForm";
import AIChatForm from "@/components/intake/AIChatForm";
import ReviewForm from "@/components/intake/ReviewForm";

function IntakeContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');
  const isEditMode = !!applicationId;
  
  const [value, setValue] = useState("section-1");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [intakeData, setIntakeData] = useState<any>({
    request_id: applicationId || `REQ-${new Date().getTime()}`,
    user_id: user?.id || "",
    email: user?.email || "",
    role: user?.role || "client",
    password_hash: user?.password_hash || "",
    name: user?.name || "",
  });
  const [isChatFinished, setIsChatFinished] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 1. 수정 모드: URL 파라미터로 데이터 로드
  React.useEffect(() => {
    if (applicationId && user?.email) {
      fetchApplicationDetail(applicationId);
    } else {
      // 신규 모드: localStorage에서 데이터 복구
      const savedData = localStorage.getItem("intake_persistence");
      if (savedData) {
        try {
          const { data, activeStep, completed, chatFinished, timestamp } = JSON.parse(savedData);
          
          // 지난번 세션이 비정상 종료되어 chatFinished가 true인 상태로 남아있거나, 하루가 지난 데이터면 초기화
          const now = new Date().getTime();
          const isStale = timestamp ? (now - timestamp > 24 * 60 * 60 * 1000) : false;
          
          if (chatFinished || isStale) {
            console.log("기존 임시 저장 데이터가 완료 상태이거나 오래되어 초기화합니다.");
            localStorage.removeItem("intake_persistence");
          } else {
            if (data) setIntakeData((prev: any) => ({ ...prev, ...data, request_id: prev.request_id })); // request_id는 새로 생성된 것 유지
            if (activeStep) setValue(activeStep);
            if (completed) setCompletedSteps(completed);
            if (chatFinished) setIsChatFinished(chatFinished);
          }
        } catch (e) {
          console.error("Failed to restore intake data:", e);
        }
      }
      setIsHydrated(true);
    }
  }, [applicationId, user]);

  // 상세 데이터 조회
  const fetchApplicationDetail = async (id: string) => {
    try {
      setIsLoadingDetail(true);
      const res = await fetch(`/api/application-detail?id=${id}`);
      const data = await res.json();
      
      if (res.ok && data) {
        console.log('[Intake] 상세 데이터 로드 성공:', data);
        
        // interest_areas와 special_notes를 안전하게 배열로 변환
        const interestAreas = Array.isArray(data.interest_areas) 
          ? data.interest_areas 
          : typeof data.interest_areas === 'string' 
            ? data.interest_areas.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
            
        const specialNotes = Array.isArray(data.special_notes) 
          ? data.special_notes 
          : typeof data.special_notes === 'string' 
            ? data.special_notes.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
        
        // 인테이크 데이터 채우기
        setIntakeData({
          request_id: data.request_id || id,
          user_id: user?.id || "",
          email: data.email || user?.email || "",
          role: user?.role || "client",
          password_hash: user?.password_hash || "",
          name: data.name || "",
          age: data.age || "",
          gender: data.gender || "",
          regional_local_government: data.regional_local_government || "",
          basic_local_government: data.basic_local_government || "",
          job_status: data.job_status || "",
          income_level: data.income_level || "",
          interest_areas: interestAreas,
          special_notes: specialNotes,
          benefited_policy: data.benefited_policy || "",
          request_time_1: data.request_time_1 || "",
          request_time_2: data.request_time_2 || "",
          request_time_3: data.request_time_3 || "",
          preferred_location: data.preferred_location || "",
          preferred_method: data.preferred_method || "",
        });
        
        // 모든 섹션을 완료 상태로 설정
        setCompletedSteps(['section-1', 'section-2', 'section-3']);
        setIsChatFinished(true);
        
        // Step 4 (리뷰)로 바로 이동
        setValue('section-4');
      } else {
        console.error('Failed to load application detail:', data.error);
      }
    } catch (error) {
      console.error('Error fetching application detail:', error);
    } finally {
      setIsLoadingDetail(false);
      setIsHydrated(true);
    }
  };

  // 2. 상태 변경 시마다 localStorage에 자동 저장 (신규 작성(isEditMode=false)일 때만!)
  React.useEffect(() => {
    if (isHydrated && !isEditMode) {
      const persistence = {
        data: intakeData,
        activeStep: value,
        completed: completedSteps,
        chatFinished: isChatFinished,
        timestamp: new Date().getTime()
      };
      localStorage.setItem("intake_persistence", JSON.stringify(persistence));
    }
  }, [intakeData, value, completedSteps, isChatFinished, isHydrated, isEditMode]);

  // 유저 정보가 뒤늦게 로드되거나 변경될 경우 intakeData에 동기화
  React.useEffect(() => {
    if (user && !intakeData.email && isHydrated) {
      setIntakeData((prev: any) => ({
        ...prev,
        user_id: user.id,
        email: user.email,
        role: user.role,
        password_hash: user.password_hash,
        name: user.name || prev.name,
      }));
    }
  }, [user, isHydrated]);

  // 아코디언 섹션 변경 시 해당 위치로 스크롤
  React.useEffect(() => {
    if (value && isHydrated) {
      setTimeout(() => {
        const activeItem = document.querySelector(`[data-state="open"]`);
        if (activeItem) {
          activeItem.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300); // 아코디언 애니메이션 대기
    }
  }, [value]);

  const handleStepComplete = async (step: string, data: any) => {
    const updatedData = { ...intakeData, ...data };
    setIntakeData(updatedData);
    setCompletedSteps((prev: string[]) => Array.from(new Set([...prev, step])));
    
    // 한국 시간 포맷팅 (YYYY-MM-DD HH:mm:ss)
    const kstTime = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).substring(0, 19);

    // Context에 유저가 없을 경우 sessionStorage에서 직접 복구 시도 (웹훅 전송용)
    // user 객체가 있더라도 password_hash가 비어있다면 sessionStorage를 다시 확인
    let storedUser = user;
    if (!storedUser || !storedUser.password_hash) {
      if (typeof window !== 'undefined') {
        const sessionUser = JSON.parse(sessionStorage.getItem("user") || 'null');
        if (sessionUser) {
          storedUser = { ...storedUser, ...sessionUser };
        }
      }
    }

    // 섹션 1 완료 시 n8n으로 기본 정보 전송
    if (step === "section-1") {
      try {
        const res = await postToWebhook(WEBHOOK_URLS.SUBMIT_INTAKE, {
          ...updatedData,
          user_id: storedUser?.id || "",
          email: storedUser?.email || "",
          role: storedUser?.role || "",
          password_hash: storedUser?.password_hash || "",
          time: kstTime,
          step: "basic_info"
        });

        console.log("📥 [웹훅 응답 원본]", res);
        const resData = Array.isArray(res) ? res[0] : res;
        console.log("📦 [처리된 응답 데이터]", resData);

        // 성공 판단 조건 확장: status === "success" 또는 code === "STEP1_COMPLETE"
        const isSuccess = resData && (resData.status === "success" || resData.code === "STEP1_COMPLETE");
        console.log("✅ [성공 여부]", isSuccess, { status: resData?.status, code: resData?.code });

        if (isSuccess) {
          // n8n에서 업데이트된 데이터가 오면 반영 (예: request_id 등)
          // 단, {{ $json... }} 같은 플레이스홀더는 제외
          if (resData.data) {
            const cleanedData: any = {};
            Object.keys(resData.data).forEach(key => {
              const value = resData.data[key];
              // 플레이스홀더 문자열이 아닌 경우만 반영
              if (typeof value !== 'string' || !value.includes('{{')) {
                cleanedData[key] = value;
              }
            });
            console.log("🧹 [정제된 데이터]", cleanedData);
            if (Object.keys(cleanedData).length > 0) {
              setIntakeData((prev: any) => ({ ...prev, ...cleanedData }));
            }
          }
          console.log("🎯 [Section 2로 이동]");
          setValue("section-2");
        } else {
          console.error("❌ [실패 처리]", resData);
          alert(resData?.message || "데이터 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
          return;
        }
      } catch (err) {
        console.error("🚨 [웹훅 전송 실패]", err);
        alert("서버 통신 중 오류가 발생했습니다.");
        return;
      }
    } else if (step === "section-2") {
      setValue("section-3");
    } else if (step === "section-3") {
      setIsChatFinished(true);
      setValue("section-4");
    }
  };

  const handleFinalSubmit = async () => {
    const kstTime = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).substring(0, 19);
    
    // user 객체가 있더라도 password_hash가 비어있다면 sessionStorage를 다시 확인
    let storedUser = user;
    if (!storedUser || !storedUser.password_hash) {
      if (typeof window !== 'undefined') {
        const sessionUser = JSON.parse(sessionStorage.getItem("user") || 'null');
        if (sessionUser) {
          storedUser = { ...storedUser, ...sessionUser };
        }
      }
    }

    // 최종 제출 시 n8n으로 전체 요약 데이터 전송
    try {
      const res = await postToWebhook(WEBHOOK_URLS.AI_CHAT_ANALYZE, {
        ...intakeData,
        user_id: storedUser?.id || "",
        email: storedUser?.email || "",
        role: storedUser?.role || "",
        password_hash: storedUser?.password_hash || "",
        time: kstTime,
        status: "final_submitted"
      });

      const resData = Array.isArray(res) ? res[0] : res;

      // 성공 판단 조건 확장: status === "success" 또는 특정 성공 코드
      const isSuccess = resData && (resData.status === "success" || resData.code);

      if (isSuccess) {
        setIsFinished(true);
        // 제출 성공 시 localStorage 데이터 삭제
        localStorage.removeItem("intake_persistence");
        // 페이지 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(resData?.message || "최종 제출에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error("Final report submission failed:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-6 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">상담 신청이 완료되었습니다!</h1>
        <p className="text-zinc-500 leading-relaxed">
          입력하신 정보와 AI 분석 리포트는 전문 상담사에게 전달되었습니다.<br/>
          신청하신 일정에 맞춰 상담사가 연락드릴 예정입니다.
        </p>
        <div className="pt-8">
          <button 
            onClick={() => window.location.href = "/"}
            className="bg-primary text-white px-10 py-4 rounded-2xl font-bold btn-interactive shadow-xl shadow-indigo-100"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* 장식용 배경 요소 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-amber-50/40 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 relative z-10">
        <div className="mb-12 space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Premium Policy Service</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
              나에게 꼭 맞는 <span className="text-primary underline decoration-accent decoration-8 underline-offset-4">청년정책</span> 찾기
            </h1>
            <p className="text-lg text-slate-500 font-bold max-w-2xl break-keep">
              복잡한 정책들 사이에서 헤매지 마세요. 열고닫기의 AI가 당신의 상황을 분석하여 정확한 솔루션을 제안해 드립니다.
            </p>
          </div>
          
          {/* 고도화된 프로그레스 바 */}
          <div className="pt-6">
             <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Counseling Progress</span>
                <span className="text-sm font-black text-primary flex items-center gap-1">
                   <span className="animate-pulse w-1.5 h-1.5 bg-primary rounded-full" />
                   {completedSteps.length === 0 ? "0%" : completedSteps.length === 1 ? "25%" : completedSteps.length === 2 ? "50%" : completedSteps.length === 3 ? "75%" : "100%"}
                </span>
             </div>
             <div className="h-4 w-full bg-white rounded-full border border-slate-100 p-1.5 overflow-hidden shadow-inner relative">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 via-primary to-blue-600 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm relative overflow-hidden"
                  style={{ width: `${completedSteps.length === 0 ? 3 : completedSteps.length === 1 ? 25 : completedSteps.length === 2 ? 50 : completedSteps.length === 3 ? 75 : 100}%` }}
                >
                   <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-[progress-stripe_1s_linear_infinite]" />
                </div>
             </div>
             <div className="flex justify-between mt-3 px-1">
                {["기본정보", "상담예약", "AI진단", "신청확인"].map((step, idx) => (
                  <div key={idx} className={`text-[11px] font-black tracking-tighter transition-colors duration-500 ${completedSteps.length >= idx + 1 ? "text-primary" : "text-slate-300"}`}>
                    {step}
                  </div>
                ))}
             </div>
          </div>
        </div>

        <Accordion.Root 
          type="single" 
          value={value} 
          onValueChange={setValue}
          className="space-y-8"
        >
          <Accordion.Item value="section-1" className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500 data-[state=open]:ring-4 data-[state=open]:ring-primary/5 data-[state=open]:-translate-y-1">
            <Accordion.Header className="flex">
              <Accordion.Trigger className="flex-1 flex items-center justify-between p-10 text-left group">
                <div className="flex items-center gap-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${completedSteps.includes("section-1") ? "bg-green-50 text-green-600 scale-110 shadow-inner" : "bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white"}`}>
                    {completedSteps.includes("section-1") ? <CheckCircle size={32} /> : <Info size={32} />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">Step 01. 맞춤 데이터 입력</h3>
                    <p className="text-[13px] text-slate-400 font-bold">당신을 더 잘 이해하기 위한 기초 정보를 수집합니다.</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                  <ChevronDown className="text-slate-400 group-data-[state=open]:rotate-180 transition-transform duration-500" size={20} />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-12 pb-12 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
               <div className="pt-8">
                 <BasicInfoForm data={intakeData} onNext={(data) => handleStepComplete("section-1", data)} />
               </div>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="section-2" className={`bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500 data-[state=open]:ring-4 data-[state=open]:ring-primary/5 data-[state=open]:-translate-y-1 ${!completedSteps.includes("section-1") ? "opacity-40 grayscale pointer-events-none" : ""}`}>
            <Accordion.Header className="flex">
              <Accordion.Trigger className="flex-1 flex items-center justify-between p-10 text-left group">
                <div className="flex items-center gap-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${completedSteps.includes("section-2") ? "bg-green-50 text-green-600 scale-110 shadow-inner" : "bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white"}`}>
                    {completedSteps.includes("section-2") ? <CheckCircle size={32} /> : <Calendar size={32} />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">Step 02. 상담 일정 예약</h3>
                    <p className="text-[13px] text-slate-400 font-bold">전문 상담사와 깊이 있는 대화를 나눌 시간을 조율합니다.</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                   <ChevronDown className="text-slate-400 group-data-[state=open]:rotate-180 transition-transform duration-500" size={20} />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-12 pb-12 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
               <div className="pt-8">
                 <ScheduleForm data={intakeData} onNext={(data) => handleStepComplete("section-2", data)} onPrev={() => setValue("section-1")} />
               </div>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item 
            value="section-3" 
            className={`bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500 data-[state=open]:ring-4 data-[state=open]:ring-primary/5 data-[state=open]:-translate-y-1 ${
              !completedSteps.includes("section-2") ? "opacity-40 grayscale pointer-events-none" : ""
            }`}
          >
            <Accordion.Header className="flex">
              <Accordion.Trigger className="flex-1 flex items-center justify-between p-10 text-left group">
                <div className="flex items-center gap-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${completedSteps.includes("section-3") ? "bg-green-50 text-green-600 scale-110 shadow-inner" : "bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white"}`}>
                    {completedSteps.includes("section-3") ? <CheckCircle size={32} /> : <MessageCircle size={32} />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">Step 03. AI 사전 인터뷰</h3>
                    <p className="text-[13px] text-slate-400 font-bold">
                      {isChatFinished 
                        ? '✅ AI 상담이 완료되었습니다' 
                        : '채팅을 통해 당신의 구체적인 상황을 AI에게 들려주세요.'}
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                   <ChevronDown className="text-slate-400 group-data-[state=open]:rotate-180 transition-transform duration-500" size={20} />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-12 pb-12 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
               <div className="pt-8">
                {isChatFinished && (
                  <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-3xl mb-8 flex items-start gap-4 shadow-inner">
                    <AlertCircle className="text-amber-500 mt-1" size={24} />
                    <div>
                      <p className="text-base font-black text-amber-900 mb-1">
                        AI 상담 내용이 안전하게 저장되었습니다
                      </p>
                      <p className="text-sm text-amber-700 font-bold leading-relaxed">
                        상담 결과가 분석되어 전문가에게 전달되었습니다. 세부 요청 사항은 'Step 4'에서 최종 확인 및 수정이 가능합니다.
                      </p>
                    </div>
                  </div>
                )}
                <AIChatForm 
                  intakeData={intakeData} 
                  onComplete={() => handleStepComplete("section-3", {})} 
                  onUpdate={(data: any) => setIntakeData((prev: any) => ({ ...prev, ...data }))}
                  isChatFinished={isChatFinished}
                />
              </div>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="section-4" className={`bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500 data-[state=open]:ring-4 data-[state=open]:ring-primary/5 data-[state=open]:-translate-y-1 ${!isChatFinished ? "opacity-40 grayscale pointer-events-none" : ""}`}>
            <Accordion.Header className="flex">
              <Accordion.Trigger className="flex-1 flex items-center justify-between p-10 text-left group">
                <div className="flex items-center gap-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${completedSteps.includes("section-4") ? "bg-green-50 text-green-600 scale-110 shadow-inner" : "bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white"}`}>
                    {completedSteps.includes("section-4") ? <CheckCircle size={32} /> : <CheckCircle size={32} />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">Step 04. 최종 리포트 확인</h3>
                    <p className="text-[13px] text-slate-400 font-bold">작성된 모든 내용을 검토하고 상담 신청을 확정합니다.</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                   <ChevronDown className="text-slate-400 group-data-[state=open]:rotate-180 transition-transform duration-500" size={20} />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-12 pb-12 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
               <div className="pt-8">
                <ReviewForm 
                  data={intakeData} 
                  onEdit={(step) => setValue(step)} 
                  onSubmit={handleFinalSubmit} 
                />
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </div>
    </main>
  );
}

export default function IntakePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-slate-400">페이지를 불러오는 중입니다...</p>
        </div>
      </div>
    }>
      <IntakeContent />
    </Suspense>
  );
}
