"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Settings2 } from "lucide-react";

interface CalendarEvent {
  id?: string;
  title: string;
  start: string; // ISO 8601 format
  end?: string;
  color?: string;
}

interface ManagerCalendarProps {
  calendarEvents?: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

export default function ManagerCalendar({ calendarEvents = [], isLoading = false, onEventClick }: ManagerCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // 3주치 캘린더 생성 (오늘이 포함된 주의 일요일부터 3주)
  useEffect(() => {
    const today = new Date(currentDate);
    
    // 이번 주 일요일 찾기
    const dayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    
    // 3주치 날짜 생성 (21일)
    const days: Date[] = [];
    for (let i = 0; i < 21; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push(day);
    }
    
    setCalendarDays(days);
  }, [currentDate]);

  // 특정 날짜의 일정 가져오기
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // 이전/다음 주로 이동
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  // 오늘로 돌아가기
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 일정 타입 판별 (OOO 상담 (online|phone) 형태 또는 OOO 상담 (offline) 이후 텍스트 존재 여부 확인)
  const isConsultationEvent = (title: string) => {
    return /^.+\s+상담\s*(\((online|phone)\)$|\(offline\))/i.test(title.trim());
  };

  // 일정 색상
  const getEventColor = (event: CalendarEvent) => {
    if (event.color === 'blue') return 'bg-blue-500 text-white';
    if (event.color === 'gray') return 'bg-gray-400 text-white';
    
    // fallback
    if (isConsultationEvent(event.title)) {
      return 'bg-blue-500 text-white';
    }
    return 'bg-gray-400 text-white';
  };

  // 오늘 날짜 체크
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 주말 체크
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-zinc-100 rounded-[2rem] p-8 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 rounded w-1/3"></div>
          <div className="h-96 bg-zinc-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-100 rounded-[2rem] p-8 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <CalendarIcon className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h3>
            <p className="text-xs text-zinc-400 font-medium">3주 일정 보기</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
          >
            오늘
          </button>
          <button
            onClick={() => navigateWeek('prev')}
            className="w-9 h-9 bg-zinc-50 hover:bg-zinc-100 rounded-xl flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={18} className="text-zinc-600" />
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="w-9 h-9 bg-zinc-50 hover:bg-zinc-100 rounded-xl flex items-center justify-center transition-colors"
          >
            <ChevronRight size={18} className="text-zinc-600" />
          </button>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="border border-zinc-200 rounded-2xl overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-zinc-50 border-b border-zinc-200">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <div
              key={day}
              className={`py-3 text-center text-xs font-bold ${
                idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-zinc-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 (3주) */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, idx) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentDay = isToday(date);
            const isWeekendDay = isWeekend(date);

            return (
              <div
                key={idx}
                className={`min-h-[120px] border-r border-b border-zinc-100 p-2 ${
                  idx % 7 === 6 ? 'border-r-0' : ''
                } ${idx >= 14 ? 'border-b-0' : ''} ${
                  isWeekendDay ? 'bg-zinc-50/30' : 'bg-white'
                } hover:bg-blue-50/30 transition-colors`}
              >
                {/* 날짜 */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-bold ${
                      isCurrentDay
                        ? 'w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center'
                        : date.getDay() === 0
                        ? 'text-red-500'
                        : date.getDay() === 6
                        ? 'text-blue-500'
                        : 'text-zinc-700'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>

                {/* 일정 목록 */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIdx) => {
                    const startTime = new Date(event.start).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    });
                    
                    return (
                      <button
                        key={eventIdx}
                        onClick={() => onEventClick?.(event)}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold truncate ${getEventColor(
                          event
                        )} hover:opacity-80 transition-opacity`}
                        title={event.title}
                      >
                        {startTime} {event.title}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-zinc-400 font-bold text-center">
                      +{dayEvents.length - 3}개 더보기
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-zinc-600 font-medium">상담 일정</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-400"></div>
          <span className="text-zinc-600 font-medium">기타 일정</span>
        </div>
      </div>
    </div>
  );
}
