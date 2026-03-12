"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Bell,
  X,
  Send
} from "lucide-react";
import ManagerCalendar from "@/components/manager/ManagerCalendar";
import ScheduleAdjustPopup from "@/components/manager/ScheduleAdjustPopup";
import ConsultationDetailPopup from "@/components/manager/ConsultationDetailPopup";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";

// 날짜 안전 추출 헬퍼
const getConfirmedDate = (apt: any): Date | null => {
  if (!apt) return null;
  const dateFields = [
    apt.confirmed_datetime,
    apt.assigned_time,
    apt.confirmed?.datetime,
    apt.datetime,
  ];
  for (const rawDate of dateFields) {
    if (rawDate && typeof rawDate === "string") {
      try {
        const dateObj = new Date(rawDate.split(" ")[0]);
        if (!isNaN(dateObj.getTime())) return dateObj;
      } catch {
        continue;
      }
    }
  }
  return null;
}

// 확정 상담 목록 파싱 헬퍼
const parseConfirmedList = (confirmedRes: any): any[] => {
  if (!confirmedRes) return [];
  if (Array.isArray(confirmedRes)) {
    const first = confirmedRes[0];
    if (first?.confirmed_list) return first.confirmed_list;
    if (Array.isArray(first)) return first;
    return confirmedRes;
  }
  return confirmedRes.confirmed_appointments ?? confirmedRes.confirmed_list ?? [];
};

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdjustPopup, setShowAdjustPopup] = useState(false);
  const [confirmedAppointments, setConfirmedAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 상세보기 팝업 상태
  const [showDetailPopup, setShowDetailPopup] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 알람 보내기 팝업 상태
  const [showAlarmPopup, setShowAlarmPopup] = useState(false);
  const [selectedAlarmUsers, setSelectedAlarmUsers] = useState<string[]>([]);
  const [alarmStatus, setAlarmStatus] = useState<"idle" | "loading" | "success">("idle");

  const applyConfirmedData = (confirmedRes: any) => {
    const rawConfirmed = parseConfirmedList(confirmedRes);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureAppointments = rawConfirmed.filter((apt: any) => {
      const aptDate = getConfirmedDate(apt);
      if (!aptDate) return false;
      aptDate.setHours(0, 0, 0, 0);
      return aptDate >= today;
    });
    setConfirmedAppointments(futureAppointments);
    if (futureAppointments.length > 0) {
      const firstDateObj = getConfirmedDate(futureAppointments[0]);
      if (firstDateObj) setSelectedDate(firstDateObj);
    }
  };

  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [mainRes, confirmedRes] = await Promise.all([
        postToWebhook(WEBHOOK_URLS.GET_MANAGER_DASHBOARD, {
          manager_email: user.email,
          timestamp: new Date().toISOString(),
        }),
        postToWebhook(WEBHOOK_URLS.GET_DASHBOARD_PREVIEW, {
          manager_email: user.email,
          timestamp: new Date().toISOString(),
        }),
      ]);

      if (mainRes) {
        const rawData = Array.isArray(mainRes) ? mainRes[0] : mainRes;
        
        const parsedEvents = (rawData.calendar_events ?? []).map((evt: any, idx: number) => {
          const title = typeof evt.title === "string" ? evt.title.trim() : "";
          const isCounseling = /^.+\s+상담\s*(\((online|phone)\)$|\(offline\))/i.test(title);
          const id = evt.id || `evt-${idx}-${evt.start || Date.now()}`;
          return { ...evt, id, color: isCounseling ? "blue" : "gray" };
        });

        setData({
          pending_count: rawData.summary?.total_pending ?? 0,
          auto_assigned_count: rawData.summary?.auto_assigned_count ?? 0,
          completed_today: 0,
          calendar_events: parsedEvents,
          analyzed_list: rawData.analyzed_list ?? [],
          requests: [],
        });
      }
      applyConfirmedData(confirmedRes);
    } catch (err) {
      console.error("[대시보드] 데이터 로딩 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleConfirmAssignments = async (webhookResponse: any) => {
    const responseData = Array.isArray(webhookResponse) ? webhookResponse[0] : webhookResponse;
    const confirmedList = responseData?.confirmed_list ?? [];

    if (confirmedList.length > 0) {
      const firstDate = confirmedList[0].confirmed_datetime?.split(" ")[0];
      if (firstDate) setSelectedDate(new Date(firstDate));
    }
    setConfirmedAppointments(confirmedList);
    setShowAdjustPopup(false);
    await fetchDashboard();
  };

  const handleViewDetail = async (requestId: string, email: string) => {
    setIsLoadingDetail(true);
    setShowDetailPopup(true);
    try {
      const result = await postToWebhook(
        "https://primary-production-1f39e.up.railway.app/webhook/send-preview-data",
        { request_id: requestId, email }
      );
      setDetailData(Array.isArray(result) ? result[0] : result);
    } catch (error) {
      console.error("[상세보기] 에러:", error);
      setDetailData({ error: "데이터를 불러올 수 없습니다." });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleRefreshDetail = async () => {
    if (!detailData?.request_id || !detailData?.email) return;
    try {
      const result = await postToWebhook(
        "https://primary-production-1f39e.up.railway.app/webhook/send-preview-data",
        { request_id: detailData.request_id, email: detailData.email }
      );
      setDetailData(Array.isArray(result) ? result[0] : result);
    } catch (error) {
      console.error("[상세보기 갱신] 에러:", error);
    }
  };

  const handleOpenAlarmPopup = () => {
    // 확정된 상담 예약자만 대상자로 지정
    const allIds = confirmedAppointments.map(apt => apt.request_id);
    setSelectedAlarmUsers(allIds);
    setAlarmStatus("idle");
    setShowAlarmPopup(true);
  };

  const toggleAlarmUser = (id: string) => {
    setSelectedAlarmUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  const handleSendAlarm = () => {
    setAlarmStatus("loading");
    // 실제 발송 로직 대신 타이머로 성공 처리
    setTimeout(() => {
      setAlarmStatus("success");
      setTimeout(() => {
        setShowAlarmPopup(false);
      }, 2000);
    }, 1200);
  };

  const combinedList = useMemo(() => {
    const baseList = data?.analyzed_list ?? [];
    
    // confirmedAppointments를 AnalyzedRequest 형식으로 변환하여 추가
    const confirmedMapped = confirmedAppointments.map((apt: any) => {
      return {
        request_id: apt.request_id,
        name: apt.name,
        weight_score: 100, // 확정 데이터는 가중치 무관하게 무조건 렌더링
        preferred_method: apt.confirmed_method || apt.preferred_method,
        preferred_location: apt.confirmed_location || apt.preferred_location,
        options: [], // 이미 확정되었으므로 options는 빈 배열
        recommendation: {
          status: "manual_required" as const,
          suggested_time: "",
          suggested_priority: 0
        },
        status: apt.status || "confirmed",
        confirmed_datetime: apt.confirmed_datetime
      };
    });

    const baseIds = new Set(baseList.map((item: any) => item.request_id));
    const filteredConfirmed = confirmedMapped.filter((apt: any) => !baseIds.has(apt.request_id));

    // 혹시라도 baseList에 들어있는데 status 업데이트가 안 된 경우를 위해 덮어쓰기
    const mappedBase = baseList.map((item: any) => {
      const confirmedMatch = confirmedAppointments.find((c: any) => c.request_id === item.request_id);
      if (confirmedMatch) {
        return {
          ...item,
          status: confirmedMatch.status || "confirmed",
          confirmed_datetime: confirmedMatch.confirmed_datetime
        };
      }
      return item;
    });

    return [...mappedBase, ...filteredConfirmed];
  }, [data?.analyzed_list, confirmedAppointments]);

  // 대시보드 캘린더 전용: 기확정 일정만 매핑하여 전달 (기존 calendar_events와 병합 예정)
  const confirmedCalendarEvents = useMemo(() => {
    return confirmedAppointments.map((apt: any) => ({
      id: apt.request_id,
      title: `${apt.name} 상담`, // [확정] 문구 제거
      start: apt.confirmed_datetime,
      // 임의로 1시간 뒤를 end 시간으로 지정 (필요 시)
      end: new Date(new Date(apt.confirmed_datetime).getTime() + 60 * 60 * 1000).toISOString(),
      color: 'indigo'
    }));
  }, [confirmedAppointments]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* 대시보드 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 mb-2">상담 접수 및 배정 관리</h1>
          <p className="text-zinc-500">상담 일정을 관리하고 신청 현황을 확인하세요</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleOpenAlarmPopup}
            disabled={confirmedAppointments.length === 0}
            className="px-6 py-3 bg-white text-primary border border-primary rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-50/50 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            알람 보내기 <Bell size={16} />
          </button>
          <button
            onClick={() => setShowAdjustPopup(true)}
            disabled={(!data?.analyzed_list || data.analyzed_list.length === 0) && confirmedAppointments.length === 0}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            일정 조율하기 <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {/* 캘린더 영역 */}
      <div className="mb-8">
        <ManagerCalendar
          calendarEvents={[...(data?.calendar_events ?? []), ...confirmedCalendarEvents]}
          onEventClick={() => {}}
        />
      </div>

      {/* 상담 예정 목록 */}
      {confirmedAppointments.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">상담 예정</h2>
                <p className="text-sm text-zinc-500">확정된 상담 일정 {confirmedAppointments.length}건</p>
              </div>
            </div>

            {/* 날짜 네비게이션 */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d);
                }}
                className="w-10 h-10 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center transition-all"
              >
                ◀
              </button>
              <div className="text-center min-w-[200px]">
                <p className="text-lg font-bold text-zinc-900">
                  {selectedDate.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d);
                }}
                className="w-10 h-10 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center transition-all"
              >
                ▶
              </button>
            </div>
          </div>

          {/* 선택된 날짜의 상담 목록 */}
          {(() => {
            const selectedDateStr = selectedDate.toISOString().split("T")[0];
            const filtered = confirmedAppointments.filter((apt) => {
              const aptDate = apt.confirmed_datetime?.split(" ")[0];
              return aptDate === selectedDateStr;
            });

            if (filtered.length === 0) {
              return (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-zinc-300 mb-3" size={48} />
                  <p className="text-zinc-400">이 날짜에 예정된 상담이 없습니다.</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filtered.map((appointment) => (
                  <div
                    key={appointment.request_id}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-xl text-zinc-900">{appointment.name}</h3>
                          <span className="text-sm text-zinc-500">
                            {appointment.age}세 · {appointment.gender === "male" ? "남성" : "여성"}
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            {appointment.job_status}
                          </span>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" />
                            <span className="font-bold text-lg text-zinc-900">{appointment.confirmed_datetime}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500">방식:</span>
                              <span className="font-semibold text-zinc-800">
                                {appointment.confirmed_method === "online"
                                  ? "온라인"
                                  : appointment.confirmed_method === "offline"
                                  ? "오프라인"
                                  : appointment.confirmed_method === "phone"
                                  ? "전화"
                                  : appointment.confirmed_method}
                              </span>
                            </div>
                            {appointment.confirmed_location && (
                              <>
                                <span className="text-zinc-300">|</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500">장소:</span>
                                  <span className="font-semibold text-zinc-800">
                                    {appointment.confirmed_location === "center"
                                      ? "센터"
                                      : appointment.confirmed_location}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {Array.isArray(appointment.interest_areas) && appointment.interest_areas.length > 0 && (
                          <div>
                            <p className="text-xs text-zinc-500 mb-2">관심 분야</p>
                            <div className="flex flex-wrap gap-1">
                              {appointment.interest_areas.map((area: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-1 bg-white text-blue-700 text-xs font-medium rounded-lg border border-blue-200"
                                >
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-6">
                        <button
                          onClick={() => handleViewDetail(appointment.request_id, appointment.email)}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                        >
                          상세보기
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* 데이터 없을 때 안내 */}
      {!isLoading && confirmedAppointments.length === 0 && (
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-dashed border-zinc-200 text-center">
          <AlertCircle className="mx-auto text-zinc-300 mb-3" size={48} />
          <p className="text-zinc-400 font-medium">확정된 상담 일정이 없습니다.</p>
          <p className="text-zinc-300 text-sm mt-1">일정 조율을 통해 상담을 확정해 주세요.</p>
        </div>
      )}

      {/* 알림 발송 모달 */}
      {showAlarmPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowAlarmPopup(false)}></div>
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAlarmPopup(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-5 shadow-inner">
              <Bell size={24} />
            </div>

            <h2 className="text-xl font-bold text-zinc-900 mb-2">알람 보내기</h2>
            <p className="text-[13px] text-zinc-500 mb-6 font-bold">상담이 확정된 아래 분들께 문자 및 알람을 보내드릴게요.</p>

            {/* 수신자 체크박스 리스트 */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
              {(() => {
                if (confirmedAppointments.length === 0) {
                  return <p className="text-center text-zinc-400 text-sm py-4">확정된 상담 일정이 없습니다.</p>;
                }

                return confirmedAppointments.map((apt: any) => {
                  // 날짜 시간 포맷팅 (예: "2026-02-28 14:00")
                  const dateStr = new Date(apt.confirmed_datetime).toLocaleString("ko-KR", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  });

                  return (
                    <label key={apt.request_id} className="flex items-center gap-3 p-4 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-zinc-300 text-primary focus:ring-primary"
                        checked={selectedAlarmUsers.includes(apt.request_id)}
                        onChange={() => toggleAlarmUser(apt.request_id)}
                      />
                      <div className="flex items-center justify-between flex-1">
                        <div>
                          <p className="font-bold text-zinc-900 text-[15px]">{apt.name}</p>
                          <p className="text-[13px] text-zinc-500">{dateStr}</p>
                        </div>
                        {apt.phone && (
                          <span className="text-xs font-medium text-zinc-400 px-2.5 py-1 bg-zinc-100 rounded-lg">
                            {apt.phone}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                });
              })()}
            </div>

            <button
              onClick={handleSendAlarm}
              disabled={alarmStatus === "loading" || alarmStatus === "success" || selectedAlarmUsers.length === 0}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                alarmStatus === "success" 
                  ? "bg-green-100 text-green-700 shadow-none" 
                  : "bg-primary text-white hover:bg-blue-600 hover:translate-y-[-1px] active:translate-y-[1px]"
              } disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed`}
            >
              {alarmStatus === "loading" ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> 
                  발송 준비 중...
                </>
              ) : alarmStatus === "success" ? (
                <><CheckCircle2 size={18} /> 알람이 발송되었어요</>
              ) : (
                <><Send size={18} /> {selectedAlarmUsers.length}명에게 발송하기</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 일정 조율 팝업 */}
      <ScheduleAdjustPopup
        isOpen={showAdjustPopup}
        onClose={() => setShowAdjustPopup(false)}
        analyzedList={combinedList}
        calendarEvents={data?.calendar_events ?? []}
        onConfirm={handleConfirmAssignments}
      />

      {/* 상담자 상세 정보 팝업 */}
      <ConsultationDetailPopup
        isOpen={showDetailPopup}
        onClose={() => {
          setShowDetailPopup(false);
          setDetailData(null);
        }}
        data={detailData}
        isLoading={isLoadingDetail}
        onRefresh={handleRefreshDetail}
      />
    </div>
  );
}
