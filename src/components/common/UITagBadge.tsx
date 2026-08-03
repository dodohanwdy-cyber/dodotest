"use client";

import React from "react";
import { useUITag } from "@/context/UITagContext";
import { Tag } from "lucide-react";

interface UITagBadgeProps {
  id: string; // 예: "P-101", "M-01"
  label?: string; // 예: "대시보드", "상세정보 팝업"
  type?: "page" | "modal";
  className?: string;
}

export default function UITagBadge({ id, label, type = "page", className = "" }: UITagBadgeProps) {
  const { showTags } = useUITag();

  if (!showTags) return null;

  const isModal = type === "modal";

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wider transition-all shadow-sm ${
        isModal 
          ? "bg-rose-50 text-rose-600 border border-rose-200/80" 
          : "bg-indigo-50 text-indigo-600 border border-indigo-200/80"
      } ${className}`}
      title={`피드백 식별 코드 (${isModal ? "모달" : "페이지"}: ${id}${label ? ` - ${label}` : ""})`}
    >
      <Tag size={12} className={isModal ? "text-rose-500" : "text-indigo-500"} />
      <span className="font-extrabold uppercase">{isModal ? "MODAL" : "PAGE"}: {id}</span>
      {label && <span className="text-[10px] opacity-75 font-medium border-l pl-1.5 ml-0.5 border-current">{label}</span>}
    </div>
  );
}
