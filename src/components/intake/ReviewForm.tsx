"use client";

import { User, MapPin, Briefcase, Calendar, CheckCircle2, Edit2, Loader2, Sparkles } from "lucide-react";

interface ReviewFormProps {
  data: any;
  onEdit: (step: string) => void;
  onSubmit: () => void;
  isReadOnly?: boolean;
}

export default function ReviewForm({ data, onEdit, onSubmit, isReadOnly }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = (typeof window !== 'undefined') ? require('react').useState(false) : [false, () => {}];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit();
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 sm:space-y-8 py-2 sm:py-4">
      <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
        {/* 기본 정보 확인 */}
        <div className="md:col-span-2 card-premium p-3.5 sm:p-6 rounded-xl sm:rounded-2xl relative group">
          {!isReadOnly && (
            <button 
              onClick={() => onEdit("section-1")}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1 text-[11px] sm:text-xs font-bold"
            >
              <Edit2 size={12} />
              수정
            </button>
          )}
          
          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <User size={14} className="text-primary sm:w-4 sm:h-4" /> 기본 정보
          </h3>
          <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between border-b border-zinc-50 pb-1.5 sm:pb-2">
                <span className="text-[11px] sm:text-xs text-zinc-400">이름 / 나이</span>
                <span className="text-xs sm:text-sm font-semibold">{data.name} ({data.age}세)</span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 pb-1.5 sm:pb-2">
                <span className="text-[11px] sm:text-xs text-zinc-400">지역</span>
                <span className="text-xs sm:text-sm font-semibold">{data.regional_local_government} {data.basic_local_government}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 pb-1.5 sm:pb-2">
                <span className="text-[11px] sm:text-xs text-zinc-400">취업 / 소득</span>
                <span className="text-xs sm:text-sm font-semibold">{data.job_status} / {data.income_level}</span>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] sm:text-xs font-bold text-zinc-500 mb-2">관심 정책 및 상황</h4>
              <div className="flex flex-wrap gap-1.5">
                {data.interest_areas?.map((item: string) => (
                  <span key={item} className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] sm:text-[11px] font-bold">#{item.split(' ')[0]}</span>
                ))}
                {data.special_notes?.map((item: string) => (
                  <span key={item} className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-pink-50 text-pink-600 rounded-full text-[10px] sm:text-[11px] font-bold">#{item}</span>
                ))}
              </div>
            </div>
          </div>

          {data.benefited_policy && (
            <div className="mt-3 sm:mt-6 pt-3 sm:pt-6 border-t border-zinc-100">
              <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 block mb-1 uppercase">기존 수혜 정책</span>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed bg-zinc-50/50 p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-zinc-100">{data.benefited_policy}</p>
            </div>
          )}
        </div>

        {/* 예약 일정 확인 */}
        <div className="md:col-span-2 card-premium p-3.5 sm:p-6 rounded-xl sm:rounded-2xl relative group">
          {!isReadOnly && (
            <button 
              onClick={() => onEdit("section-2")}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1 text-[11px] sm:text-xs font-bold"
            >
              <Edit2 size={12} />
              수정
            </button>
          )}

          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <Calendar size={14} className="text-primary sm:w-4 sm:h-4" /> 선택한 상담 일정
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: "1순위", value: data.request_time_1 },
              { label: "2순위", value: data.request_time_2 },
              { label: "3순위", value: data.request_time_3 }
            ].map((item, idx) => (
              item.value ? (
                <div key={idx} className="flex items-center sm:flex-col sm:items-start justify-between sm:justify-start gap-1.5 sm:gap-2 p-2.5 sm:p-4 bg-zinc-50 rounded-lg sm:rounded-xl border border-zinc-100">
                  <span className="text-[10px] sm:text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md sm:rounded-lg w-fit">{item.label}</span>
                  <span className="text-xs sm:text-sm font-bold text-zinc-700">{item.value}</span>
                </div>
              ) : (
                <div key={idx} className="flex items-center sm:flex-col sm:items-start justify-between sm:justify-start gap-1.5 sm:gap-2 p-2.5 sm:p-4 bg-zinc-50/50 rounded-lg sm:rounded-xl border border-dashed border-zinc-200">
                  <span className="text-[10px] sm:text-xs font-black text-zinc-300 bg-zinc-100 px-2 py-0.5 rounded-md sm:rounded-lg w-fit">{item.label}</span>
                  <span className="text-xs sm:text-sm text-zinc-400">미선택</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {!isReadOnly ? (
        <>
          <div className="bg-amber-50 border border-amber-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-start gap-2.5">
            <div className="text-amber-500 mt-0.5 shrink-0"><CheckCircle2 size={16} /></div>
            <p className="text-[11px] sm:text-xs text-amber-700 leading-relaxed break-keep font-medium">
              작성된 내용이 모두 맞다면 아래 버튼을 눌러 상담 신청을 확정해 주세요.
            </p>
          </div>

          <div className="pt-2 sm:pt-6">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-zinc-900 text-white py-3.5 sm:py-5 rounded-xl sm:rounded-[2rem] font-bold text-xs sm:text-base flex items-center justify-center gap-2 btn-interactive shadow-lg sm:shadow-xl shadow-zinc-200"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "입력 내용 확인 및 상담 신청 확정"}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-blue-50 border border-blue-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex gap-2.5 mt-4 sm:mt-6">
          <div className="text-blue-500 mt-0.5 shrink-0"><CheckCircle2 size={16} /></div>
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            이미 제출된 신청서입니다.
          </p>
        </div>
      )}
    </div>
  );
}
