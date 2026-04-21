"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import * as Accordion from "@radix-ui/react-accordion";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, Info, Calendar, MessageCircle, CheckCircle, AlertCircle, ShieldCheck as ShieldCheckIcon } from "lucide-react";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";
import BasicInfoForm from "@/components/intake/BasicInfoForm";
import ScheduleForm from "@/components/intake/ScheduleForm";
import AIChatForm from "@/components/intake/AIChatForm";
import ConsentForm from "@/components/intake/ConsentForm";
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
    role: (user as any)?.role || "client",
    password_hash: (user as any)?.password_hash || "",
    name: user?.user_metadata?.full_name || "",
  });
  const [isChatFinished, setIsChatFinished] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [hasWarnedRankFinal, setHasWarnedRankFinal] = useState(false);

  // 1. 수정 모드: URL 파라미터로 데이터 로드
  React.useEffect(() => {
    const mode = searchParams.get('mode');
    
    // 강제 신규 모드일 경우 기존 데이터 삭제
    if (mode === 'new') {
      console.log("신규 신청 모드: 기존 데이터를 초기화합니다.");
      sessionStorage.removeItem("intake_persistence");
      if (user?.email) localStorage.removeItem(`intake_backup_${user.email}`);
      setIsHydrated(true);
      return; // 신규 데이터로 시작 (useState 기본값 사용)
    }

    if (applicationId && user?.email) {
      fetchApplicationDetail(applicationId);
    } else {
      // 1-1. 신규 모드: 세션 저장소(현재 탭) 확인
      let savedData = sessionStorage.getItem("intake_persistence");
      
      // 1-2. 세션에 없으면 로컬 백업(계정별) 확인
      if (!savedData && user?.email) {
        savedData = localStorage.getItem(`intake_backup_${user.email}`);
        console.log("세션 데이터가 없어 로컬 백업에서 복구를 시도합니다.");
      }

      if (savedData) {
        try {
          const { data, activeStep, completed, chatFinished, timestamp } = JSON.parse(savedData);
          
          const now = new Date().getTime();
          const isStale = timestamp ? (now - timestamp > 24 * 60 * 60 * 1000) : false;
          
          if (chatFinished || isStale) {
            console.log("기존 저장 데이터가 완료 상태이거나 오래되어 초기화합니다.");
            sessionStorage.removeItem("intake_persistence");
            if (user?.email) localStorage.removeItem(`intake_backup_${user.email}`);
          } else {
            console.log("신청 데이터를 복구했습니다.");
            if (data) setIntakeData((prev: any) => ({ ...prev, ...data, request_id: prev.request_id }));
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
        
        // [보강] 전체 데이터를 그대로 보존하면서 특정 필드만 가공
        const rawCrmData = data.data || data;
        
        // interest_areas와 special_notes를 안전하게 배열로 변환 (rawCrmData 기준)
        const interestAreas = Array.isArray(rawCrmData.interest_areas) 
          ? rawCrmData.interest_areas 
          : typeof rawCrmData.interest_areas === 'string' 
            ? rawCrmData.interest_areas.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
            
        const specialNotes = Array.isArray(rawCrmData.special_notes) 
          ? rawCrmData.special_notes 
          : typeof rawCrmData.special_notes === 'string' 
            ? rawCrmData.special_notes.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];

        setIntakeData((prev: any) => ({
          ...prev,
          ...rawCrmData,
          interest_areas: interestAreas,
          special_notes: specialNotes,
          request_id: rawCrmData.request_id || id, // ID 불일치 방지
        }));
        
        const currentStatus = (rawCrmData.status || '').toString().toLowerCase().trim();
        console.log(`[Intake/Resume] 현재 상태: "${currentStatus}"`);

        // [수정] 상담 완료 여부 체크: 오직 chat_summary 필드 존재 여부만 확인
        const hasChatData = !!rawCrmData.chat_summary;

        if (hasChatData) {
          setIsChatFinished(true);
          console.log("[Intake/Resume] chat_summary가 확인되어 Step 3를 완료 상태로 유지합니다.");
        } else {
          setIsChatFinished(false);
        }

        // 상태별 단계 매핑 (Robust Mapping)
        if (currentStatus === 'sec1' || currentStatus === 'basic_complete') {
          setCompletedSteps(['section-1']);
          setValue('section-2');
        } else if (currentStatus === 'sec2' || currentStatus === 'schedule_complete') {
          // 2단계 완료 상태인데 이미 상담 데이터가 있다면 4단계로 점프
          if (hasChatData) {
            setCompletedSteps(['section-1', 'section-2', 'section-3']);
            setValue('section-4');
          } else {
            setCompletedSteps(['section-1', 'section-2']);
            setValue('section-3');
          }
        } else if (currentStatus === 'sec3' || currentStatus === 'chat_complete' || hasChatData) {
          setCompletedSteps(['section-1', 'section-2', 'section-3']);
          setIsChatFinished(true);
          // 3단계 완료 후에는 약관동의(4단계)가 기본
          setValue('section-4');
        } else if (['pending', 'confirmed', 'final_submitted', 'submitted'].includes(currentStatus)) {
          setCompletedSteps(['section-1', 'section-2', 'section-3', 'section-4', 'section-5']);
          setIsChatFinished(true);
          setValue('section-5');
        } else {
          // 상태가 명확하지 않지만 데이터는 있을 수 있음 -> 데이터가 있으면 Step 1 완료 처리 시도
          if (rawCrmData.name && rawCrmData.regional_local_government) {
             setCompletedSteps(['section-1']);
             setValue('section-2');
          } else {
             setCompletedSteps([]);
             setValue('section-1');
          }
          setIsChatFinished(false);
        }
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

  // 2. 상태 변경 시마다 자동 저장 (신규 작성(isEditMode=false)일 때만!)
  React.useEffect(() => {
    if (isHydrated && !isEditMode) {
      const persistence = {
        data: intakeData,
        activeStep: value,
        completed: completedSteps,
        chatFinished: isChatFinished,
        timestamp: new Date().getTime()
      };
      // 탭 내 독립 세션 저장
      sessionStorage.setItem("intake_persistence", JSON.stringify(persistence));
      // 데이터 유실 방지용 계정별 백업 (탭 닫혀도 유지)
      if (user?.email) {
        localStorage.setItem(`intake_backup_${user.email}`, JSON.stringify(persistence));
      }
    }
  }, [intakeData, value, completedSteps, isChatFinished, isHydrated, isEditMode, user?.email]);

  // 유저 정보가 뒤늦게 로드되거나 변경될 경우 intakeData에 동기화
  React.useEffect(() => {
    if (user && !intakeData.email && isHydrated) {
      setIntakeData((prev: any) => ({
        ...prev,
        user_id: user.id,
        email: user.email,
        role: (user as any).role,
        password_hash: (user as any).password_hash,
        name: user?.user_metadata?.full_name || prev.name,
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
    let storedUser: any = user;
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
    } else if (step === "section-4") {
      try {
        await postToWebhook(WEBHOOK_URLS.CONSENT_COMPLETE, {
          request_id: intakeData.request_id,
          user_id: storedUser?.id || "",
          email: storedUser?.email || "",
          time: kstTime,
          status: "pending"
        });
        console.log("✅ [약관 동의 완료 웹훅 전송 성공]");
      } catch (err) {
        console.error("🚨 [약관 동의 웹훅 전송 실패]", err);
      }
      setValue("section-5");
    }
  };

  const handleFinalSubmit = async () => {
    // 2, 3순위 예약이 비어있는 경우 최종 제출 전 경고 (1회 한정)
    if ((!intakeData.request_time_2 || !intakeData.request_time_3) && !hasWarnedRankFinal) {
      setToast("더 원활한 배정을 위해 2, 3순위 예약까지 모두 채워주시는 것을 추천드려요! 한 번 더 누르면 그대로 제출됩니다.");
      setHasWarnedRankFinal(true);
      setTimeout(() => setToast(""), 3000);
      return;
    }

    const kstTime = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).substring(0, 19);
    
    // user 객체가 있더라도 password_hash가 비어있다면 sessionStorage를 다시 확인
    let storedUser: any = user;
    if (!storedUser || !storedUser.password_hash) {
      if (typeof window !== 'undefined') {
        const sessionUser = JSON.parse(sessionStorage.getItem("user") || 'null');
        if (sessionUser) {
          storedUser = { ...storedUser, ...sessionUser };
        }
      }
    }

    // 최종 제출 시 n8n으로 전체 요약 데이터 전송
    // TODO(Backend Integration): 추후 ConsentForm.tsx에서 동의된 약관 내역(agreements 객체 등)이 
    // intakeData 상태에 포함되도록 handleStepComplete("section-4", data)를 통해 병합한 뒤, 
    // 아래의 웹훅 전송 페이로드에 포함시켜 백엔드(DB)로 함께 전달해야 합니다.
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
        // 제출 성공 시 저장 데이터 삭제
        sessionStorage.removeItem("intake_persistence");
        if (storedUser?.email) {
          localStorage.removeItem(`intake_backup_${storedUser.email}`);
        }
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

  const isReadOnly = intakeData.status === 'pending' || intakeData.status === 'confirmed';

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
            <p className="text-lg text-slate-500 font-bold max-w-2xl break-keep whitespace-pre-line">
              {"복잡한 정책들 사이에서 헤매지 마세요.\n열고닫기의 AI가 당신의 상황을 분석하여 정확한 솔루션을 제안해 드립니다."}
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
                  style={{ width: `${completedSteps.length === 0 ? 3 : completedSteps.length === 1 ? 25 : completedSteps.length === 2 ? 50 : completedSteps.length === 3 ? 75 : completedSteps.length >= 4 ? 100 : 100}%` }}
                >
                   <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-[progress-stripe_1s_linear_infinite]" />
                </div>
             </div>
             <div className="flex justify-between mt-3 px-1">
                {["기본정보", "상담예약", "AI진단", "약관동의", "신청확인"].map((step, idx) => (
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
          <Accordion.Item value="section-1" className={`bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500 data-[state=open]:ring-4 data-[state=open]:ring-primary/5 data-[state=open]:-translate-y-1 ${isReadOnly ? "opacity-40 grayscale pointer-events-none" : ""}`}>
            <Accordion.Header className="flex">
              <Accordion.Trigger className="flex-1 flex items-center justify-between p-10 text-left group">
                <div className="flex items-center gap-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${completedSteps.includes("section-1") ? "bg-green-50 text-green-600 scale-110 shadow-inner" : "bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white"}`}>
                    {completedSteps.includes("section-1") ? <CheckCircle size={32} /> : <Info size={32} />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">Step 01. 맞춤 데이터 입력</h3>
                    <p className="text-[13px] text-slate-400 font-bold">당신을 더 잘 이해하기 위한<br />기초 정보를 수집합니다.</p>
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

          <Accordion.Item value="section-2" className={`bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500 data-[state=open]:ring-4 data-[state=open]:ring-primary/5 data-[state=open]:-translate-y-1 ${(!completedSteps.includes("section-1") || isReadOnly) ? "opacity-40 grayscale pointer-events-none" : ""}`}>
            <Accordion.Header className="flex">
              <Accordion.Trigger className="flex-1 flex items-center justify-between p-10 text-left group">
                <div className="flex items-center gap-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${completedSteps.includes("section-2") ? "bg-green-50 text-green-600 scale-110 shadow-inner" : "bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white"}`}>
                    {completedSteps.includes("section-2") ? <CheckCircle size={32} /> : <Calendar size={32} />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">Step 02. 상담 일정 예약</h3>
                    <p className="text-[13px] text-slate-400 font-bold">전문 상담사와 깊이 있는 대화를<br />나눌 시간을 조율합니다.</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                   <ChevronDown className="text-slate-400 group-data-[state=open]:rotate-180 transition-transform duration-500" size={20} />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-12 pb-12 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
               <div className="pt-8">
                 <ScheduleForm 
                    data={intakeData} 
                    onNext={(data) => handleStepComplete("section-2", data)} 
                    onPrev={() => setValue("section-1")}
                    onShowToast={(msg) => {
                      setToast(msg);
                      setTimeout(() => setToast(""), 3000);
                    }}
                  />
               </div>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item 
            value="section-3" 
            className={`bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500 data-[state=open]:ring-4 data-[state=open]:ring-primary/5 data-[state=open]:-translate-y-1 ${
              (!completedSteps.includes("section-2") || isReadOnly) ? "opacity-40 grayscale pointer-events-none" : ""
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
                        : <>간편한 채팅을 통해 현재 상황과<br />필요한 도움을 이야기해 주세요.</>}
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
                        상담 결과가 분석되어 전문가에게 전달되었습니다.<br />
                        세부 요청 사항은 'Step 5'에서 최종 확인 및 수정이 가능합니다.
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

          <Accordion.Item value="section-4" className={`bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500 data-[state=open]:ring-4 data-[state=open]:ring-primary/5 data-[state=open]:-translate-y-1 ${(!isChatFinished || isReadOnly) ? "opacity-40 grayscale pointer-events-none" : ""}`}>
            <Accordion.Header className="flex">
              <Accordion.Trigger className="flex-1 flex items-center justify-between p-10 text-left group">
                <div className="flex items-center gap-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${completedSteps.includes("section-4") ? "bg-green-50 text-green-600 scale-110 shadow-inner" : "bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white"}`}>
                    {completedSteps.includes("section-4") ? <CheckCircle size={32} /> : <ShieldCheckIcon size={32} />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">Step 04. 서비스 이용 동의</h3>
                    <p className="text-[13px] text-slate-400 font-bold">안전한 맞춤 상담을 위해<br />약관에 동의해 주세요.</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                   <ChevronDown className="text-slate-400 group-data-[state=open]:rotate-180 transition-transform duration-500" size={20} />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-12 pb-12 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
               <div className="pt-8">
                <ConsentForm 
                  onPrev={() => setValue("section-3")}
                  onNext={() => handleStepComplete("section-4", {})} 
                />
              </div>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="section-5" className={`bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500 data-[state=open]:ring-4 data-[state=open]:ring-primary/5 data-[state=open]:-translate-y-1 ${!completedSteps.includes("section-4") ? "opacity-40 grayscale pointer-events-none" : ""}`}>
            <Accordion.Header className="flex">
              <Accordion.Trigger className="flex-1 flex items-center justify-between p-10 text-left group">
                <div className="flex items-center gap-8">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${completedSteps.includes("section-5") ? "bg-green-50 text-green-600 scale-110 shadow-inner" : "bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white"}`}>
                    {completedSteps.includes("section-5") ? <CheckCircle size={32} /> : <CheckCircle size={32} />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">Step 05. 최종 리포트 확인</h3>
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
                  isReadOnly={isReadOnly}
                />
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </div>

      {/* 토스트 메시지 */}
      {toast && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-5 rounded-[2rem] shadow-2xl border-2 border-white flex items-center gap-4 min-w-[320px]">
            <AlertCircle size={24} className="flex-shrink-0" />
            <span className="font-black text-sm whitespace-pre-line">{toast}</span>
          </div>
        </div>
      )}
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
