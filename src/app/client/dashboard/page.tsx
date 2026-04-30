"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { 
  FileText, 
  Calendar, 
  MessageSquare, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Loader2,
  Briefcase,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle,
  X,
  Trash2,
  Send
} from "lucide-react";
import Link from "next/link";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // 취소 모달 상태
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelStatus, setCancelStatus] = useState<"idle" | "loading" | "success">("idle");

  const fetchApplications = async (forceRefresh = false) => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const CACHE_DURATION = 5 * 60 * 1000; // 5분
    const now = Date.now();
    
    if (forceRefresh) {
      console.log('강제 새로고침: 캐시 무시');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('dashboard_cache');
      }
    } else {
      if (lastFetched && (now - lastFetched < CACHE_DURATION)) {
        console.log('캐시된 데이터 사용 중...');
        setLoading(false);
        return;
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      // 항상 타임스탬프를 붙여 브라우저/프록시 캐시를 강제 우회
      const url = `/api/applications?email=${encodeURIComponent(user.email)}&_t=${now}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      
      if (res.ok) {
        setApplications(data.applications || []);
        setLastFetched(now);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('dashboard_cache_v2', JSON.stringify({
            data: data.applications,
            timestamp: now,
            email: user.email
          }));
        }
      } else {
        setError(data.error || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = async (requestId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setCancelingId(requestId);
    setCancelStatus("idle");
    setShowCancelModal(true);
  };

  const confirmCancelAction = async () => {
    if (!cancelingId || !user?.email) return;
    
    setCancelStatus("loading");

    try {
      const res = await fetch('/api/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: cancelingId, email: user.email })
      });

      const data = await res.json();
      if (res.ok) {
        setCancelStatus("success");
        // 상태에서 즉시 제거
        setApplications(prev => prev.filter(app => (app.request_id || app.id) !== cancelingId));
        
        // 2초 뒤 모달 닫기 및 데이터 갱신
        setTimeout(() => {
          setShowCancelModal(false);
          fetchApplications(true);
        }, 2000);
      } else {
        alert(data.error || "취소 중 오류가 발생했습니다.");
        setCancelStatus("idle");
      }
    } catch (err) {
      console.error('Cancel application error:', err);
      alert("서버 통신 중 오류가 발생했습니다.");
      setCancelStatus("idle");
    }
  };

  useEffect(() => {
    // 로그인(user 변경) 시 캐시를 무시하고 항상 최신 데이터 조회
    // DB에서 삭제된 내역이 캐시로 인해 남아있는 것을 방지
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dashboard_cache');
    }
    fetchApplications();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="animate-in fade-in slide-in-from-left duration-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Logged In</span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">반가워요, {user?.user_metadata?.full_name || "내담자"}님!</h1>
          <p className="text-zinc-500 mt-2 font-medium">현재 진행 중인 상담 현황을 실시간으로 확인하실 수 있습니다.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchApplications(true)}
            disabled={loading}
            className="bg-white border border-zinc-200 text-zinc-700 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:border-primary/30 transition-all text-sm disabled:opacity-50 shadow-sm"
          >
            <Clock size={16} className={loading ? "animate-spin" : ""} />
            새로고침
          </button>
          <Link 
            href="/client/intake"
            className="bg-primary text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 btn-interactive shadow-lg shadow-indigo-100 text-sm"
          >
            <PlusCircle size={18} /> 새 상담 신청하기
          </Link>
        </div>
      </div>

      {/* 일정 확정 알림 배너 */}
      {!loading && applications.some(app => app.status === 'confirmed') && (
        <div className="mb-10 animate-in slide-in-from-top duration-500">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-700 rounded-[2.5rem] p-8 shadow-xl shadow-blue-100/50 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-colors" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/30 shadow-inner">
                  <Calendar size={32} />
                </div>
                <div className="text-white text-center md:text-left">
                  <h2 className="text-xl font-black tracking-tight mb-1">상담 일정이 확정되었습니다! 📅</h2>
                  <p className="text-blue-50/80 font-bold text-sm">배정된 전문 상담사와의 상담 시간이 확정되었으니 안내를 확인해 주세요.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  window.scrollTo({ top: document.getElementById('my-applications')?.offsetTop, behavior: 'smooth' });
                }}
                className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                일정 확인하기 <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상담 완료 알림 배너 */}
      {!loading && applications.some(app => app.status === 'analyzed') && (
        <div className="mb-10 animate-in slide-in-from-top duration-500">
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2.5rem] p-8 shadow-xl shadow-emerald-100/50 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-colors" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/30 shadow-inner">
                  <Sparkles size={32} />
                </div>
                <div className="text-white text-center md:text-left">
                  <h2 className="text-xl font-black tracking-tight mb-1">상담 분석 리포트가 도착했습니다! 🎉</h2>
                  <p className="text-emerald-50/80 font-bold text-sm">기다려주셔서 감사합니다. {user?.user_metadata?.full_name}님만을 위한 맞춤형 결과가 준비되었습니다.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const firstAnalyzed = applications.find(app => app.status === 'analyzed');
                  if (firstAnalyzed) {
                    window.open(`/report/${firstAnalyzed.request_id || firstAnalyzed.id}`, '_blank');
                  }
                }}
                className="bg-white text-emerald-700 px-8 py-4 rounded-2xl font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                지금 리포트 확인하기 <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-10" id="my-applications">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2 mb-4">
            <FileText size={20} className="text-primary" /> 나의 상담 리스트
          </h2>
          
          {loading ? (
            <div className="card-premium p-16 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <p className="text-zinc-500 font-bold">정보를 안전하게 불러오는 중입니다...</p>
            </div>
          ) : error ? (
            <div className="card-premium p-12 text-center space-y-4 bg-rose-50/50 border-rose-100 animate-in zoom-in-95 duration-300">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
              <div>
                <p className="text-rose-900 font-bold mb-2 text-lg">기록을 불러올 수 없습니다</p>
                <p className="text-rose-600 font-medium">{error}</p>
                <button 
                   onClick={() => fetchApplications(true)}
                   className="mt-6 px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200"
                >
                   다시 시도하기
                </button>
              </div>
            </div>
          ) : applications.filter(app => app.status !== 'canceled').length > 0 ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {applications.filter(app => app.status !== 'canceled').map((app) => {
                const isAnalyzed = app.status === 'analyzed';
                const isCanceled = app.status === 'canceled';
                const requestId = app.request_id || app.id;
                // pending 및 이전 단계만 수정(이어하기) 가능
                // confirmed(확정), analyzed(완료) 등은 수정 불가
                const canResume = !['confirmed', 'analyzed', 'canceled'].includes(app.status);

                return (
                  <div 
                    key={requestId} 
                    onMouseEnter={() => {
                      if (isAnalyzed) setActiveStep(3);
                      else if (app.status === 'confirmed') setActiveStep(2);
                      else if (!isCanceled) setActiveStep(1);
                    }}
                    onMouseLeave={() => setActiveStep(null)}
                    onClick={() => { if (canResume) window.location.href = `/client/intake?id=${requestId}`; }}
                    className={`card-premium p-0 overflow-hidden border-2 transition-all group ${
                      isAnalyzed ? 'border-indigo-100 shadow-indigo-100/50 shadow-xl' :
                      canResume ? 'hover:border-primary/30 hover:shadow-lg cursor-pointer' :
                      'hover:border-rose-100 hover:shadow-sm'
                    }`}
                  >
                    <div className="p-7">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-tight">{new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <h3 className={`font-black text-xl tracking-tight ${isCanceled ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                            {app.name || '내담자'} <span className="text-zinc-400 font-bold text-sm ml-1">({app.age}세, {(() => {
                              const g = (app.gender || app.Gender || "").toString().toLowerCase().trim();
                              if (g === "male" || g === "남성" || g === "남") return "남성";
                              if (g === "female" || g === "여성" || g === "여") return "여성";
                              return g || "성별미정";
                            })()})</span>
                          </h3>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[11px] font-black ${
                          isCanceled ? 'bg-rose-50 text-rose-500 border border-rose-100' :
                          isAnalyzed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm animate-bounce-subtle' :
                          app.status === 'confirmed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' :
                          (app.status === 'pending' || app.status === 'final_submitted' || app.status === 'submitted') ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' :
                          (app.status && app.status.includes('step')) ? 'bg-orange-50 text-orange-600 border border-orange-200 animate-pulse-subtle' :
                          'bg-indigo-50 text-primary border border-indigo-100'
                        }`}>
                          {isCanceled ? '상담 취소됨' : 
                           isAnalyzed ? '상담 완료' : 
                           app.status === 'confirmed' ? '일정 정해짐' : 
                           (app.status === 'pending' || app.status === 'final_submitted' || app.status === 'submitted') ? '신청 완료함' :
                           (app.status === 'step1') ? '기초 정보 입력함' :
                           (app.status === 'step2') ? '상담 일정 확인함' :
                           (app.status === 'step3') ? 'AI 인터뷰 진행함' :
                           (app.status === 'step4') ? '약관에 동의함' :
                           '신청 작성중'}
                        </div>
                      </div>

                      {/* 확정된 상담 시간 표시 (Step 2 연동 확인용) */}
                      {app.status === 'confirmed' && (app.confirmed_datetime || app.confirmed_time) && (
                        <div className="mb-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                              <Calendar size={20} />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">확정된 상담 일시</p>
                              <p className="text-sm font-black text-indigo-900">{app.confirmed_datetime || app.confirmed_time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">방식</p>
                             <p className="text-sm font-black text-indigo-900">
                               {app.confirmed_method === 'online' ? '온라인(비대면)' : 
                                app.confirmed_method === 'offline' ? '오프라인(센터)' : 
                                app.confirmed_method === 'phone' ? '전화 상담' : 
                                (app.confirmed_method || '대면 상담')}
                             </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-3 mb-6">
                        <div className="flex items-center gap-2 text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100/50">
                          <MapPin size={14} className="text-zinc-400" /> 
                          <span className="text-xs font-bold leading-none">{app.location ? (typeof app.location === 'object' ? app.location.regional : app.location) : '지역 정보 없음'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100/50">
                          <Briefcase size={14} className="text-zinc-400" /> 
                          <span className="text-xs font-bold leading-none">{app.job_status || '미입력'}</span>
                        </div>
                      </div>

                      {/* [디자인 개선] 신청 미완료 시 진행률 프로그레스 바 표시 */}
                      {!isAnalyzed && app.status !== 'confirmed' && !['pending', 'final_submitted', 'submitted'].includes(app.status) && (
                        <div className="mb-6 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-black text-orange-600 flex items-center gap-1">
                              <AlertCircle size={12} /> 최종 신청까지 단계가 남았습니다
                            </span>
                            <span className="text-[11px] font-black text-orange-600">
                              {app.status === 'step1' ? '20%' : app.status === 'step2' ? '40%' : app.status === 'step3' ? '60%' : '80%'} 완료
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-orange-100 shadow-inner">
                            <div 
                              className="h-full bg-orange-400 transition-all duration-1000"
                              style={{ width: app.status === 'step1' ? '20%' : app.status === 'step2' ? '40%' : app.status === 'step3' ? '60%' : '80%' }}
                            />
                          </div>
                          <p className="text-[10px] text-orange-400 mt-2 font-bold text-center">아래 '이어하기' 버튼을 눌러 신청을 완료해 주세요!</p>
                        </div>
                      )}

                      {/* 희망 상담 시간 표시 (검토 중일 때) */}
                      {!isAnalyzed && app.status !== 'confirmed' && (app.request_time_1 || app.request_time_2 || app.request_time_3) && (
                        <div className="mb-4 bg-zinc-50 border border-zinc-100 border-dashed rounded-2xl p-4">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Clock size={10} /> 희망 상담 일시 (조율 대기중)
                          </p>
                          <div className="space-y-1.5">
                            {app.request_time_1 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-zinc-500">1순위</span>
                                <span className="font-black text-zinc-700">{app.request_time_1}</span>
                              </div>
                            )}
                            {app.request_time_2 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-zinc-500">2순위</span>
                                <span className="font-black text-zinc-700">{app.request_time_2}</span>
                              </div>
                            )}
                            {app.request_time_3 && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-zinc-500">3순위</span>
                                <span className="font-black text-zinc-700">{app.request_time_3}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isAnalyzed ? (
                        <Link 
                          href={`/report/${requestId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-between p-5 bg-emerald-600 text-white rounded-[24px] group/btn hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                              <Sparkles size={20} />
                            </div>
                            <div className="text-left">
                              <h4 className="font-black text-sm leading-tight">상담 분석 리포트 확인하기</h4>
                              <p className="text-[10px] text-emerald-100 font-bold opacity-80 mt-0.5">나만을 위한 맞춤형 결과가 준비되었습니다.</p>
                            </div>
                          </div>
                          <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-zinc-50/80 rounded-2xl border border-zinc-100 border-dashed">
                          <div className="flex items-center gap-3">
                            {app.status === 'confirmed' ? (
                              <Clock size={16} className="text-indigo-400" />
                            ) : (app.status === 'pending' || app.status === 'final_submitted' || app.status === 'submitted') ? (
                              <CheckCircle size={16} className="text-emerald-500" />
                            ) : (
                              <Loader2 size={16} className="text-zinc-400 animate-spin" />
                            )}
                            <span className="text-xs font-bold text-zinc-500">
                              {app.status === 'confirmed' ? '상담 대기 중입니다. 정해진 시간에 상담을 시작합니다.' : 
                               (app.status === 'pending' || app.status === 'final_submitted' || app.status === 'submitted') ? 
                               '상담 신청이 완료되었습니다. 수정이 필요하시면 \'수정하기\' 버튼을 눌러주세요.' : 
                               '상담 신청을 진행 중입니다. 나머지 단계를 완료해 주세요.'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {app.status === 'confirmed' ? (
                              <span className="text-[11px] font-black text-indigo-500 bg-indigo-50 px-4 py-2 rounded-xl flex items-center gap-1 border border-indigo-100/50 cursor-default">
                                <MessageSquare size={13} /> 상담 준비
                              </span>
                            ) : canResume ? (
                              <Link 
                                href={`/client/intake?id=${requestId}`}
                                className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-primary/20 transition-colors"
                              >
                                {app.status === 'pending' ? '수정하기' : '이어하기'} <ArrowRight size={13} />
                              </Link>
                            ) : null}
                            {!isCanceled && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleCancelApplication(requestId, e); }}
                                className="text-[11px] font-black text-rose-500 hover:text-rose-600 transition-colors"
                              >
                                신청 취소
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-premium p-16 text-center space-y-6 bg-zinc-50/30 border-dashed border-2 animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm text-zinc-200">
                <FileText size={40} />
              </div>
              <div>
                <p className="text-zinc-900 font-black text-lg">아직 신청 내역이 없습니다</p>
                <p className="text-zinc-400 text-sm mt-1 font-medium">새로운 상담 신청을 통해 맞춤 솔루션을 받아보세요.</p>
              </div>
              <Link 
                href="/client/intake"
                className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-zinc-200"
              >
                <PlusCircle size={20} /> 첫 상담 신청하기
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-8 self-start transition-all duration-300">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-primary" /> 현재 진행 단계
          </h2>
          
          <div className={`card-premium p-7 space-y-8 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm border-zinc-100 transition-all duration-500`}>
            <div className={`relative pl-12 transition-all duration-300 ${activeStep === 1 ? 'opacity-100 translate-x-1' : activeStep !== null ? 'opacity-30 grayscale' : 'opacity-100'}`}>
              <div className={`absolute left-0 top-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm transition-all ${activeStep === 1 ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-primary/10 text-primary'}`}>1</div>
              <div>
                <h4 className={`text-sm font-black tracking-tight transition-colors ${activeStep === 1 ? 'text-primary' : 'text-zinc-900'}`}>AI 전사 및 감정 분석</h4>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">대화 내용을 바탕으로 AI가 신청 동기와 심리 상태를 다각도로 분석합니다.</p>
              </div>
            </div>
            
            <div className={`relative pl-12 transition-all duration-300 ${activeStep === 2 ? 'opacity-100 translate-x-1' : activeStep !== null ? 'opacity-30 grayscale' : 'opacity-100'}`}>
              <div className={`absolute left-0 top-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm transition-all ${activeStep === 2 ? 'bg-indigo-400 text-white scale-110 shadow-lg shadow-indigo-400/20' : 'bg-indigo-50 text-indigo-400'}`}>2</div>
              <div>
                <h4 className={`text-sm font-black tracking-tight transition-colors ${activeStep === 2 ? 'text-indigo-600' : 'text-zinc-900'}`}>전문 상담사의 진심 어린 준비</h4>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">내담자님의 상황에 실질적인 도움을 드릴 수 있도록, 전문가가 들려주신 고민을 세밀하게 분석하며 정성을 다해 상담을 설계 중입니다.</p>
              </div>
            </div>
 
            <div className={`relative pl-12 transition-all duration-300 ${activeStep === 3 ? 'opacity-100 translate-x-1' : activeStep !== null ? 'opacity-30 grayscale' : 'opacity-100'}`}>
              <div className={`absolute left-0 top-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm transition-all ${activeStep === 3 ? 'bg-indigo-300 text-white scale-110 shadow-lg shadow-indigo-300/20' : 'bg-indigo-50 text-indigo-300'}`}>3</div>
              <div>
                <h4 className={`text-sm font-black tracking-tight transition-colors ${activeStep === 3 ? 'text-indigo-500' : 'text-zinc-900'}`}>상담 리포트 발급</h4>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">진행한 상담을 바탕으로 신청자님에게 맞는 정보를 정리했습니다.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100/80">
              <a href="https://vibe-coding.notion.site" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 rounded-2xl bg-white border border-zinc-200 hover:border-primary/40 transition-all group shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                    <MessageSquare size={16} />
                  </div>
                  <span className="text-xs font-black text-zinc-700">도움말 및 문의하기</span>
                </div>
                <ChevronRight size={14} className="text-zinc-300 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
          
          <div className="p-6 bg-blue-50/40 rounded-[2rem] border border-blue-100/50">
            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 px-1">Tip</h4>
            <p className="text-[11px] text-blue-700 font-semibold leading-relaxed px-1">
              상담 한 시간 전까지 취소 가능하며, 긴급 문의는 채널톡을 이용해 주세요.
            </p>
          </div>
        </div>
      </div>
      {/* 취소 확인 모달 (매니저 프리미엄 스타일 적용) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => cancelStatus !== "loading" && setShowCancelModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowCancelModal(false)}
              disabled={cancelStatus === "loading"}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${
              cancelStatus === "success" ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-500"
            }`}>
              {cancelStatus === "success" ? <CheckCircle size={28} /> : <Trash2 size={28} />}
            </div>

            <h2 className="text-2xl font-black text-zinc-900 mb-2">
              {cancelStatus === "success" ? "취소가 완료되었습니다" : "상담 신청을 취소할까요?"}
            </h2>
            <p className="text-[14px] text-zinc-500 mb-8 font-bold leading-relaxed">
              {cancelStatus === "success" 
                ? "상담 취소 처리가 안전하게 완료되었습니다. 새로운 상담이 필요하시면 언제든 다시 신청해 주세요."
                : "취소된 신청 정보는 다시 복구할 수 없으며, 상담사에게도 취소 알림이 전달됩니다. 정말 취소하시겠습니까?"}
            </p>

            <div className="flex gap-3">
              {cancelStatus !== "success" && (
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelStatus === "loading"}
                  className="flex-1 py-4 rounded-2xl font-bold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  돌아가기
                </button>
              )}
              <button
                onClick={confirmCancelAction}
                disabled={cancelStatus === "loading" || cancelStatus === "success"}
                className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  cancelStatus === "success" 
                    ? "bg-green-600 text-white w-full" 
                    : "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-lg active:scale-95"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {cancelStatus === "loading" ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> 처리 중...
                  </>
                ) : cancelStatus === "success" ? (
                  "확인"
                ) : (
                  "취소하기"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
