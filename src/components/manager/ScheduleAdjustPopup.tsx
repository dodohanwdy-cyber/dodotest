"use client";

import { useState, useEffect } from "react";
import { X, Calendar, User, Award, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface AnalyzedRequest {
  request_id: string;
  name: string;
  weight_score: number;
  preferred_method?: string; // "online" | "offline" | "phone"
  preferred_location?: string;
  options: {
    p: number;
    time: string; // "YYYY-MM-DD HH:MM"
    is_busy: boolean;
  }[];
  recommendation: {
    status: "auto_assigned" | "manual_required";
    suggested_time: string;
    suggested_priority: number;
  };
}

interface CalendarEvent {
  title: string;
  start: string; // ISO 8601
  end: string;
}

interface ScheduleAdjustPopupProps {
  isOpen: boolean;
  onClose: () => void;
  analyzedList: AnalyzedRequest[];
  calendarEvents: CalendarEvent[];
  onConfirm: (assignments: { request_id: string; assigned_time: string }[]) => void;
}

export default function ScheduleAdjustPopup({ 
  isOpen, 
  onClose, 
  analyzedList, 
  calendarEvents,
  onConfirm 
}: ScheduleAdjustPopupProps) {
  const [assignments, setAssignments] = useState<{ [key: string]: string }>({});
  const [currentWeek, setCurrentWeek] = useState<number>(0); // 0, 1, 2 (3주)
  const [draggedRequest, setDraggedRequest] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'loading' | 'success' | 'error' }[]>([]);

  // 시간대 생성 (9:00 ~ 18:00, 1시간 단위)
  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = 9 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // 현재 주의 일요일부터 7일간
  const getWeekDates = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDayOfWeek);
    
    // 선택된 주로 이동
    const targetSunday = new Date(sunday);
    targetSunday.setDate(sunday.getDate() + (currentWeek * 7));
    
    // 일요일부터 토요일까지 7일
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(targetSunday);
      date.setDate(targetSunday.getDate() + i);
      return date;
    });
  };

  const dates = getWeekDates();

  // 팝업 열릴 때 자동 배정 값으로 초기화 (기존 일정과 충돌 체크)
  useEffect(() => {
    if (isOpen && analyzedList.length > 0) {
      const initial: { [key: string]: string } = {};
      analyzedList.forEach(req => {
        if (req.recommendation.status === "auto_assigned") {
          // 시간 형식 정규화: "2026-02-25 9:00" -> "2026-02-25 09:00"
          const suggestedTime = req.recommendation.suggested_time;
          const [datePart, timePart] = suggestedTime.split(' ');
          const [hour, minute] = timePart.split(':');
          const normalizedTime = `${datePart} ${hour.padStart(2, '0')}:${minute}`;
          
          // 기존 일정과 충돌 체크
          const suggestedDate = new Date(datePart);
          const timeSlot = `${hour.padStart(2, '0')}:${minute}`;
          
          // 기존 일정과 겹치지 않으면 자동 배정
          const hasConflict = calendarEvents.some(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            const suggestedDateTime = new Date(`${datePart}T${timeSlot}:00`);
            
            return suggestedDateTime >= eventStart && suggestedDateTime < eventEnd;
          });
          
          if (!hasConflict) {
            initial[req.request_id] = normalizedTime;
          } else {
            console.log(`[ScheduleAdjustPopup] 충돌 감지 - ${req.name}: ${normalizedTime}`);
          }
        }
      });
      console.log('[ScheduleAdjustPopup] 자동 배정 초기화:', initial);
      console.log('[ScheduleAdjustPopup] Analyzed List:', analyzedList);
      setAssignments(initial);
    }
  }, [isOpen, analyzedList, calendarEvents]);

  // 점심시간 체크 (12:00)
  const isLunchTime = (timeSlot: string) => {
    return timeSlot === "12:00";
  };

  // 주말 체크
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 일요일(0) 또는 토요일(6)
  };

  // 특정 날짜/시간에 기존 일정이 있는지 확인
  const hasExistingEvent = (date: Date, timeSlot: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const targetDateTime = `${dateStr}T${timeSlot}:00`;
    
    return calendarEvents.some(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const targetTime = new Date(targetDateTime);
      
      return targetTime >= eventStart && targetTime < eventEnd;
    });
  };

  // 특정 날짜/시간의 기존 일정 가져오기
  const getExistingEvent = (date: Date, timeSlot: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const targetDateTime = `${dateStr}T${timeSlot}:00`;
    
    return calendarEvents.find(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const targetTime = new Date(targetDateTime);
      
      return targetTime >= eventStart && targetTime < eventEnd;
    });
  };

  // 특정 날짜/시간에 배정된 신청이 있는지 확인
  const getAssignedRequest = (date: Date, timeSlot: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const targetDateTime = `${dateStr} ${timeSlot}`;
    
    const requestId = Object.entries(assignments).find(
      ([_, assignedTime]) => {
        const match = assignedTime === targetDateTime;
        if (match) {
          console.log('[getAssignedRequest] 매칭 발견:', { targetDateTime, assignedTime, requestId: _ });
        }
        return match;
      }
    )?.[0];
    
    return requestId ? analyzedList.find(req => req.request_id === requestId) : null;
  };

  // 드래그 시작
  const handleDragStart = (requestId: string) => {
    setDraggedRequest(requestId);
  };

  // 드롭 처리
  const handleDrop = (date: Date, timeSlot: string) => {
    if (!draggedRequest) return;
    
    const dateStr = date.toISOString().split('T')[0];
    const targetDateTime = `${dateStr} ${timeSlot}`;
    
    // 점심시간, 주말, 기존 일정이 있으면 드롭 불가
    if (isLunchTime(timeSlot) || isWeekend(date) || hasExistingEvent(date, timeSlot)) {
      alert('이 시간대에는 배정할 수 없습니다.');
      setDraggedRequest(null);
      return;
    }
    
    setAssignments(prev => ({
      ...prev,
      [draggedRequest]: targetDateTime
    }));
    
    setDraggedRequest(null);
  };

  // 배정 취소
  const handleRemoveAssignment = (requestId: string) => {
    console.log('[handleRemoveAssignment] 배정 취소:', requestId);
    setAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[requestId];
      console.log('[handleRemoveAssignment] 업데이트된 assignments:', newAssignments);
      return newAssignments;
    });
  };

  // 토스트 알림 함수
  const showToast = (message: string, type: 'loading' | 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // success와 error는 3초 후 자동 제거
    if (type !== 'loading') {
      setTimeout(() => hideToast(id), 3000);
    }
    
    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 확정 처리
  const handleConfirm = async () => {
    try {
      // 토스트 알림: 처리 시작
      const toastId = showToast('일정을 확정하는 중입니다...', 'loading');
      
      // assignments를 배열로 변환하고 추가 정보 포함
      const assignmentsData = Object.entries(assignments).map(([request_id, assigned_time]) => {
        const request = analyzedList.find(r => r.request_id === request_id);
        
        return {
          request_id,
          name: request?.name || '',
          assigned_time,
          title: `${request?.name || ''} 상담`,
          confirmed_method: request?.preferred_method || '',
          confirmed_location: request?.preferred_location || ''
        };
      });
      
      console.log('[handleConfirm] 전송 데이터:', assignmentsData);
      
      // ADJUST_SCHEDULE 웹훅 호출
      const response = await fetch('https://webhook-processor-production-1f39e.up.railway.app/webhook/schedule-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          manager_email: 'manager_dodo@dodo.com', // TODO: 실제 매니저 이메일로 변경
          assignments: assignmentsData,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('일정 확정에 실패했습니다');
      }
      
      const result = await response.json();
      console.log('[handleConfirm] 웹훅 응답:', result);
      console.log('[handleConfirm] 응답 타입:', typeof result);
      console.log('[handleConfirm] 응답이 배열인가?', Array.isArray(result));
      
      // 응답 데이터 구조 확인
      if (result) {
        console.log('[handleConfirm] 응답 키:', Object.keys(result));
        if (Array.isArray(result) && result.length > 0) {
          console.log('[handleConfirm] 첫 번째 요소:', result[0]);
          console.log('[handleConfirm] 첫 번째 요소 키:', Object.keys(result[0]));
        }
      }
      
      // 토스트 알림: 처리 완료
      hideToast(toastId);
      showToast('일정이 확정되었습니다!', 'success');
      
      // 부모 컴포넌트에 전체 응답 전달 (ManagerDashboard에서 파싱)
      onConfirm(result);
      
      // 토스트 메시지를 보여주기 위해 1.5초 대기 후 팝업 닫기
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('[handleConfirm] 에러:', error);
      showToast('일정 확정 중 오류가 발생했습니다.', 'error');
    }
  };

  // 가중치 점수에 따른 색상
  const getScoreColor = (score: number) => {
    if (score >= 20) return "bg-red-500";
    if (score >= 15) return "bg-orange-500";
    if (score >= 10) return "bg-yellow-500";
    return "bg-green-500";
  };

  // 미배정 신청 목록
  const unassignedRequests = analyzedList.filter(
    req => !assignments[req.request_id]
  );

  // 주 이동
  const handlePrevWeek = () => {
    if (currentWeek > 0) setCurrentWeek(currentWeek - 1);
  };

  const handleNextWeek = () => {
    if (currentWeek < 2) setCurrentWeek(currentWeek + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] max-w-[95vw] w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-zinc-100">
        {/* 헤더 - 더욱 깨끗한 느낌 */}
        <div className="px-8 py-7 border-b border-zinc-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-13 h-13 bg-blue-50/50 rounded-2xl flex items-center justify-center">
                <Calendar className="text-blue-500" size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">일정 최적 조율</h2>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-bold rounded-full border border-blue-100/50 uppercase tracking-wider">Smart Mode</span>
                </div>
                <p className="text-zinc-500 text-sm mt-1 font-medium">
                  가장 매칭률이 높은 시간을 AI가 추천해 드립니다 
                  <span className="text-blue-500 font-bold ml-2">
                    ({Object.keys(assignments).length}/{analyzedList.length}건 배정 완료)
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-11 h-11 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-auto p-8 bg-[#fafafa]">
          <div className="grid grid-cols-12 gap-8">
            {/* 왼쪽: 캘린더 그리드 */}
            <div className="col-span-9">
              <div className="bg-white rounded-[32px] p-6 border border-zinc-200/60 shadow-sm">
                {/* 주 선택 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrevWeek}
                      disabled={currentWeek === 0}
                      className="w-8 h-8 bg-white hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors border border-zinc-200"
                    >
                      <ChevronLeft size={16} className="text-zinc-600" />
                    </button>
                    <span className="text-sm font-bold text-zinc-700">
                      {currentWeek + 1}주차 ({dates[0].toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ~ {dates[6].toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })})
                    </span>
                    <button
                      onClick={handleNextWeek}
                      disabled={currentWeek === 2}
                      className="w-8 h-8 bg-white hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors border border-zinc-200"
                    >
                      <ChevronRight size={16} className="text-zinc-600" />
                    </button>
                  </div>
                  <div className="text-xs text-zinc-500">
                    ◀ ▶ 버튼으로 3주간의 일정을 확인하세요
                  </div>
                </div>

                {/* 날짜 헤더 */}
                <div className="grid grid-cols-8 gap-3 mb-6">
                  <div className="text-[10px] font-bold text-zinc-300 text-center uppercase tracking-widest flex items-center justify-center">Time</div>
                  {dates.map((date, idx) => {
                    const isWeekendDay = isWeekend(date);
                    const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];
                    return (
                      <div key={idx} className={`text-center py-2 rounded-2xl ${isToday ? 'bg-blue-50/50' : ''}`}>
                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                          date.getDay() === 0 ? 'text-rose-400' : 
                          date.getDay() === 6 ? 'text-blue-400' : 
                          isToday ? 'text-blue-500' : 'text-zinc-300'
                        }`}>
                          {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}
                        </div>
                        <div className={`text-lg font-bold tracking-tight ${
                          isToday ? 'text-blue-500' : 'text-zinc-900'
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 시간대 그리드 */}
                <div className="space-y-2">
                  {timeSlots.map((timeSlot) => {
                    const isLunch = isLunchTime(timeSlot);
                    
                    return (
                      <div key={timeSlot} className="grid grid-cols-8 gap-3">
                        {/* 시간 라벨 */}
                        <div className={`flex items-center justify-center text-[10px] font-bold rounded-2xl py-3 border ${
                          isLunch ? 'bg-zinc-100 border-zinc-100 text-zinc-400' : 'bg-white border-zinc-100 text-zinc-400'
                        }`}>
                          {timeSlot}
                        </div>
                        
                        {/* 날짜별 셀 */}
                        {dates.map((date, idx) => {
                          const existingEvent = getExistingEvent(date, timeSlot);
                          const assignedRequest = getAssignedRequest(date, timeSlot);
                          const isWeekendDay = isWeekend(date);
                          const isBusy = hasExistingEvent(date, timeSlot) || isLunch || isWeekendDay;
                          
                          return (
                            <div
                              key={idx}
                              onDragOver={(e) => {
                                if (!isBusy) e.preventDefault();
                              }}
                              onDrop={() => handleDrop(date, timeSlot)}
                              className={`min-h-[70px] rounded-2xl border transition-all duration-200 relative group overflow-hidden ${
                                isBusy
                                  ? 'bg-zinc-50 border-zinc-100 cursor-not-allowed'
                                  : draggedRequest
                                  ? 'bg-blue-50/50 border-blue-200 border-dashed animate-pulse'
                                  : 'bg-white border-zinc-100 hover:border-blue-200 hover:shadow-sm'
                              }`}
                            >
                              {/* 점심시간 표시 */}
                              {isLunch && !isWeekendDay && (
                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/30">
                                  <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">Lunch</span>
                                </div>
                              )}

                              {/* 주말 표시 */}
                              {isWeekendDay && !isLunch && (
                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/20">
                                  <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">Off</span>
                                </div>
                              )}
                              
                              {/* 기존 일정 (캘린더 점유) */}
                              {existingEvent && !isLunch && !isWeekendDay && (
                                <div className="absolute inset-1 p-2 bg-zinc-100 rounded-xl border border-zinc-200/50 flex flex-col justify-center">
                                  <p className="text-[9px] font-bold text-zinc-400 truncate opacity-80">
                                    {existingEvent.title}
                                  </p>
                                </div>
                              )}
                              
                              {/* 배정된 신청 (우리가 배정한 것) */}
                              {assignedRequest && !existingEvent && !isLunch && !isWeekendDay && (
                                <div className={`absolute inset-1 p-2 rounded-xl flex flex-col justify-between shadow-sm border border-white/20 ${
                                  assignedRequest.weight_score >= 80 ? 'bg-blue-500 text-white' :
                                  assignedRequest.weight_score >= 50 ? 'bg-indigo-400 text-white' :
                                  'bg-sky-400 text-white'
                                }`}>
                                  <div className="flex items-start justify-between">
                                    <p className="text-[10px] font-bold leading-tight truncate mr-2">
                                      {assignedRequest.name}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveAssignment(assignedRequest.request_id);
                                      }}
                                      className="w-4 h-4 bg-white/20 hover:bg-white/40 rounded flex items-center justify-center transition-colors"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 bg-white rounded-full"></div>
                                    <p className="text-[8px] font-bold opacity-90 uppercase tracking-tighter">
                                      {assignedRequest.weight_score} pts
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 오른쪽: 미배정 신청 목록 - 세련된 사이드바 */}
            <div className="col-span-3 space-y-4">
              <div className="bg-white rounded-[28px] p-6 border border-zinc-200/60 shadow-sm sticky top-0 h-fit">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-1">미배정 신청</h3>
                  <span className="bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-lg text-[10px] font-bold">{unassignedRequests.length}</span>
                </div>
                <p className="text-zinc-500 text-xs font-medium mb-6 px-1 leading-relaxed">
                  신청 항목을 드래그하여 <br/>원하는 시간대에 배치하세요
                </p>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                  {unassignedRequests.map((request) => {
                    const sortedOptions = [...request.options].sort((a, b) => a.p - b.p);
                    
                    return (
                      <div
                        key={request.request_id}
                        draggable
                        onDragStart={() => handleDragStart(request.request_id)}
                        className="bg-zinc-50 border border-zinc-100/50 rounded-2xl p-4 cursor-grab active:cursor-grabbing hover:bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                              request.weight_score >= 80 ? 'bg-rose-400' :
                              request.weight_score >= 50 ? 'bg-amber-400' :
                              'bg-emerald-400'
                            }`}></div>
                            <span className="font-bold text-sm text-zinc-900">{request.name}</span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          {sortedOptions.slice(0, 2).map((option) => {
                            const [datePart, timePart] = option.time.split(' ');
                            const [hour, minute] = timePart.split(':');
                            const timeSlot = `${hour.padStart(2, '0')}:${minute}`;
                            const normalizedOptionTime = `${datePart} ${timeSlot}`;
                            const optionDateTime = new Date(`${datePart}T${timeSlot}:00`);
                            
                            const hasCalendarConflict = calendarEvents.some(event => {
                              const eventStart = new Date(event.start);
                              const eventEnd = new Date(event.end);
                              return optionDateTime >= eventStart && optionDateTime < eventEnd;
                            });
                            
                            const hasAssignmentConflict = Object.entries(assignments).some(([assignedId, assignedTime]) => {
                              return assignedTime === normalizedOptionTime;
                            });
                            
                            const isBusyOrConflict = hasCalendarConflict || hasAssignmentConflict;
                            
                            return (
                              <div key={option.p} className="flex items-center gap-2 text-[10px] font-medium px-1">
                                <span className="text-zinc-300">{option.p}순위:</span>
                                <span className={isBusyOrConflict ? 'text-rose-300 line-through' : 'text-zinc-500'}>
                                  {option.time.split(' ')[1]}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {request.recommendation.status === "auto_assigned" && (
                          <div className="pt-2.5 border-t border-emerald-100 flex items-center gap-1.5">
                            <Sparkles size={10} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-600">추천 배정 가능</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {unassignedRequests.length === 0 && (
                    <div className="text-center py-12 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-emerald-500">
                        <CheckCircle size={24} />
                      </div>
                      <p className="text-sm font-bold text-zinc-900">배정 완료!</p>
                      <p className="text-xs text-zinc-400 mt-1">모든 신청이 배치되었습니다</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 - 세련된 버튼 레이아웃 */}
        <div className="px-8 py-6 bg-white border-t border-zinc-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-zinc-100 rounded-full"></div>
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Empty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm shadow-blue-200"></div>
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-zinc-300 rounded-full opacity-50"></div>
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Busy</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-8 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-2xl font-bold transition-all duration-200 active:scale-95"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={Object.keys(assignments).length === 0}
              className="px-10 py-3.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:hover:bg-zinc-200 text-white rounded-2xl font-bold border-none transition-all duration-200 active:scale-95 shadow-lg shadow-zinc-200"
            >
              일정 확정하기 ({Object.keys(assignments).length}건)
            </button>
          </div>
        </div>
      </div>

      {/* 토스트 알림 - 토스 스타일 플로팅 카드 */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[10000] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-6 py-4 rounded-[24px] shadow-2xl flex items-center gap-3 min-w-[320px] backdrop-blur-md border border-white/20
              ${toast.type === 'loading' ? 'bg-zinc-900/90 text-white' : ''}
              ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' : ''}
              ${toast.type === 'error' ? 'bg-rose-500/90 text-white' : ''}
              animate-in fade-in slide-in-from-top-4 duration-300
            `}
          >
            {toast.type === 'loading' && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {toast.type === 'success' && (
              <CheckCircle size={18} />
            )}
            {toast.type === 'error' && (
              <AlertCircle size={18} />
            )}
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
