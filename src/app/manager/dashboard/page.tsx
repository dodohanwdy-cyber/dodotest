"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
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
};

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
        setData({
          pending_count: rawData.summary?.total_pending ?? 0,
          auto_assigned_count: rawData.summary?.auto_assigned_count ?? 0,
          completed_today: 0,
          calendar_events: rawData.calendar_events ?? [],
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* 대시보드 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">매니저 대시보드</h1>
          <p className="text-zinc-500">상담 일정을 관리하고 신청 현황을 확인하세요</p>
        </div>
        <button
          onClick={() => setShowAdjustPopup(true)}
          disabled={!data?.analyzed_list || data.analyzed_list.length === 0}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          일정 조율하기 <ExternalLink size={16} />
        </button>
      </div>

      {/* 캘린더 영역 */}
      <div className="mb-8">
        <ManagerCalendar
          calendarEvents={data?.calendar_events ?? []}
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

      {/* 일정 조율 팝업 */}
      <ScheduleAdjustPopup
        isOpen={showAdjustPopup}
        onClose={() => setShowAdjustPopup(false)}
        analyzedList={data?.analyzed_list ?? []}
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
      />
    </div>
  );
}
