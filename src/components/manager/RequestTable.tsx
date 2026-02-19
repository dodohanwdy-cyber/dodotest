import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { MoreHorizontal, Search, FileText, CalendarCheck, User, ChevronDown, ChevronUp, Sparkles, AlertCircle, PlayCircle } from "lucide-react";

export default function RequestTable({ 
  requests, 
  isLoading, 
  onAdjust 
}: { 
  requests?: any[], 
  isLoading: boolean,
  onAdjust: (id: string) => void 
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const displayRequests = requests || [];

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="card-premium overflow-hidden border-zinc-100 shadow-sm">
      <div className="p-6 border-b border-zinc-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50">
        <div>
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <FileText size={18} className="text-primary" /> 실시간 상담 신청 현황
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">LIVE</span>
          </h3>
          <p className="text-zinc-400 text-xs mt-1">행을 클릭하여 AI 분석 요약을 확인하세요.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input 
            type="text" 
            placeholder="이름, 이메일 검색..."
            className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-2 px-10 text-xs outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 border-b border-zinc-100">
              <th className="p-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">신청인</th>
              <th className="p-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">관심분야 / 특이사항</th>
              <th className="p-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-center">상태</th>
              <th className="p-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-center">신청일</th>
              <th className="p-4 text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-4" colSpan={5}><div className="h-10 bg-zinc-50 rounded-lg w-full" /></td>
                </tr>
              ))
            ) : displayRequests.length === 0 ? (
              <tr>
                <td className="p-12 text-center" colSpan={5}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                      <AlertCircle size={24} />
                    </div>
                    <p className="text-zinc-400 text-xs font-medium">표시할 상담 요청이 없습니다.</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayRequests.map((req) => (
                <React.Fragment key={req.id}>
                  <tr 
                    onClick={() => toggleExpand(req.id)}
                    className={`hover:bg-zinc-50/50 transition-all cursor-pointer group ${expandedId === req.id ? 'bg-zinc-50/80' : ''}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                          {req.user_name?.charAt(0) || req.name?.charAt(0) || <User size={14} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-800">{req.user_name || req.name}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">{req.user_email || req.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {req.user_interest && (
                          <span className="bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded-md font-bold ring-1 ring-primary/10">
                            #{req.user_interest}
                          </span>
                        )}
                        {req.special_notes && req.special_notes !== "기타" && (
                          <span className="bg-zinc-100 text-zinc-600 text-[10px] px-2 py-0.5 rounded-md font-bold border border-zinc-200">
                            {req.special_notes}
                          </span>
                        )}
                        {!req.user_interest && !req.special_notes && (
                          <span className="text-zinc-300 text-[10px] italic">기록 없음</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block min-w-[80px] px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight
                        ${req.status === 'pending' || req.status === '대기중' ? 'bg-amber-50 text-amber-500 border border-amber-100' : 
                          req.status === 'confirmed' || req.status === '확정됨' || req.status === 'AI분석완료' ? 'bg-green-50 text-green-500 border border-green-100' : 
                          'bg-zinc-50 text-zinc-400 border border-zinc-100'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-[11px] text-zinc-400 font-medium italic">{req.date || req.created_at}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {(req.status === 'confirmed' || req.status === '확정됨' || req.status === 'AI분석완료') ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/manager/consultation/${req.id}`);
                            }}
                            className="px-3 py-1.5 text-[10px] font-bold bg-primary text-white rounded-lg transition-all shadow-sm hover:shadow-primary/20 flex items-center gap-1.5"
                          >
                            <PlayCircle size={12} /> 상담 시작
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onAdjust(req.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg transition-all border border-primary/20 shadow-sm"
                          >
                            일정 조율
                          </button>
                        )}
                        <div className="text-zinc-300">
                          {expandedId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  {/* AI 프리뷰 확장 영역 */}
                  {expandedId === req.id && (
                    <tr>
                      <td colSpan={5} className="p-0 border-none">
                        <div className="bg-zinc-50/50 px-6 py-4 border-t border-zinc-100/50 animate-in slide-in-for-top-2 duration-300">
                          <div className="card-premium bg-white p-5 border-zinc-100 flex gap-5 items-start shadow-sm border-l-4 border-l-primary">
                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                              <Sparkles size={20} />
                            </div>
                            <div className="space-y-3 flex-1">
                              <div className="flex justify-between items-center">
                                <p className="text-[11px] font-extrabold text-primary uppercase tracking-widest">AI CONSULTATION BRIEFING</p>
                                <button className="text-[10px] font-bold text-zinc-400 hover:text-primary transition-colors flex items-center gap-1">
                                  상세 리포트 보기 <MoreHorizontal size={12} />
                                </button>
                              </div>
                              
                              <div className="space-y-2">
                                <p className="text-sm text-zinc-700 leading-relaxed font-semibold">
                                  {req.pre_consultation_brief || req.chat_summary || "아직 생성된 분석 리포트가 없습니다."}
                                </p>
                                
                                {(req.pre_consultation_brief && req.chat_summary) && (
                                  <div className="mt-4 pt-3 border-t border-dashed border-zinc-100">
                                    <p className="text-[10px] text-zinc-400 mb-1.5 font-bold italic flex items-center gap-1">
                                      <FileText size={10} /> 전체 대화 요약
                                    </p>
                                    <p className="text-xs text-zinc-500 leading-normal">{req.chat_summary}</p>
                                  </div>
                                )}
                              </div>

                              {/* 추가 정보 (군대, 장애 등) 가 있을 경우 표기 */}
                              {req.special_notes && req.special_notes !== "기타" && (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="w-1 h-1 rounded-full bg-primary" />
                                  <span className="text-[10px] font-bold text-zinc-500">주의 사항: {req.special_notes} 관점의 지원 필요</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-zinc-50 bg-zinc-50/10 text-center">
        <button className="text-xs font-bold text-zinc-400 hover:text-primary transition-colors uppercase tracking-widest">
          Load More Requests
        </button>
      </div>
    </div>
  );
}
