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
  Trash2
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
      // 일반 로드 시 캐시 확인 (메모리 캐시)
      if (lastFetched && (now - lastFetched < CACHE_DURATION)) {
        console.log('캐시된 데이터 사용 중...');
        setLoading(false);
        return;
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      // forceRefresh일 때는 API 라우트에서도 캐시를 무시하도록 타임스탬프 추가
      const url = `/api/applications?email=${encodeURIComponent(user.email)}${forceRefresh ? `&_t=${now}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setApplications(data.applications || []);
        setLastFetched(now);
        // 로컬 스토리지에 캐시 저장
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
    e.preventDefault(); // 카드 전체 클릭 방지
    
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
        fetchApplications(true); // 완전 새로고침하여 캐시 업데이트 및 변경사항 화면 즉각 반영
      } else {
        alert(data.error || "취소 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error('Cancel application error:', err);
      alert("서버 통신 중 오류가 발생했습니다.");
      setLoading(false); // fetchApplications(true)가 안 돌 수 있으므로 에러 시 로딩 해제
    }
  };

  useEffect(() => {
    // 로컬 스토리지에서 캐시 복원
    if (typeof window !== 'undefined' && user?.email) {
      const cached = localStorage.getItem('dashboard_cache');
      if (cached) {
        try {
          const { data, timestamp, email } = JSON.parse(cached);
          const CACHE_DURATION = 5 * 60 * 1000;
          const now = Date.now();
          
          // 같은 사용자이고 캐시가 유효한 경우
          if (email === user.email && (now - timestamp < CACHE_DURATION)) {
            setApplications(data);
            setLastFetched(timestamp);
            setLoading(false);
            console.log('로컬 캐시에서 데이터 복원');
            return;
          }
        } catch (e) {
          console.error('캐시 복원 실패:', e);
        }
      }
    }

    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">내 상담 현황</h1>
          <p className="text-zinc-500 mt-2">상담 신청 내역과 상태를 실시간으로 확인하세요.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchApplications(true)}
            disabled={loading}
            className="bg-white border border-zinc-200 text-zinc-700 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:border-primary/30 transition-all text-sm disabled:opacity-50"
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 현황 요약 카드 */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
            <FileText size={20} className="text-primary" /> 신청 내역
          </h2>
          
          
          {loading ? (
            <div className="card-premium p-12 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <p className="text-zinc-500 text-sm">신청 내역을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="card-premium p-12 text-center space-y-4 bg-blue-50/50 border-blue-100">
              <AlertCircle className="w-12 h-12 text-blue-400 mx-auto" />
              <div>
                <p className="text-blue-900 font-bold mb-2">신청 내역을 불러올 수 없습니다</p>
                <p className="text-blue-600 text-sm">{error}</p>
                {error.includes('n8n') && (
                  <p className="text-blue-500 text-xs mt-3">
                    💡 아직 신청 내역이 없거나 시스템 설정 중일 수 있습니다.
                  </p>
                )}
              </div>
            </div>
          ) : applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((app) => (
                <Link 
                  key={app.request_id || app.id} 
                  href={`/client/intake?id=${app.request_id || app.id}`}
                  className="block"
                >
                  <div className="card-premium p-6 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{app.request_id || app.id}</span>
                        <h3 className={`font-bold text-lg ${app.status === 'canceled' ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                          {app.name || '이름 없음'} ({app.age || '-'}세)
                        </h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold font-sans ${
                        app.status === 'canceled' ? 'bg-rose-50 text-rose-500' :
                        app.status === 'confirmed' ? 'bg-indigo-600 text-white shadow-md' :
                        'bg-indigo-50 text-primary animate-pulse'
                      }`}>
                        {app.status === 'canceled' ? '취소됨' : 
                         app.status === 'confirmed' ? '상담 확정' : 
                         app.status === 'pending' ? '배정 대기 중' :
                         app.status || 'AI 분석 중'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      {app.status === 'confirmed' && app.confirmed_datetime && (
                        <div className="col-span-2 flex items-center gap-2 text-indigo-600 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 mb-1">
                          <Clock size={14} /> 
                          <span className="font-bold text-[13px] text-indigo-700">
                            확정 일자: {new Date(app.confirmed_datetime).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Briefcase size={14} /> <span>{app.job_status || '미입력'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Calendar size={14} /> <span>{app.income_level || '미입력'}</span>
                      </div>
                    </div>

                    {(() => {
                      // interest_areas를 안전하게 배열로 변환
                      const interests = Array.isArray(app.interest_areas) 
                        ? app.interest_areas 
                        : typeof app.interest_areas === 'string' 
                          ? app.interest_areas.split(',').map((s: string) => s.trim()).filter(Boolean)
                          : [];
                      
                      return interests.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {interests.slice(0, 3).map((interest: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">
                              #{interest}
                            </span>
                          ))}
                          {interests.length > 3 && (
                            <span className="px-2 py-1 bg-zinc-100 text-zinc-500 rounded-full text-[10px] font-bold">
                              +{interests.length - 3}
                            </span>
                          )}
                        </div>
                      ) : null;
                    })()}

                    <div className="flex justify-between items-center pt-4 border-t border-zinc-50 mt-4">
                      {app.status !== 'canceled' && app.status !== 'completed' && (
                        <button 
                          onClick={(e) => handleCancelApplication(app.request_id || app.id, e)}
                          className="text-xs font-bold text-rose-400 hover:text-rose-600 flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 size={14} /> 상담 취소
                        </button>
                      )}
                      
                      <div className={`flex items-center gap-1 ml-auto group-hover:gap-2 transition-all ${
                        app.status === 'canceled' ? 'text-zinc-400' : 'text-primary'
                      }`}>
                        <span className="text-xs font-bold">
                          {app.status === 'canceled' ? '내역 보기' : '상세 보기'}
                        </span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card-premium p-12 text-center space-y-4 bg-zinc-50/50 border-dashed">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-zinc-300">
                <FileText size={32} />
              </div>
              <p className="text-zinc-500 text-sm">아직 신청하신 상담 내역이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 안내 사격 관리 섹션 */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
            <AlertCircle size={20} className="text-amber-500" /> 다음 단계 안내
          </h2>
          
          <div className="card-premium p-6 space-y-6 bg-gradient-to-b from-white to-zinc-50/50">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-primary flex-shrink-0 flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">AI 분석 대기</h4>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">입력하신 내용과 채팅 대화를 AI가 분석하여 리포트를 생성 중입니다.</p>
              </div>
            </div>
            
            <div className="flex gap-4 opacity-50">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-400 flex-shrink-0 flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">상담사 배정</h4>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">전문화된 상담사가 배정되어 리포트를 검토할 예정입니다.</p>
              </div>
            </div>

            <div className="flex gap-4 opacity-50">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-400 flex-shrink-0 flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900">본 상담 진행</h4>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">약속된 시간에 비대면/대면 상담이 진행됩니다.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <a href="#" className="flex items-center justify-between p-4 rounded-2xl bg-white border border-zinc-100 hover:border-primary/20 transition-all group">
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-600">고객센터 문의</span>
                </div>
                <ExternalLink size={14} className="text-zinc-300 group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
