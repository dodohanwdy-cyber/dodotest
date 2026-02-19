"use client";

import { User, MapPin, Briefcase, Calendar, CheckCircle2, Edit2, Loader2, Sparkles } from "lucide-react";

interface ReviewFormProps {
  data: any;
  onEdit: (step: string) => void;
  onSubmit: () => void;
}

export default function ReviewForm({ data, onEdit, onSubmit }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = (typeof window !== 'undefined') ? require('react').useState(false) : [false, () => {}];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit();
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 py-4">
      <div className="grid md:grid-cols-2 gap-6">
        {/* 기본 정보 확인 (관심 정책 통합) */}
        <div className="md:col-span-2 card-premium p-6 relative group">
          <button 
            onClick={() => onEdit("section-1")}
            className="absolute top-4 right-4 px-3 py-2 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Edit2 size={14} />
            수정하기
          </button>
          
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-4">
            <User size={16} className="text-primary" /> 기본 정보
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between border-b border-zinc-50 pb-2">
                <span className="text-xs text-zinc-400">이름 / 나이</span>
                <span className="text-sm font-semibold">{data.name} ({data.age}세)</span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 pb-2">
                <span className="text-xs text-zinc-400">지역</span>
                <span className="text-sm font-semibold">{data.regional_local_government} {data.basic_local_government}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-50 pb-2">
                <span className="text-xs text-zinc-400">취업/소득</span>
                <span className="text-sm font-semibold">{data.job_status} / {data.income_level}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-500 mb-3">관심 정책 및 상황</h4>
              <div className="flex flex-wrap gap-2">
                {data.interest_areas?.map((item: string) => (
                  <span key={item} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-bold">#{item.split(' ')[0]}</span>
                ))}
                {data.special_notes?.map((item: string) => (
                  <span key={item} className="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-[11px] font-bold">#{item}</span>
                ))}
              </div>
            </div>
          </div>

          {data.benefited_policy && (
            <div className="mt-6 pt-6 border-t border-zinc-100">
              <span className="text-[10px] font-bold text-zinc-400 block mb-2 uppercase">이미 혜택을 받은 정책</span>
              <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">{data.benefited_policy}</p>
            </div>
          )}
        </div>

        {/* 예약 일정 확인 (1/2/3순위 모두 표시) */}
        <div className="md:col-span-2 card-premium p-6 relative group">
          <button 
            onClick={() => onEdit("section-2")}
            className="absolute top-4 right-4 px-3 py-2 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Edit2 size={14} />
            수정하기
          </button>

          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-primary" /> 선택한 상담 일정
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "1순위", value: data.request_time_1 },
              { label: "2순위", value: data.request_time_2 },
              { label: "3순위", value: data.request_time_3 }
            ].map((item, idx) => (
              item.value ? (
                <div key={idx} className="flex flex-col gap-2 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg w-fit">{item.label}</span>
                  <span className="text-sm font-bold text-zinc-700">{item.value}</span>
                </div>
              ) : (
                <div key={idx} className="flex flex-col gap-2 p-4 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
                  <span className="text-xs font-black text-zinc-300 bg-zinc-100 px-2 py-1 rounded-lg w-fit">{item.label}</span>
                  <span className="text-sm text-zinc-400">미선택</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
        <div className="text-amber-500 mt-0.5"><CheckCircle2 size={18} /></div>
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>안내:</strong> AI 상담 채팅 내용은 보안 및 리소스 관리 정책에 따라 수정이 불가능합니다. 
          위의 정보가 모두 정확하다면 아래 버튼을 눌러 최종 신청을 완료해 주세요.
        </p>
      </div>

      <div className="pt-6">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-zinc-900 text-white py-5 rounded-[2rem] font-bold flex items-center justify-center gap-2 btn-interactive shadow-xl shadow-zinc-200"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : "입력 내용 확인 및 최종 신청 제출"}
        </button>
      </div>
    </div>
  );
}
