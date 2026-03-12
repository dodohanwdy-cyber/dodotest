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
  Trash2,
  MapPin,
  Sparkles,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

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
        localStorage.removeItem('dashboard_cache');
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
      const url = `/api/applications?email=${encodeURIComponent(user.email)}${forceRefresh ? `&_t=${now}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setApplications(data.applications || []);
        setLastFetched(now);
        if (typeof window !== 'undefined') {
          localStorage.setItem('dashboard_cache', JSON.stringify({
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
    if (!user?.email) return;
    if (!window.confirm("정말 이 상담 신청을 취소하시겠습니까?\n취소 후에는 다시 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, email: user.email })
      });

      const data = await res.json();
      if (res.ok) {
        alert("상담 취소가 완료되었습니다.");
        fetchApplications(true);
      } else {
        alert(data.error || "취소 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error('Cancel application error:', err);
      alert("서버 통신 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && user?.email) {
      const cached = localStorage.getItem('dashboard_cache');
      if (cached) {
        try {
          const { data, timestamp, email } = JSON.parse(cached);
          const CACHE_DURATION = 5 * 60 * 1000;
          const now = Date.now();
          if (email === user.email && (now - timestamp < CACHE_DURATION)) {
            setApplications(data);
            setLastFetched(timestamp);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('캐시 복원 실패:', e);
        }
      }
    }
    fetchApplications();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="animate-in fade-in slide-in-from-left duration-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Logged In</span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">반가워요, {user?.name || "내담자"}님!</h1>
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

      <div className="grid lg:grid-cols-3 gap-10">
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
          ) : applications.length > 0 ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {applications.map((app) => {
                const isAnalyzed = app.status === 'analyzed';
                const isCanceled = app.status === 'canceled';
                const requestId = app.request_id || app.id;

                return (
                  <div 
                    key={requestId} 
                    className={`card-premium p-0 overflow-hidden border-2 transition-all group ${
                      isAnalyzed ? 'border-indigo-100 shadow-indigo-100/50 shadow-xl' : 'hover:border-primary/20 hover:shadow-lg'
                    }`}
                  >
                    <div className="p-7">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[9px] font-black rounded uppercase tracking-wider border border-zinc-200">ID {requestId?.slice(-8)}</span>
                            <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-tight">{new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <h3 className={`font-black text-xl tracking-tight ${isCanceled ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                            {app.name || '내담자'} <span className="text-zinc-400 font-bold text-sm ml-1">({app.age}세, {app.gender === "male" ? "남성" : "여성"})</span>
                          </h3>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[11px] font-black ${
                          isCanceled ? 'bg-rose-50 text-rose-500 border border-rose-100' :
                          isAnalyzed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm animate-bounce-subtle' :
                          'bg-indigo-50 text-primary border border-indigo-100'
                        }`}>
                          {isCanceled ? '상담 취소됨' : 
                           isAnalyzed ? '상담 완료' : 
                           app.status === 'confirmed' ? '상담 확정' : 
                           '신청 완료 (대기중)'}
                        </div>
                      </div>
                      
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

                      {isAnalyzed ? (
                        <Link 
                          href={`/report/${requestId}`}
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
                            <Loader2 size={16} className="text-zinc-400 animate-spin" />
                            <span className="text-xs font-bold text-zinc-500">
                              {isCanceled ? '취소된 신청입니다.' : '상담사가 내용을 검토하고 분석 중입니다.'}
                            </span>
                          </div>
                          {!isCanceled && (
                            <button 
                              onClick={(e) => handleCancelApplication(requestId, e)}
                              className="text-[11px] font-black text-rose-500 hover:text-rose-600 transition-colors"
                            >
                              신청 취소
                            </button>
                          )}
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

        <div className="space-y-6">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-amber-500" /> 리포트 확인 안내
          </h2>
          
          <div className="card-premium p-7 space-y-8 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm border-zinc-100">
            <div className="relative pl-12">
              <div className="absolute left-0 top-0 w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">1</div>
              <div>
                <h4 className="text-sm font-black text-zinc-900 tracking-tight">AI 전사 및 감정 분석</h4>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">대화 내용을 바탕으로 AI가 신청 동기와 심리 상태를 다각도로 분석합니다.</p>
              </div>
            </div>
            
            <div className="relative pl-12">
              <div className="absolute left-0 top-0 w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-black text-sm">2</div>
              <div>
                <h4 className="text-sm font-black text-zinc-900 tracking-tight">담당 상담사 정밀 검토</h4>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">전문가가 AI 분석 결과를 최종 검토하여 맞춤 솔루션을 확정합니다.</p>
              </div>
            </div>

            <div className="relative pl-12">
              <div className="absolute left-0 top-0 w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-black text-sm">3</div>
              <div>
                <h4 className="text-sm font-black text-zinc-900 tracking-tight">내담자용 전용 리포트 발급</h4>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">분석이 완료되면 대시보드에 '완료' 버튼이 활성화되며 리포트 확인이 가능합니다.</p>
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
    </div>
  );
}
