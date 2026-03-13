"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, Clock, ChevronRight, ChevronLeft, Loader2, MapPin, Phone, Video, Building2, AlertCircle } from "lucide-react";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";

interface DaySlot {
  date: string;
  dayOfWeek: string;
  dayOfWeekNum: number;
  times: string[];
  isWeekend: boolean;
  isFullBooked: boolean;
  isInRange: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

interface Holiday {
  date: string;
  name: string;
}

export default function ScheduleForm({ data, onNext, onPrev }: { data: any, onNext: (data: any) => void, onPrev: () => void }) {
  const [calendar, setCalendar] = useState<DaySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workInfo, setWorkInfo] = useState({ start: 9, end: 18, lunch: 12 });
  const [toast, setToast] = useState<string>("");
  const [holidays, setHolidays] = useState<{ [key: string]: string }>({});
  
  // 순위 선택
  const [rank1, setRank1] = useState<string>("");
  const [rank2, setRank2] = useState<string>("");
  const [rank3, setRank3] = useState<string>("");
  
  // 상담 방식 및 장소
  const [preferredMethod, setPreferredMethod] = useState<"online" | "offline" | "phone">("offline");
  const [preferredLocation, setPreferredLocation] = useState<"center" | string>("center");
  const [customLocation, setCustomLocation] = useState("");
  
  // 웹훅 전송 및 수신 데이터 저장
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rawCalendarData, setRawCalendarData] = useState<{work_info: any, booked_data: any} | null>(null);

  // 기존 데이터 복원
  useEffect(() => {
    if (data) {
      // n8n 등에서 넘어오는 쓰레기값이나 포맷이 맞지 않는 빈 문자열 방지
      const isValidTime = (t: any) => typeof t === 'string' && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(t.trim());

      if (isValidTime(data.request_time_1)) setRank1(data.request_time_1.trim());
      if (isValidTime(data.request_time_2)) setRank2(data.request_time_2.trim());
      if (isValidTime(data.request_time_3)) setRank3(data.request_time_3.trim());
      
      if (data.preferred_method) setPreferredMethod(data.preferred_method);
      if (data.preferred_location) {
        if (data.preferred_location === 'center') {
          setPreferredLocation('center');
        } else {
          setPreferredLocation('custom');
          setCustomLocation(data.preferred_location);
        }
      }
    }
  }, [data]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  // 한국 공휴일 설정 (정적 데이터 사용)
  useEffect(() => {
    // 기본 공휴일 데이터 (2026년)
    setHolidays({
      "2026-01-01": "신정",
      "2026-02-16": "설날 연휴",
      "2026-02-17": "설날",
      "2026-02-18": "설날 연휴",
      "2026-03-01": "삼일절",
      "2026-05-05": "어린이날",
      "2026-05-19": "석가탄신일",
      "2026-06-06": "현충일",
      "2026-08-15": "광복절",
      "2026-09-24": "추석 연휴",
      "2026-09-25": "추석",
      "2026-09-26": "추석 연휴",
      "2026-10-03": "개천절",
      "2026-10-09": "한글날",
      "2026-12-25": "크리스마스"
    });
  }, []);

  useEffect(() => {
    const fetchCalendar = async () => {
      setIsLoading(true);
      try {
        const response = await postToWebhook(WEBHOOK_URLS.GET_CALENDAR, {
          request_id: data.request_id || "",
          email: data.email || ""
        });
        
        console.log("📅 [캘린더 웹훅 응답]", response);
        
        const raw = Array.isArray(response) ? response[0] : response;
        
        // n8n 플레이스홀더('{{ $json... }}') 감지 및 방어 로직
        const isPlaceholder = (val: any) => typeof val === 'string' && val.includes('{{');
        
        if (raw && (raw.status === "success" || raw.booked_data || (raw.data && (raw.data.booked_data || raw.data.work_info)))) {
          // 데이터가 루트에 있거나 data 속성 내부에 있는 경우 모두 대응
          let work_info = raw.work_info || (raw.data && raw.data.work_info);
          let booked_data = raw.booked_data || (raw.data && raw.data.booked_data);
          
          // n8n 플레이스홀더('{{ $json... }}') 감지 및 방어 로직
          if (isPlaceholder(work_info)) work_info = null;
          if (isPlaceholder(booked_data)) booked_data = {};

          if (work_info) {
            setWorkInfo(work_info);
          }
          
          setRawCalendarData({
            work_info: work_info || workInfo,
            booked_data: booked_data || {}
          });
          console.log("✅ [캘린더 데이터 서버 수신 완료]", { work_info, booked_data });
        } else {
          console.warn("⚠️ [응답 형식 오류 또는 데이터 없음]", response);
          setRawCalendarData({ work_info: workInfo, booked_data: {} });
        }
      } catch (err) {
        console.error("🚨 [캘린더 로드 실패]", err);
        setRawCalendarData({ work_info: workInfo, booked_data: {} });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCalendar();
  }, [data.request_id, data.email]);

  // 로컬 날짜를 YYYY-MM-DD 형식으로 변환하는 헬퍼 함수
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 공휴일 정보나 서버 데이터가 변경될 때마다 캘린더 슬롯을 다시 생성 (의존성 해결)
  useEffect(() => {
    if (rawCalendarData) {
      const generated = generateCalendar(rawCalendarData.work_info, rawCalendarData.booked_data);
      setCalendar(generated);
    }
  }, [rawCalendarData, holidays]);

  const generateCalendar = (workInfo: any, bookedData: any): DaySlot[] => {
    const days: DaySlot[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const endDate = new Date(tomorrow);
    endDate.setDate(tomorrow.getDate() + 14);
    
    const calendarStart = new Date(tomorrow);
    const dayOfWeek = tomorrow.getDay();
    calendarStart.setDate(tomorrow.getDate() - dayOfWeek);
    
    const calendarEnd = new Date(endDate);
    const endDayOfWeek = endDate.getDay();
    calendarEnd.setDate(endDate.getDate() + (6 - endDayOfWeek));
    
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    
    const currentDate = new Date(calendarStart);
    while (currentDate <= calendarEnd) {
      const dayOfWeekNum = currentDate.getDay();
      const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6;
      
      const dateStr = formatLocalDate(currentDate);
      const isInRange = currentDate >= tomorrow && currentDate <= endDate;
      
      const isHoliday = !!holidays[dateStr];
      const holidayName = holidays[dateStr];
      
      // 예약 데이터 확인 (객체 형태 권장, 배열 형태 대응)
      let dayBookedStatus = null;
      if (bookedData && typeof bookedData === 'object' && !Array.isArray(bookedData)) {
        dayBookedStatus = bookedData[dateStr];
      } else if (Array.isArray(bookedData)) {
        // [{date: '...', status: '...'}] 형태일 경우 대비
        const match = bookedData.find((item: any) => item.date === dateStr);
        dayBookedStatus = match ? (match.status || match.times) : null;
      }

      const isFullBooked = dayBookedStatus === "FULL_BOOKED" || isHoliday;
      
      const times: string[] = [];
      for (let hour = workInfo.start; hour < workInfo.end; hour++) {
        if (hour === workInfo.lunch) continue;
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        times.push(timeStr);
      }
      
      days.push({
        date: dateStr,
        dayOfWeek: dayNames[dayOfWeekNum],
        dayOfWeekNum,
        times: times,
        isWeekend,
        isFullBooked,
        isInRange,
        isHoliday,
        holidayName
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const handleDateClick = (day: DaySlot) => {
    if (!day.isInRange || day.isWeekend || day.isFullBooked) {
      if (day.isHoliday) {
        showToast(`${day.holidayName}은 공휴일입니다.`);
      }
      return;
    }
    
    setSelectedDate(day.date);
    setAvailableTimes(day.times);
    
    // 해당 날짜의 예약된 시간 목록 설정
    let dayBookedTimes: string[] = [];
    const bookedData = rawCalendarData?.booked_data;
    
    if (bookedData) {
      if (typeof bookedData === 'object' && !Array.isArray(bookedData)) {
        dayBookedTimes = Array.isArray(bookedData[day.date]) ? bookedData[day.date] : [];
      } else if (Array.isArray(bookedData)) {
        const match = bookedData.find((item: any) => item.date === day.date);
        dayBookedTimes = match && Array.isArray(match.times) ? match.times : [];
      }
    }
    
    // 시간 형식 통일: '9:00' -> '09:00' (안전한 비교를 위해)
    const normalizedTimes = dayBookedTimes.map(t => {
      if (typeof t !== 'string') return '';
      const parts = t.trim().split(':');
      if (parts.length < 2) return t;
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }).filter(Boolean);

    setBookedTimes(normalizedTimes);
  };

  const handleTimeClick = (time: string) => {
    const slotKey = `${selectedDate} ${time}`;
    
    // 이미 선택된 시간인지 확인
    if (rank1 === slotKey || rank2 === slotKey || rank3 === slotKey) {
      // 선택 해제
      if (rank1 === slotKey) setRank1("");
      if (rank2 === slotKey) setRank2("");
      if (rank3 === slotKey) setRank3("");
      return;
    }
    
    // 빈 순위 블록에 할당
    if (!rank1) {
      setRank1(slotKey);
    } else if (!rank2) {
      setRank2(slotKey);
    } else if (!rank3) {
      setRank3(slotKey);
    } else {
      // 모든 순위가 찬 경우
      showToast("모든 순위를 선택했어요! 기존 선택을 해제하고 다시 선택해 주세요.");
    }
  };

  const isTimeSelected = (time: string) => {
    const slotKey = `${selectedDate} ${time}`;
    return rank1 === slotKey || rank2 === slotKey || rank3 === slotKey;
  };

  const getRankForTime = (time: string) => {
    const slotKey = `${selectedDate} ${time}`;
    if (rank1 === slotKey) return 1;
    if (rank2 === slotKey) return 2;
    if (rank3 === slotKey) return 3;
    return null;
  };

  const canProceed = rank1 !== "" && !isSubmitting;

  const handleNext = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const finalLocation = preferredMethod === "offline" 
      ? (preferredLocation === "center" ? "center" : customLocation)
      : "";
    
    const scheduleData = {
      request_id: data.request_id,
      email: data.email,
      request_time_1: rank1,
      request_time_2: rank2,
      request_time_3: rank3,
      preferred_method: preferredMethod,
      preferred_location: finalLocation
    };
    
    try {
      // 웹훅으로 일정 데이터 전송
      console.log("📤 [일정 확정 웹훅 전송]", scheduleData);
      const response = await postToWebhook(WEBHOOK_URLS.CHOOSE_SCHEDULE, scheduleData);
      console.log("✅ [일정 확정 웹훅 응답]", response);
      
      // 성공 시 다음 단계로
      onNext(scheduleData);
    } catch (err) {
      console.error("🚨 [일정 확정 웹훅 실패]", err);
      showToast("일정 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 달력을 주 단위로 그룹화 (정확히 7일씩)
  const weeks: DaySlot[][] = [];
  for (let i = 0; i < calendar.length; i += 7) {
    weeks.push(calendar.slice(i, i + 7));
  }

  return (
    <div className="space-y-8 py-4">
      {isLoading ? (
        <div className="h-96 flex items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-100">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <>
          {/* 달력 및 시간 선택 영역 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 왼쪽: 달력 + 순위 블록 */}
            <div className="space-y-4">
              <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                <CalendarIcon size={18} className="text-primary" /> 날짜 선택
              </label>
              
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-lg">
                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                    <div key={idx} className={`text-center text-xs font-black py-2 ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-600'}`}>
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* 주별 날짜 */}
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="grid grid-cols-7 gap-2 mb-2">
                    {week.map((day, dayIdx) => {
                      const isSelected = selectedDate === day.date;
                      const isDisabled = !day.isInRange || day.isWeekend || day.isFullBooked;
                      
                      return (
                        <button
                          key={dayIdx}
                          onClick={() => handleDateClick(day)}
                          disabled={isDisabled}
                          title={day.isHoliday ? day.holidayName : undefined}
                          className={`aspect-square p-2 rounded-xl transition-all relative flex flex-col items-center justify-center ${
                            isSelected
                              ? "bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl shadow-blue-200 scale-105 z-10"
                              : isDisabled
                              ? day.isHoliday
                                ? "bg-red-50 text-red-400 cursor-not-allowed border-2 border-red-200"
                                : "bg-slate-50 text-slate-300 cursor-not-allowed"
                              : "bg-white border-2 border-slate-200 text-slate-700 hover:border-primary hover:shadow-md hover:scale-105"
                          }`}
                        >
                          <div className="text-[10px] font-bold opacity-70 leading-none mb-1">{day.dayOfWeek}</div>
                          <div className="text-base font-black leading-none tracking-tighter whitespace-nowrap">
                            {parseInt(day.date.split('-')[2], 10)}
                          </div>
                          {day.isHoliday && (
                            <div className="absolute bottom-0 left-0 right-0 text-[8px] text-red-500 font-black">
                              {day.holidayName}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* 순위 블록 - 달력 아래로 이동 */}
              <div className="space-y-3">
                <label className="text-sm font-black text-slate-800">선택한 시간</label>
                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-2xl p-4 flex items-center justify-between">
                    <div className="text-sm font-black text-yellow-700 flex items-center gap-2">
                      <span className="text-xl">🥇</span> 1순위 <span className="text-xs text-red-600">(필수)</span>
                    </div>
                    <div className="text-sm font-black text-slate-800">
                      {rank1 || <span className="text-slate-400">미선택</span>}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-400 rounded-2xl p-4 flex items-center justify-between">
                    <div className="text-sm font-black text-blue-700 flex items-center gap-2">
                      <span className="text-xl">🥈</span> 2순위
                    </div>
                    <div className="text-sm font-black text-slate-800">
                      {rank2 || <span className="text-slate-400">미선택</span>}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl p-4 flex items-center justify-between">
                    <div className="text-sm font-black text-green-700 flex items-center gap-2">
                      <span className="text-xl">🥉</span> 3순위
                    </div>
                    <div className="text-sm font-black text-slate-800">
                      {rank3 || <span className="text-slate-400">미선택</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 시간 선택 - 높이 고정 */}
            <div className="space-y-4 relative h-full flex flex-col">
              <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-primary" /> 시간 선택
              </label>
              
              {/* 토스트 메시지 */}
              {toast && (
                <div className="absolute top-14 left-0 right-0 z-50 animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-3">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <span className="font-bold text-sm">{toast}</span>
                  </div>
                </div>
              )}
              
              {/* 고정 높이 컨테이너 */}
              <div className="flex-1 min-h-[600px]">
                {!selectedDate ? (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl border-2 border-slate-200 p-8 text-center shadow-inner">
                    <div className="space-y-3">
                      <CalendarIcon size={48} className="text-slate-300 mx-auto" />
                      <p className="text-sm text-slate-500 font-bold">왼쪽에서 날짜를 먼저 선택해 주세요</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="bg-gradient-to-r from-blue-500 to-primary text-white rounded-2xl p-4 shadow-lg">
                      <div className="text-xs font-bold opacity-90 mb-1">선택한 날짜</div>
                      <div className="text-lg font-black">{selectedDate}</div>
                    </div>
                    
                    {/* 세로 목록 형태로 시간 표시 */}
                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {availableTimes.map((time, idx) => {
                        const isSelected = isTimeSelected(time);
                        const rank = getRankForTime(time);
                        const isBooked = bookedTimes.includes(time);
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => handleTimeClick(time)}
                            disabled={isBooked}
                            className={`w-full py-4 px-5 rounded-2xl text-sm font-black transition-all border-2 flex items-center justify-between ${
                              isBooked
                                ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                                : isSelected
                                ? rank === 1
                                  ? "bg-gradient-to-r from-yellow-400 to-amber-500 border-yellow-600 text-white shadow-lg shadow-yellow-200"
                                  : rank === 2
                                  ? "bg-gradient-to-r from-blue-400 to-blue-600 border-blue-700 text-white shadow-lg shadow-blue-200"
                                  : "bg-gradient-to-r from-green-400 to-emerald-600 border-green-700 text-white shadow-lg shadow-green-200"
                                : "bg-white border-slate-200 text-slate-700 hover:border-primary hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock size={18} />
                              <span className="text-base">{time}</span>
                            </div>
                            {isBooked && (
                              <span className="text-xs text-slate-400 font-bold">예약됨</span>
                            )}
                            {!isBooked && rank && (
                              <span className="text-sm font-black bg-white/30 px-3 py-1 rounded-full">
                                {rank}순위
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 상담 방식 - 순서 변경: 오프라인/온라인/전화 */}
          <div className="space-y-4">
            <label className="text-sm font-black text-slate-800">상담 방식</label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setPreferredMethod("offline")}
                className={`py-5 px-4 rounded-2xl text-sm font-black transition-all border-2 flex flex-col items-center gap-3 ${
                  preferredMethod === "offline"
                    ? "bg-gradient-to-br from-primary to-blue-600 border-blue-700 text-white shadow-xl shadow-blue-200 scale-105"
                    : "bg-white border-slate-200 text-slate-700 hover:border-primary hover:shadow-lg hover:scale-105"
                }`}
              >
                <MapPin size={24} />
                <span>오프라인</span>
              </button>
              <button
                onClick={() => setPreferredMethod("online")}
                className={`py-5 px-4 rounded-2xl text-sm font-black transition-all border-2 flex flex-col items-center gap-3 ${
                  preferredMethod === "online"
                    ? "bg-gradient-to-br from-primary to-blue-600 border-blue-700 text-white shadow-xl shadow-blue-200 scale-105"
                    : "bg-white border-slate-200 text-slate-700 hover:border-primary hover:shadow-lg hover:scale-105"
                }`}
              >
                <Video size={24} />
                <span>온라인</span>
              </button>
              <button
                onClick={() => setPreferredMethod("phone")}
                className={`py-5 px-4 rounded-2xl text-sm font-black transition-all border-2 flex flex-col items-center gap-3 ${
                  preferredMethod === "phone"
                    ? "bg-gradient-to-br from-primary to-blue-600 border-blue-700 text-white shadow-xl shadow-blue-200 scale-105"
                    : "bg-white border-slate-200 text-slate-700 hover:border-primary hover:shadow-lg hover:scale-105"
                }`}
              >
                <Phone size={24} />
                <span>전화</span>
              </button>
            </div>
          </div>

          {/* 상담 장소 (오프라인 선택 시에만) */}
          {preferredMethod === "offline" && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <label className="text-sm font-black text-slate-800">상담 장소</label>
              <div className="space-y-3">
                <button
                  onClick={() => setPreferredLocation("center")}
                  className={`w-full py-5 px-5 rounded-2xl text-sm font-black transition-all border-2 flex items-center gap-4 ${
                    preferredLocation === "center"
                      ? "bg-gradient-to-r from-primary to-blue-600 border-blue-700 text-white shadow-xl shadow-blue-200"
                      : "bg-white border-slate-200 text-slate-700 hover:border-primary hover:shadow-lg"
                  }`}
                >
                  <Building2 size={24} />
                  <span>센터</span>
                </button>
                <div className="space-y-3">
                  <button
                    onClick={() => setPreferredLocation("custom")}
                    className={`w-full py-5 px-5 rounded-2xl text-sm font-black transition-all border-2 flex items-center gap-4 ${
                      preferredLocation !== "center"
                        ? "bg-gradient-to-r from-primary to-blue-600 border-blue-700 text-white shadow-xl shadow-blue-200"
                        : "bg-white border-slate-200 text-slate-700 hover:border-primary hover:shadow-lg"
                    }`}
                  >
                    <MapPin size={24} />
                    <span>그 밖의 장소 (직접 입력)</span>
                  </button>
                  {preferredLocation !== "center" && (
                    <input
                      type="text"
                      placeholder="상담 장소를 입력해 주세요"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="pt-6 flex justify-between">
        <button 
          onClick={onPrev}
          disabled={isSubmitting}
          className="text-slate-600 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-100 transition-all border-2 border-transparent hover:border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} /> 이전으로
        </button>
        <button 
          onClick={handleNext}
          disabled={!canProceed}
          className="bg-gradient-to-r from-primary to-blue-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 btn-interactive shadow-2xl shadow-blue-200 disabled:opacity-50 disabled:grayscale disabled:shadow-none disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              전송 중...
            </>
          ) : (
            <>
              예약 신청하고 AI와 대화 나누기 <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
