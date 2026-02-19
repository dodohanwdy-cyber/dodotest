"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  LayoutDashboard, 
  AlertCircle,
  ExternalLink,
  Settings2
} from "lucide-react";
import ManagerCalendar from "@/components/manager/ManagerCalendar";
import ScheduleAdjustPopup from "@/components/manager/ScheduleAdjustPopup";
import RequestTable from "@/components/manager/RequestTable";
import ConsultationDetailPopup from "@/components/manager/ConsultationDetailPopup";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";

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

  // 날짜 안전 추출 헬퍼 함수
  const getConfirmedDate = (apt: any): Date | null => {
    if (!apt) return null;
    
    // 지원하는 날짜 필드 목록
    const dateFields = [
      apt.confirmed_datetime,
      apt.assigned_time,
      apt.confirmed?.datetime,
      apt.datetime
    ];

    for (const rawDate of dateFields) {
      if (rawDate && typeof rawDate === 'string') {
        try {
          // "YYYY-MM-DD HH:MM" 또는 ISO 형식을 처리
          const dateStr = rawDate.split(' ')[0];
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) return dateObj;
        } catch (e) {
          continue;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        console.log('[대시보드] 병렬 데이터 로딩 시작...');
        
        // 두 개의 웹훅을 동시에 호출
        const [mainRes, confirmedRes] = await Promise.all([
          postToWebhook(WEBHOOK_URLS.GET_MANAGER_DASHBOARD, {
            manager_email: user?.email,
            timestamp: new Date().toISOString()
          }),
          postToWebhook(WEBHOOK_URLS.GET_DASHBOARD_PREVIEW, {
            manager_email: user?.email,
            timestamp: new Date().toISOString()
          })
        ]);
        
        // 1. 메인 데이터 처리 (요약 정보, 캘린더, 미확정 리스트)
        if (mainRes) {
          const rawData = Array.isArray(mainRes) ? mainRes[0] : mainRes;
          console.log('[대시보드] 메인 데이터 수신:', rawData);
          
          const processedData = {
            pending_count: rawData.summary?.total_pending || 0,
            auto_assigned_count: rawData.summary?.auto_assigned_count || 0,
            completed_today: 0,
            calendar_events: rawData.calendar_events || [],
            analyzed_list: rawData.analyzed_list || [],
            requests: []
          };
          setData(processedData);
        }

        // 2. 확정된 상담 데이터 처리 (따로 로딩한 데이터)
        if (confirmedRes) {
          console.log('[대시보드] 확정 데이터 원본:', confirmedRes);
          
          let rawConfirmed: any[] = [];
          
          // 다양한 응답 구조 처리
          if (Array.isArray(confirmedRes)) {
            const firstElement = confirmedRes[0];
            if (firstElement && firstElement.confirmed_list) {
              // 사용자 제공 구조: [{ confirmed_list: [...] }]
              rawConfirmed = firstElement.confirmed_list;
            } else if (firstElement && Array.isArray(firstElement)) {
              // 중첩 배열 구조: [[{...}, {...}]]
              rawConfirmed = firstElement;
            } else {
              // 단순 배열 구조: [{...}, {...}]
              rawConfirmed = confirmedRes;
            }
          } else if (confirmedRes.confirmed_appointments) {
            rawConfirmed = confirmedRes.confirmed_appointments;
          } else if (confirmedRes.confirmed_list) {
            rawConfirmed = confirmedRes.confirmed_list;
          }

          console.log('[대시보드] 추출된 확정 리스트:', rawConfirmed);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const futureAppointments = rawConfirmed.filter((apt: any) => {
            const aptDate = getConfirmedDate(apt);
            if (!aptDate) return false;
            aptDate.setHours(0, 0, 0, 0);
            return aptDate >= today;
          });
          
          setConfirmedAppointments(futureAppointments);
          console.log('[대시보드] 필터링된 확정 상담 개수:', futureAppointments.length);
          
          if (futureAppointments.length > 0) {
            const firstApt = futureAppointments[0];
            const firstDateObj = getConfirmedDate(firstApt);
            if (firstDateObj) {
              setSelectedDate(firstDateObj);
            }
          }
        }
      } catch (err) {
        console.error("[대시보드] 데이터 로딩 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchDashboard();
  }, [user]);

  const refetchDashboard = async () => {
    setIsLoading(true);
    try {
      console.log('[대시보드] 병렬 재조회 시작...');
      
      const [mainRes, confirmedRes] = await Promise.all([
        postToWebhook(WEBHOOK_URLS.GET_MANAGER_DASHBOARD, {
          manager_email: user?.email,
          timestamp: new Date().toISOString()
        }),
        postToWebhook(WEBHOOK_URLS.GET_DASHBOARD_PREVIEW, {
          manager_email: user?.email,
          timestamp: new Date().toISOString()
        })
      ]);
      
      if (mainRes) {
        const rawData = Array.isArray(mainRes) ? mainRes[0] : mainRes;
        const processedData = {
          pending_count: rawData.summary?.total_pending || 0,
          auto_assigned_count: rawData.summary?.auto_assigned_count || 0,
          completed_today: 0,
          calendar_events: rawData.calendar_events || [],
          analyzed_list: rawData.analyzed_list || [],
          requests: []
        };
        setData(processedData);
      }
      
      if (confirmedRes) {
        let rawConfirmed: any[] = [];
        
        if (Array.isArray(confirmedRes)) {
          const firstElement = confirmedRes[0];
          if (firstElement && firstElement.confirmed_list) {
            rawConfirmed = firstElement.confirmed_list;
          } else if (firstElement && Array.isArray(firstElement)) {
            rawConfirmed = firstElement;
          } else {
            rawConfirmed = confirmedRes;
          }
        } else if (confirmedRes.confirmed_appointments) {
          rawConfirmed = confirmedRes.confirmed_appointments;
        } else if (confirmedRes.confirmed_list) {
          rawConfirmed = confirmedRes.confirmed_list;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureAppointments = rawConfirmed.filter((apt: any) => {
          const aptDate = getConfirmedDate(apt);
          if (!aptDate) return false;
          aptDate.setHours(0, 0, 0, 0);
          return aptDate >= today;
        });
        
        setConfirmedAppointments(futureAppointments);
        console.log('[대시보드] 재조회 완료 - 확정 상담 개수:', futureAppointments.length);
      }
    } catch (err) {
      console.error("[대시보드] 데이터 재조회 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenScheduleAdjust = () => {
    setShowAdjustPopup(true);
  };

  const handleEventClick = (event: any) => {
    console.log("Event clicked:", event);
    // TODO: 일정 상세 보기 모달
  };

  const handleConfirmAssignments = async (webhookResponse: any) => {
    console.log("[handleConfirmAssignments] 원본 응답:", webhookResponse);
    console.log("[handleConfirmAssignments] 응답 타입:", typeof webhookResponse);
    console.log("[handleConfirmAssignments] 배열 여부:", Array.isArray(webhookResponse));
    
    // 배열로 감싸진 응답 처리
    let responseData = webhookResponse;
    
    // n8n이 배열로 감싸서 반환하는 경우 처리
    if (Array.isArray(webhookResponse) && webhookResponse.length > 0) {
      responseData = webhookResponse[0];
      console.log("[handleConfirmAssignments] 배열에서 추출한 데이터:", responseData);
    }
    
    // confirmed_list 추출
    const confirmedList = responseData?.confirmed_list || [];
    console.log("[handleConfirmAssignments] Confirmed list:", confirmedList);
    console.log("[handleConfirmAssignments] Confirmed list 길이:", confirmedList.length);
    
    if (confirmedList.length > 0) {
      console.log("[handleConfirmAssignments] 첫 번째 항목:", confirmedList[0]);
      
      // 첫 번째 상담 날짜로 자동 이동
      const firstAppointment = confirmedList[0];
      const firstDate = firstAppointment.confirmed_datetime.split(' ')[0]; // "2026-02-20"
      const dateObj = new Date(firstDate);
      setSelectedDate(dateObj);
      console.log("[handleConfirmAssignments] 날짜 자동 이동:", firstDate);
    }
    
    setConfirmedAppointments(confirmedList);
    setShowAdjustPopup(false);
    
    // 대시보드 데이터 새로고침 (캘린더 업데이트)
    console.log("[handleConfirmAssignments] 대시보드 데이터 재조회 시작");
    await refetchDashboard();
  };

  const handleViewDetail = async (requestId: string, email: string) => {
    try {
      console.log('[handleViewDetail] 상세 데이터 조회:', { requestId, email });
      
      setIsLoadingDetail(true);
      setShowDetailPopup(true);
      
      // send-preview-data 웹훅 호출
      const response = await fetch('https://primary-production-1f39e.up.railway.app/webhook/send-preview-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          email: email
        })
      });
      
      if (!response.ok) {
        throw new Error('상세 데이터 조회에 실패했습니다');
      }
      
      const result = await response.json();
      console.log('[handleViewDetail] 웹훅 응답:', result);
      console.log('[handleViewDetail] 응답 타입:', typeof result);
      console.log('[handleViewDetail] 응답이 배열인가?', Array.isArray(result));
      
      // n8n이 배열로 감싸서 반환할 수 있으므로 처리
      const data = Array.isArray(result) ? result[0] : result;
      console.log('[handleViewDetail] 처리된 데이터:', data);
      
      setDetailData(data);
    } catch (error) {
      console.error('[handleViewDetail] 에러:', error);
      setDetailData({ error: '데이터를 불러올 수 없습니다.' });
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
          calendarEvents={data?.calendar_events || []} 
          onEventClick={handleEventClick}
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
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 1);
                  setSelectedDate(newDate);
                }}
                className="w-10 h-10 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center transition-all"
              >
                ◀
              </button>
              <div className="text-center min-w-[200px]">
                <p className="text-lg font-bold text-zinc-900">
                  {selectedDate.toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + 1);
                  setSelectedDate(newDate);
                }}
                className="w-10 h-10 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center transition-all"
              >
                ▶
              </button>
            </div>
          </div>

          {/* 선택된 날짜의 상담 목록 */}
          {(() => {
            const selectedDateStr = selectedDate.toISOString().split('T')[0];
            const filteredAppointments = confirmedAppointments.filter(apt => {
              const aptDate = apt.confirmed_datetime.split(' ')[0];
              return aptDate === selectedDateStr;
            });

            if (filteredAppointments.length === 0) {
              return (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-zinc-300 mb-3" size={48} />
                  <p className="text-zinc-400">이 날짜에 예정된 상담이 없습니다.</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.request_id}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      {/* 왼쪽: 기본 정보 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-xl text-zinc-900">{appointment.name}</h3>
                          <span className="text-sm text-zinc-500">
                            {appointment.age}세 · {appointment.gender === 'male' ? '남성' : '여성'}
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            {appointment.job_status}
                          </span>
                        </div>

                        <div className="space-y-2 mb-3">
                          {/* 시간 - 강조 */}
                          <div className="flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" />
                            <span className="font-bold text-lg text-zinc-900">{appointment.confirmed_datetime}</span>
                          </div>

                          {/* 방식 & 장소 - 그룹화 */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500">방식:</span>
                              <span className="font-semibold text-zinc-800">
                                {appointment.confirmed_method === 'online' ? '온라인' :
                                 appointment.confirmed_method === 'offline' ? '오프라인' :
                                 appointment.confirmed_method === 'phone' ? '전화' : appointment.confirmed_method}
                              </span>
                            </div>
                            {appointment.confirmed_location && (
                              <>
                                <span className="text-zinc-300">|</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500">장소:</span>
                                  <span className="font-semibold text-zinc-800">
                                    {appointment.confirmed_location === 'center' ? '센터' : appointment.confirmed_location}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 관심 분야 */}
                        {appointment.interest_areas && appointment.interest_areas.length > 0 && (
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

                      {/* 오른쪽: 상세보기 버튼 */}
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

      {/* 일정 조율 팝업 */}
      <ScheduleAdjustPopup
        isOpen={showAdjustPopup}
        onClose={() => setShowAdjustPopup(false)}
        analyzedList={data?.analyzed_list || []}
        calendarEvents={data?.calendar_events || []}
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
