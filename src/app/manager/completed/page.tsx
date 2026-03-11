"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  FileCheck, 
  Search, 
  User, 
  Mail, 
  Calendar, 
  MoreHorizontal,
  ChevronLeft,
  Loader2,
  ExternalLink
} from "lucide-react";
import { postToWebhook } from "@/lib/api";
import { WEBHOOK_URLS } from "@/config/webhooks";
import Link from "next/link";

export default function CompletedConsultationsPage() {
  const { user } = useAuth();
  const [completedList, setCompletedList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  // 월 이동 핸들러
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (direction === 'prev' && currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1]);
    }
  };

  useEffect(() => {
    const fetchCompletedData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // n8n에서 상담 완료 내역 전용 웹훅 호출
        const response = await postToWebhook(WEBHOOK_URLS.GET_COMPLETED_LIST, {
          manager_email: user.email,
          timestamp: new Date().toISOString()
        });

        let rawData = [];
        if (Array.isArray(response)) {
          // [ { success: true, data: [...] } ] 형태인 경우 첫 번째 요소의 data 추출
          if (response[0]?.data && Array.isArray(response[0].data)) {
            rawData = response[0].data;
          } else {
            rawData = response;
          }
        } else {
          rawData = response?.data || response?.applications || response?.completed_list || [];
        }

        // 안전을 위해 한 번 더 status 필터링
        const filtered = Array.isArray(rawData) ? rawData.filter((item: any) => item.status === "completed") : [];
        setCompletedList(filtered);

        // 사용 가능한 월 리스트 추출 (YYYY-MM)
        const months = new Set<string>();
        filtered.forEach((item: any) => {
          const dt = item.confirmed_datetime || item.time;
          if (dt) {
            const datePart = dt.split(" ")[0]; // YYYY-MM-DD
            if (datePart) {
              const [year, month] = datePart.split("-");
              if (year && month) months.add(`${year}-${month}`);
            }
          }
        });
        const sortedMonths = Array.from(months).sort().reverse();
        setAvailableMonths(sortedMonths);
        
        // 데이터가 있다면 가장 최근 월을 기본값으로 설정
        if (sortedMonths.length > 0) {
          setSelectedMonth(sortedMonths[0]);
        }
      } catch (error) {
        console.error("Failed to fetch completed consultations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedData();
  }, [user]);

  const filteredData = completedList.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedMonth === "all") return matchesSearch;
    
    const dt = item.confirmed_datetime || item.time;
    if (!dt) return false;
    return matchesSearch && dt.startsWith(selectedMonth);
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/manager/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">상담 완료 내역</h1>
          </div>
          <p className="text-slate-500 ml-12">과거에 완료된 모든 상담 기록을 확인하고 관리할 수 있습니다.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="이름 또는 이메일로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
          />
        </div>
      </div>
      
      {/* Calendar Style Navigation */}
      {!isLoading && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all">
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
              <button
                onClick={() => handleMonthChange('prev')}
                disabled={availableMonths.indexOf(selectedMonth) === availableMonths.length - 1}
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none text-slate-600"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="px-6 py-2 min-w-[160px] text-center">
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  {selectedMonth ? (() => {
                    const [year, month] = selectedMonth.split("-");
                    return `${year}년 ${parseInt(month)}월`;
                  })() : "데이터 없음"}
                </span>
              </div>

              <button
                onClick={() => handleMonthChange('next')}
                disabled={availableMonths.indexOf(selectedMonth) <= 0}
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none text-slate-600 rotate-180"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            {selectedMonth && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 animate-in fade-in zoom-in duration-300">
                <FileCheck size={16} />
                <span className="text-sm font-black text-blue-700">{filteredData.length}건 완료</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedMonth("all")}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                selectedMonth === "all"
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              전체 내역 보기
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-slate-500 font-medium">데이터를 불러오는 중입니다...</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">신청자</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">나이</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">주요 관심사</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">상담 일시</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map((item, idx) => (
                  <tr key={item.request_id || idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                          <User size={18} />
                        </div>
                        <span className="font-bold text-slate-900">{item.name || "미입력"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-300" />
                        {item.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">
                      {item.age}세
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(item.interest_areas) ? item.interest_areas : (item.interest_areas?.split(",") || [])).slice(0, 2).map((area: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                            {area.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-300" />
                        {(() => {
                          const dt = item.confirmed_datetime || item.time;
                          if (!dt) return "-";
                          // YYYY-MM-DD HH:MM... 형식에서 HH(시)까지만 추출
                          const parts = dt.split(" ");
                          if (parts.length >= 2) {
                            const timeParts = parts[1].split(":");
                            return `${parts[0]} ${timeParts[0]}시`;
                          }
                          return parts[0];
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/manager/consultation/${item.request_id}/report`}
                        className="p-2 text-slate-400 hover:text-primary transition-colors inline-flex items-center gap-1 text-xs font-bold"
                      >
                        상세 <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
              <FileCheck size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-900 font-bold">완료된 상담 내역이 없습니다.</p>
              <p className="text-slate-400 text-sm">진행 중인 상담이 완료되면 이곳에 표시됩니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
