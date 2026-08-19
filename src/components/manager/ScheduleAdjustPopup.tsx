"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Calendar, Clock, MapPin, CheckCircle, AlertCircle, X, ChevronLeft, ChevronRight, RefreshCw, Undo, Save, Info, User, Check, Flame } from 'lucide-react';
import UITagBadge from '@/components/common/UITagBadge';
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";

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
  status?: string; // "pending", "confirmed", "in_progress", "completed", "canceled", "cancelled" 등
  confirmed_datetime?: string | null; // "YYYY-MM-DD HH:MM:SS" 형식 또는 null
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
  onConfirm: (webhookResponse: any, canceledIds: string[]) => void;
  managerEmail?: string;
}

export default function ScheduleAdjustPopup({ 
  isOpen, 
  onClose, 
  analyzedList, 
  calendarEvents,
  onConfirm,
  managerEmail = 'manager@opcl.kr'
}: ScheduleAdjustPopupProps) {
  const [assignments, setAssignments] = useState<{ [key: string]: string }>({});
  const [canceledList, setCanceledList] = useState<string[]>([]); // 취소 대기 중인 request_id 목록
  const [resetToAssignedIds, setResetToAssignedIds] = useState<string[]>([]); // 초기화 후 배정대기로 복귀한 request_id 목록
  const [currentWeek, setCurrentWeek] = useState<number>(0); // 0, 1, 2 (3주)
  const [draggedRequest, setDraggedRequest] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'loading' | 'success' | 'error' }[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);

  // 시간대 생성 (9:00 ~ 17:00, 1시간 단위)
  const timeSlots = Array.from({ length: 9 }, (_, i) => {
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
      const initialCanceled: string[] = [];

      analyzedList.forEach(req => {
        // 이미 취소된 상태의 요청은 canceledList에 추가
        if (req.status === "canceled" || req.status === "cancelled") {
          initialCanceled.push(req.request_id);
          return;
        }

        // 기존 배정 내역이 있거나, 취소 목록에 있으면 패스 (초기화 시에는 canceledList는 아직 비어있음)
        // if (assignments[req.request_id] || canceledList.includes(req.request_id)) return; // 이 부분은 초기화 로직이므로 제외

        const isConfirmed = req.status === "confirmed";
        let targetTime: string | undefined;

        // 확정된 데이터이거나 추천 배정인 경우
        if (isConfirmed && req.confirmed_datetime) {
          targetTime = req.confirmed_datetime.substring(0, 16); // "YYYY-MM-DD HH:MM"
        } else if (req.recommendation?.status === "auto_assigned") {
          targetTime = req.recommendation.suggested_time;
        }

        if (targetTime) {
          // 시간 형식 정규화: "2026-02-25 9:00" -> "2026-02-25 09:00"
          const targetTimeParts = targetTime.split(/[ T]/);
          const datePart = targetTimeParts[0] || '';
          const timePart = targetTimeParts[1] || '00:00';
          const [hour, minute] = timePart.split(':');
          const normalizedTime = `${datePart} ${(hour || '00').padStart(2, '0')}:${minute || '00'}`;
          
          // 기존 일정과 충돌 체크 (단, 이미 확정된 건은 체크 생략하여 무조건 배정 상태 유지)
          const suggestedDate = new Date(datePart);
          const timeSlot = `${hour.padStart(2, '0')}:${minute}`;
          
          let collisionFree = true;
          if (!isConfirmed) {
            const hasConflict = calendarEvents.some(event => {
              const eventStart = new Date(event.start);
              const eventEnd = new Date(event.end);
              const suggestedDateTime = new Date(`${datePart}T${timeSlot}:00`);
              
              return suggestedDateTime >= eventStart && suggestedDateTime < eventEnd;
            });
            collisionFree = !hasConflict;
          }
          
          if (collisionFree) {
            initial[req.request_id] = normalizedTime;
          } else {
            console.log(`[ScheduleAdjustPopup] 충돌 감지 - ${req.name}: ${normalizedTime}`);
            // 충돌 발생 시, 해당 요청은 미배정 상태로 둠
          }
        }
      });
      console.log('[ScheduleAdjustPopup] 자동 배정 초기화:', initial);
      console.log('[ScheduleAdjustPopup] 초기 취소 목록:', initialCanceled);
      console.log('[ScheduleAdjustPopup] Analyzed List:', analyzedList);
      
      // 초기화된 id들은 기존 initial 에서 엎어치기로 유지
      resetToAssignedIds.forEach(id => {
        const req = analyzedList.find(r => r.request_id === id);
        if (req && req.confirmed_datetime) {
          initial[id] = req.confirmed_datetime.substring(0, 16);
        }
      });
      
      setAssignments(initial);
      setCanceledList(initialCanceled);
    }
  }, [isOpen, analyzedList, calendarEvents, resetToAssignedIds]);

  // 팝업이 열려있을 때 배경(body) 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
    
    // 할당된 시간과 일치하면서, 취소 대기열에 들어있지 않은(취소되지 않은) 항목만 표시
    const requestId = Object.entries(assignments).find(
      ([id, assignedTime]) => assignedTime === targetDateTime && !canceledList.includes(id)
    )?.[0];
    
    return requestId ? analyzedList.find(req => req.request_id === requestId) : null;
  };

  // 드래그 시작 (미배정 목록 또는 캘린더의 확정 이벤트에서)
  const handleDragStart = (requestId: string) => {
    setDraggedRequest(requestId);
  };

  // 일정 취소 처리 드롭 (휴지통 영역으로 드롭)
  const handleCancelDrop = () => {
    if (draggedRequest) {
      setCanceledList(prev => {
        if (!prev.includes(draggedRequest)) return [...prev, draggedRequest];
        return prev;
      });
      // [수정] 나중에 복구(< 버튼) 시 제자리로 돌아가기 위해 assignments에서는 굳이 지우지 않고 보존합니다.
      // (getAssignedRequest에서 canceledList 체크를 통해 캘린더 화면에서는 자연스레 숨겨짐)
      setDraggedRequest(null);
    }
  };

  // 배정 해제 (X 버튼) - 캘린더에서 빼고 무조건 미배정 대기 목록으로 이동
  const handleRemoveAssignment = (requestId: string) => {
    const newAssignments = { ...assignments };
    delete newAssignments[requestId];
    setAssignments(newAssignments);
    setDraggedRequest(null);
    setHoveredCell(null);
  };

  // 캘린더 영역에 드롭
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

    // 취소 목록에 있었다면 제거
    setCanceledList(prev => prev.filter(id => id !== draggedRequest));
    
    setAssignments(prev => ({
      ...prev,
      [draggedRequest]: targetDateTime
    }));
    
    setDraggedRequest(null);
    setHoveredCell(null);
  };



  // 토스트 알림 함수
  const showToast = (message: string, type: 'loading' | 'success' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9); // 중복 방지를 위한 랜덤 ID
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

  // 확정 버튼 클릭 시 분기
  const handleConfirm = () => {
    if (canceledList.length > 0) {
      setShowCancelConfirm(true);
      return;
    }
    executeConfirm();
  };

  // 실제 확정 로직 실행
  const executeConfirm = async () => {
    setShowCancelConfirm(false);
    
    try {
      // 토스트 알림: 처리 시작
      const toastId = showToast('일정을 확정하는 중입니다...', 'loading');
      
      // assignments 중 현재 취소 대기열에 있는 건들은 제외하고 발송해야 함
      const validAssignments = Object.entries(assignments).filter(
        ([reqId, _]) => !canceledList.includes(reqId)
      );

      // 배열로 변환하고 추가 정보 포함
      const assignmentsData = validAssignments.map(([request_id, assigned_time]) => {
        const request = analyzedList.find(r => r.request_id === request_id);
        
        return {
          request_id,
          name: request?.name || '',
          confirmed_datetime: assigned_time,
          title: `${request?.name || ''} 상담`,
          confirmed_method: request?.preferred_method || '',
          confirmed_location: request?.preferred_location || ''
        };
      });
      
      console.log('[handleConfirm] 전송 데이터:', assignmentsData);
      
      let finalResult = null;
      let hasError = false;
      
      // 1. 배정 웹훅 호출
      if (assignmentsData.length > 0) {
        const assignResponse = await postToWebhook(WEBHOOK_URLS.ADJUST_SCHEDULE, {
          manager_email: managerEmail,
          assignments: assignmentsData,
          timestamp: new Date().toISOString()
        });
        if (assignResponse?.error || assignResponse?.success === false) hasError = true;
        else finalResult = assignResponse;
      }

      // 2. 취소 웹훅 호출
      if (canceledList.length > 0 && !hasError) {
        const cancelResponse = await postToWebhook(WEBHOOK_URLS.CANCEL_ASSIGNMENT, {
          manager_email: managerEmail,
          canceled_requests: canceledList,
          timestamp: new Date().toISOString()
        });
        if (cancelResponse?.error || cancelResponse?.success === false) hasError = true;
        else finalResult = finalResult || cancelResponse;
      }
      
      // 3. 재조정(배정 해제) 웹훅 호출
      // 팝업 열릴 때 확정 상태였으나 현재 캘린더에도 없고 취소열에도 없는(미배정 대기열에 있는) ID들
      const readjustmentIds = analyzedList
        .filter(req => req.status === 'confirmed' && !assignments[req.request_id] && !canceledList.includes(req.request_id))
        .map(req => req.request_id);

      if (readjustmentIds.length > 0 && !hasError) {
        const readjustResponse = await postToWebhook(WEBHOOK_URLS.REQUEST_READJUSTMENT, {
          manager_email: managerEmail,
          readjust_requests: readjustmentIds,
          timestamp: new Date().toISOString()
        });
        if (readjustResponse?.error || readjustResponse?.success === false) hasError = true;
        else finalResult = finalResult || readjustResponse;
      }
      
      if (hasError) {
        throw new Error('요청 처리 중 문제가 발생했습니다.');
      }
      
      // 토스트 알림: 처리 완료
      hideToast(toastId);
      showToast('신청한 일정이 확정되었습니다!', 'success');
      
      // 토스트 메시지를 보여주기 위해 2초 딜레이 후 부모 갱신 및 팝업 닫기 호출
      setTimeout(() => {
        onConfirm(finalResult, canceledList);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('[handleConfirm] 에러:', error);
      showToast('일정 확정 중 오류가 발생했습니다.', 'error');
    }
  };

  // 전체 일정 초기화
  const executeResetSchedule = async () => {
    setShowResetConfirm(false);
    
    const confirmedIds = analyzedList
      .filter(req => req.status === 'confirmed')
      .map(req => req.request_id);

    const payload = {
      action: "RESET_SCHEDULE_ASSIGNMENTS",
      confirmed_requests: confirmedIds,
      timestamp: new Date().toISOString()
    };

    try {
      const toastId = showToast('일정 초기화를 진행 중입니다...', 'loading');
      console.log('[handleResetSchedule] 전송 데이터:', payload);

      const resetResponse = await postToWebhook(WEBHOOK_URLS.RESET_SCHEDULE, {
        ...payload,
        manager_email: managerEmail
      });
      
      if (resetResponse?.error || resetResponse?.success === false) {
        throw new Error('초기화 요청에 실패했습니다.');
      }

      const result = resetResponse;

      hideToast(toastId);
      showToast('모든 일정이 성공적으로 초기화되었습니다.\n일정 재배정은 현재 창이 닫힌 후 다시 \'일정 조율하기\' 버튼을 눌러주세요.', 'success');
      
      setAssignments({});
      setCanceledList([]);
      setResetToAssignedIds([]);
      
      // 토스트 메시지를 충분히(2.5초) 보여준 후 부모 상태 갱신 및 팝업 닫기
      setTimeout(() => {
        onConfirm(result, []);
        onClose();
      }, 2500);
    } catch (error) {
      console.error("[ScheduleAdjustPopup] 초기화 중 오류:", error);
      showToast('초기화 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
  };

  // 직접 시간 배정 헬퍼 (모바일 전용 원터치 배정)
  const handleDirectAssign = (requestId: string, timeString: string) => {
    // 1. 이미 해당 시간에 배정된 다른 상담이 있는지 확인
    const conflictId = Object.keys(assignments).find(
      id => id !== requestId && assignments[id] === timeString
    );

    if (conflictId) {
      const conflictReq = analyzedList.find(r => r.request_id === conflictId);
      showToast(`⚠️ 해당 시간은 이미 ${conflictReq?.name || '다른 신청자'}에게 배정되어 있습니다.`, 'error');
      return;
    }

    // 2. 취소 목록에 있었다면 제거
    setCanceledList(prev => prev.filter(id => id !== requestId));

    // 3. 배정 설정
    setAssignments(prev => ({
      ...prev,
      [requestId]: timeString
    }));

    const req = analyzedList.find(r => r.request_id === requestId);
    showToast(`✓ ${req?.name || '신청자'} 일정이 ${timeString}으로 배정되었습니다.`, 'success');
  };

  // 가중치 점수에 따른 색상
  const getScoreColor = (score: number) => {
    if (score >= 20) return "bg-red-500";
    if (score >= 15) return "bg-orange-500";
    if (score >= 10) return "bg-yellow-500";
    return "bg-green-500";
  };

  // 미배정 신청 목록 (배정되지 않았고 취소되지도 않은 항목 - 기존 확정 건 포함)
  const unassignedRequests = analyzedList.filter(
    req => !assignments[req.request_id] && !canceledList.includes(req.request_id)
  );
  
  // 확정 취소 대기 목록 (기존 배열에서 confirmed인데 취소 목록에 있는 경우, 또는 그냥 취소된 경우)
  const canceledRequests = analyzedList.filter(
    req => canceledList.includes(req.request_id)
  );

  // 주 이동
  const handlePrevWeek = () => {
    if (currentWeek > 0) setCurrentWeek(currentWeek - 1);
  };

  const handleNextWeek = () => {
    if (currentWeek < 2) setCurrentWeek(currentWeek + 1);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[99999] p-2 sm:py-4 sm:px-8 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[1600px] h-full max-h-[98vh] sm:max-h-[96vh] rounded-2xl sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
        {/* 헤더 - 모바일 & 데스크톱 여백 최적화 */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-zinc-100 bg-white shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-50/50 rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="text-blue-500" size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base sm:text-2xl font-bold text-zinc-900 tracking-tight truncate">일정 최적 조율</h2>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] sm:text-[11px] font-bold rounded-full border border-blue-100/50 uppercase tracking-wider shrink-0">Smart Mode</span>
                </div>
                <p className="text-zinc-500 text-[11px] sm:text-sm font-medium truncate">
                  AI 추천 배정: 
                  <span className="text-blue-600 font-bold ml-1">
                    {Object.keys(assignments).length}/{analyzedList.length}건 완료
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <UITagBadge type="modal" id="M-02" label="일정 조율" />
              <button
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 📱 모바일 전용 뷰: 원터치 추천 시간 슬롯 배정 카드 리스트 (`md:hidden`)  */}
        {/* ========================================================================= */}
        <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar p-3 bg-[#fafafa] space-y-3">
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2.5 text-[11px] text-blue-800 font-medium">
            💡 신청자의 희망 시간을 터치하면 즉시 해당 시간으로 배정됩니다.
          </div>

          <div className="space-y-3">
            {analyzedList.map((req) => {
              const isAssigned = !!assignments[req.request_id];
              const isCanceled = canceledList.includes(req.request_id);
              const assignedTime = assignments[req.request_id];

              return (
                <div 
                  key={req.request_id} 
                  className={`bg-white rounded-xl p-3 border shadow-sm space-y-2.5 transition-all ${
                    isCanceled ? 'opacity-50 border-rose-200 bg-rose-50/20' :
                    isAssigned ? 'border-indigo-200 ring-1 ring-indigo-50' : 
                    'border-zinc-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        req.weight_score >= 80 ? 'bg-rose-400' :
                        req.weight_score >= 50 ? 'bg-amber-400' :
                        'bg-emerald-400'
                      }`} />
                      <h4 className="font-black text-sm text-zinc-900 truncate">{req.name}</h4>
                      <span className="text-[11px] text-zinc-400 shrink-0">
                        {req.preferred_method === "online" ? "💻온라인" : req.preferred_method === "phone" ? "📞전화" : "🤝오프라인"}
                      </span>
                    </div>

                    {isCanceled ? (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-md border border-rose-200 shrink-0">
                        취소 대기
                      </span>
                    ) : isAssigned ? (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md border border-indigo-200 shrink-0">
                        배정 완료
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-md border border-amber-200 shrink-0">
                        미배정
                      </span>
                    )}
                  </div>

                  {/* 현재 배정 상태 표시 및 해제 버튼 */}
                  {isAssigned && !isCanceled && (
                    <div className="bg-indigo-50/80 border border-indigo-100 rounded-lg p-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-950 font-bold truncate">
                        <Clock size={13} className="text-indigo-600 shrink-0" />
                        <span className="truncate">{assignedTime}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(req.request_id)}
                        className="text-[10px] font-black text-rose-500 bg-white px-2 py-1 rounded border border-rose-200 shrink-0 active:scale-95"
                      >
                        배정 해제
                      </button>
                    </div>
                  )}

                  {/* 희망 순위 1, 2, 3 원터치 배정 버튼 그룹 */}
                  {!isCanceled && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">희망 시간 선택</p>
                      <div className="grid grid-cols-1 gap-1">
                        {req.options?.map((opt, optIdx) => {
                          const isSelected = assignments[req.request_id] === opt.time;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleDirectAssign(req.request_id, opt.time)}
                              className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
                                isSelected 
                                  ? 'bg-primary text-white shadow-sm' 
                                  : 'bg-zinc-50 hover:bg-blue-50 border border-zinc-100 text-zinc-700 active:scale-[0.98]'
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20' : 'bg-zinc-200 text-zinc-600'}`}>
                                  {opt.p}순위
                                </span>
                                <span>{opt.time}</span>
                              </span>
                              <span className="text-[10px]">
                                {isSelected ? '선택됨 ✓' : '배정 ➔'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🖥️ 데스크톱/PC 전용 뷰: 기존 드래그앤드롭 12열 캘린더 그리드 (`hidden md:flex`) */}
        {/* ========================================================================= */}
        <div className="hidden md:flex flex-1 overflow-hidden p-4 bg-[#fafafa]">
          <div className="grid grid-cols-12 gap-5 h-full w-full">
            {/* 왼쪽: 캘린더 그리드 */}
            <div className="col-span-9 h-full flex flex-col">
              <div className="bg-white rounded-[24px] p-3 border border-zinc-200/60 shadow-sm flex-1 flex flex-col min-h-0">
                {/* 주 선택 헤더 */}
                <div className="flex items-center justify-between mb-2 shrink-0">
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
                <div className="grid grid-cols-8 gap-2 mb-2 shrink-0">
                  <div className="text-[11px] font-bold text-zinc-300 text-center uppercase tracking-widest flex items-center justify-center">Time</div>
                  {dates.map((date, idx) => {
                    const isWeekendDay = isWeekend(date);
                    const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];
                    return (
                      <div key={idx} className={`text-center py-1 rounded-2xl flex flex-col justify-center ${isToday ? 'bg-amber-50/50 ring-1 ring-amber-100/50' : ''}`}>
                        <div className={`text-[clamp(9px,0.8vw,10px)] font-bold uppercase tracking-widest mb-0.5 ${
                          date.getDay() === 0 ? 'text-rose-400' : 
                          date.getDay() === 6 ? 'text-blue-400' : 
                          isToday ? 'text-amber-500' : 'text-zinc-400'
                        }`}>
                          {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}
                        </div>
                        <div className={`text-[clamp(14px,1.2vw,16px)] font-bold tracking-tight ${
                          isToday ? 'text-amber-600' : 'text-zinc-800'
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 시간대 그리드 */}
                <div className="flex-1 flex flex-col gap-1 min-h-0">
                  {timeSlots.map((timeSlot) => {
                    const isLunch = isLunchTime(timeSlot);
                    return (
                      <div key={timeSlot} className="flex-1 grid grid-cols-8 gap-1.5 min-h-[clamp(32px,3.5vh,52px)]">
                        {/* 시간 라벨 */}
                        <div className={`flex items-center justify-center text-[clamp(10px,0.8vw,11px)] font-bold rounded-xl border h-full ${
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
                          
                          const cellId = `${date.toISOString().split('T')[0]}-${timeSlot}`;
                          
                          return (
                            <div
                              key={idx}
                              onDragOver={(e) => {
                                if (!isBusy) e.preventDefault();
                              }}
                              onDragEnter={() => {
                                if (!isBusy && draggedRequest) setHoveredCell(cellId);
                              }}
                              onDragLeave={() => {
                                if (hoveredCell === cellId) setHoveredCell(null);
                              }}
                              onDrop={() => {
                                handleDrop(date, timeSlot);
                                setHoveredCell(null);
                              }}
                              className={`h-full rounded-xl border transition-all duration-200 relative group overflow-hidden ${
                                isBusy
                                  ? 'bg-zinc-50 border-zinc-100 cursor-not-allowed'
                                  : hoveredCell === cellId
                                  ? 'bg-blue-50/80 border-blue-400 border-dashed animate-pulse ring-2 ring-blue-300/50'
                                  : draggedRequest
                                  ? 'bg-blue-50/20 border-blue-200 border-dashed'
                                  : 'bg-white border-zinc-100 hover:border-blue-200 hover:shadow-sm'
                              }`}
                              style={hoveredCell === cellId ? { animationIterationCount: 2 } : {}}
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
                              
                              {/* 기존 일정 (캘린더 점유 - 배정된 신청이 없을 때만 보임) */}
                              {existingEvent && !assignedRequest && !isLunch && !isWeekendDay && (
                                <div className="absolute inset-1 p-2 bg-zinc-100 rounded-xl border border-zinc-200/50 flex flex-col justify-center">
                                  <p className="text-[9px] font-bold text-zinc-400 truncate opacity-80">
                                    {existingEvent.title}
                                  </p>
                                </div>
                              )}
                              
                              {/* 배정된 신청 (우리가 배정한 것) */}
                              {assignedRequest && !isLunch && !isWeekendDay && (
                                <div 
                                  draggable
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    handleDragStart(assignedRequest.request_id);
                                  }}
                                  className={`absolute inset-[2px] p-2 rounded-lg flex flex-col justify-center shadow-sm border border-white/20 cursor-grab active:cursor-grabbing ${
                                  (assignedRequest.status === 'confirmed' && !resetToAssignedIds.includes(assignedRequest.request_id)) ? 'bg-indigo-800 text-white shadow-md ring-1 ring-white/30' :
                                  assignedRequest.weight_score >= 80 ? 'bg-blue-600 text-white shadow-md' :
                                  assignedRequest.weight_score >= 50 ? 'bg-indigo-500 text-white shadow-md' :
                                  'bg-sky-500 text-white shadow-md'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-bold leading-tight truncate mr-1 flex items-center gap-1">
                                      {(assignedRequest.status === 'confirmed' && !resetToAssignedIds.includes(assignedRequest.request_id)) && (
                                        <span className="text-[9px] bg-white/20 px-1 py-0.5 rounded leading-none shrink-0">확정</span>
                                      )}
                                      <span className="truncate">{assignedRequest.name}</span>
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
            <div className="col-span-3 h-full flex flex-col gap-3 overflow-hidden">
              <div className="bg-white rounded-[24px] p-5 border border-zinc-200/60 shadow-sm flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-1">미배정 신청</h3>
                  <span className="bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-lg text-[10px] font-bold">{unassignedRequests.length}</span>
                </div>
                <p className="text-zinc-500 text-xs font-medium mb-4 px-1 leading-relaxed">
                  신청 항목을 드래그하여 <br/>원하는 시간대에 배치하세요
                </p>
                
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                  {unassignedRequests.map((request) => {
                    const sortedOptions = [...(request.options || [])].sort((a, b) => a.p - b.p);
                    
                    return (
                      <div
                        key={request.request_id}
                        draggable
                        onDragStart={() => handleDragStart(request.request_id)}
                        className="bg-zinc-50 border border-zinc-100/50 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-center justify-between mb-2">
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
                          {request.status === 'confirmed' ? (
                            <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                              <p className="text-[11px] font-bold text-indigo-600 mb-1 leading-tight flex items-center gap-1">
                                <AlertCircle size={12} /> 배정 해제됨 (원래 확정)
                              </p>
                              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                                현재 캘린더에서 해제되었습니다.<br/>
                                <span className="text-zinc-700">새롭게 배정</span>하거나 빈 상태로 저장 시<br/> 
                                <span className="text-rose-500">재조정(대기) 상태</span>로 변경됩니다.
                              </p>
                            </div>
                          ) : (
                            sortedOptions.map((option) => {
                              if (!option.time) return null;
                              
                              const [datePart, timePart] = option.time.split(' ');
                              if (!datePart || !timePart) return null;

                              const [year, month, day] = datePart.split('-');
                              const formattedDate = month && day ? `${parseInt(month)}월 ${parseInt(day)}일` : datePart;
                              
                              const [hour, minute] = timePart.split(':');
                              if (!hour || !minute) return null;
                              
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
                                  <span className="text-zinc-400">{option.p}순위:</span>
                                  <span className={isBusyOrConflict ? 'text-rose-300 line-through' : 'text-zinc-600 font-bold'}>
                                    {formattedDate} {timeSlot}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {request.recommendation.status === "auto_assigned" && request.status !== 'confirmed' && (
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

              {/* 일정 취소 (휴지통) 영역 */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleCancelDrop}
                className={`shrink-0 bg-rose-50/30 rounded-[24px] p-5 border shadow-sm transition-all duration-200 flex flex-col ${
                  draggedRequest ? 'border-rose-300 border-dashed bg-rose-50/80 animate-pulse' : 'border-rose-100'
                }`}
                style={{ minHeight: '160px', maxHeight: '30vh' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest px-1">일정 취소 대기</h3>
                  <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">{canceledRequests.length}</span>
                </div>
                
                {canceledRequests.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-rose-300 pointer-events-none">
                    <X size={28} className="mb-2 opacity-50" />
                    <p className="text-xs font-medium text-center">취소할 일정을<br/>이곳으로 드래그하세요</p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1">
                    {canceledRequests.map((request) => (
                      <div key={request.request_id} className="bg-white border border-rose-100 rounded-xl p-2.5 flex items-center justify-between group">
                        <span className="font-bold text-xs text-zinc-700 line-through decoration-rose-300">{request.name}</span>
                        <button 
                          onClick={() => {
                            setCanceledList(prev => prev.filter(id => id !== request.request_id));
                          }}
                          className="w-6 h-6 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded flex items-center justify-center transition-colors"
                          title="취소 대기 복구"
                        >
                          <ChevronLeft size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 - 모바일 & 데스크톱 여백 최적화 */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 bg-white border-t border-zinc-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
              <span className="text-[11px] font-bold text-blue-600">배정 완료</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-indigo-800 rounded-full"></div>
              <span className="text-[11px] font-bold text-indigo-700">기존 확정</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
              <span className="text-[11px] font-bold text-rose-500">취소 대기</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0"
            >
              전체 초기화
            </button>
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0"
            >
              닫기
            </button>
            <button
              onClick={handleConfirm}
              disabled={Object.keys(assignments).length === 0 && canceledList.length === 0}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              변경사항 확정하기 
              {(Object.keys(assignments).length > 0 || canceledList.length > 0) && (
                <span className="ml-1 opacity-80 font-normal">
                  ({Object.keys(assignments).length}건)
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 토스트 알림 - 토스 스타일 플로팅 카드 */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[100000] flex flex-col gap-3 pointer-events-none">
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
            <div className="flex flex-col">
              {toast.message.split('\n').map((line, idx) => (
                <span 
                  key={idx} 
                  className={idx === 0 ? "font-bold text-sm tracking-tight" : "font-medium text-[12px] opacity-80 mt-1"}
                >
                  {line}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 전체 초기화 확인 플로팅 알림 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)}></div>
          <div className="bg-white rounded-[24px] p-6 max-w-[420px] w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-5 shadow-inner">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">정말 모든 신청 일정을 초기화하시겠습니까?</h3>
            <div className="text-[13px] text-zinc-500 mb-8 space-y-1">
              <p className="font-bold">DB에 즉시 반영되며, 기존 확정 일정들이 배정 전 단계로 돌아갑니다.</p>
              <p>이 작업은 되돌릴 수 없으며, 모든 블록이 우측 미배정 목록으로 복구됩니다.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-sm font-bold transition-colors"
              >
                취소
              </button>
              <button
                onClick={executeResetSchedule}
                className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-200 transition-colors"
              >
                초기화 진행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 취소 경고 플로팅 알림 */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)}></div>
          <div className="bg-white rounded-[24px] p-6 max-w-[420px] w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-5 shadow-inner">
              <X size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">총 {canceledList.length}건의 일정을 취소하시겠습니까?</h3>
            <div className="text-[13px] text-zinc-500 mb-8 space-y-1">
              <p className="font-bold text-rose-500">주의: 해당 상담 신청건 내역이 시스템에서 완전히 삭제됩니다.</p>
              <p>반드시 내담자와 사전에 취소 합의가 완료되었는지 다시 한 번 확인해 주세요.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-sm font-bold transition-colors"
              >
                돌아가기
              </button>
              <button
                onClick={executeConfirm}
                className="flex-1 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold shadow-md shadow-zinc-200 transition-colors"
              >
                삭제(취소) 및 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
