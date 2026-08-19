"use client";

import React, { useState, useEffect } from "react";

interface RotatingBrandTextProps {
  className?: string;
}

export default function RotatingBrandText({ className = "" }: RotatingBrandTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 5가지 순환 키워드 & 최적화된 이모지 매칭
  const ROTATION_ITEMS = [
    { text: "ON", label: "스마트 상담 ON", color: "text-primary" },
    { text: "💡 켜다", label: "고민의 불을 켜다", color: "text-amber-500" },
    { text: "💬 온라인", label: "언제나 열려있는 상담 창구", color: "text-blue-600" },
    { text: "溫", label: "따뜻할 온", color: "text-indigo-600" },
    { text: "🧡 온기", label: "청년을 품는 따뜻한 마음", color: "text-rose-500" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ROTATION_ITEMS.length);
        setIsTransitioning(false);
      }, 350); // 슬라이드 아웃 완료 시간
    }, 2800); // 2.8초마다 전환

    return () => clearInterval(interval);
  }, [ROTATION_ITEMS.length]);

  const currentItem = ROTATION_ITEMS[currentIndex];

  return (
    <span className={`inline-flex items-center h-6 sm:h-7 md:h-8 overflow-hidden select-none ${className}`}>
      <span
        title={currentItem.label}
        className={`font-black tracking-tight font-sans transition-all duration-350 transform text-sm sm:text-base md:text-[17px] leading-none inline-block ${
          currentItem.color
        } ${
          isTransitioning
            ? "-translate-y-full opacity-0 scale-90"
            : "translate-y-0 opacity-100 scale-100"
        }`}
      >
        {currentItem.text}
      </span>
    </span>
  );
}
