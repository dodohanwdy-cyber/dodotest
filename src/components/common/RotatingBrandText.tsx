"use client";

import React, { useState, useEffect } from "react";

interface RotatingBrandTextProps {
  className?: string;
}

const ROTATION_ITEMS = [
  { id: "on", label: "스마트 상담 ON", text: "ON", type: "on" },
  { id: "light", label: "고민 해결의 불을 켜다", emoji: "💡", type: "emoji" },
  { id: "chat", label: "언제나 열려있는 온라인 상담 창구", emoji: "💬", type: "emoji" },
  { id: "wen", label: "따뜻할 온 (溫)", text: "溫", type: "hanja" },
  { id: "heart", label: "청년을 품는 따뜻한 마음", emoji: "🧡", type: "emoji" },
];

export default function RotatingBrandText({ className = "" }: RotatingBrandTextProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(1);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const targetNext = (currentIdx + 1) % ROTATION_ITEMS.length;
      setNextIdx(targetNext);
      setIsSliding(true);

      // 슬라이드 애니메이션(450ms) 완료 후 상태 고정
      setTimeout(() => {
        setCurrentIdx(targetNext);
        setIsSliding(false);
      }, 450);
    }, 2600); // 2.6초마다 1개씩 단독 롤링

    return () => clearInterval(timer);
  }, [currentIdx]);

  const renderContent = (item: typeof ROTATION_ITEMS[0]) => {
    if (item.type === "on") {
      return (
        <span className="text-primary font-black font-sans text-sm sm:text-base md:text-[17px] tracking-tight leading-none">
          {item.text}
        </span>
      );
    }
    if (item.type === "hanja") {
      return (
        <span
          style={{
            fontFamily: '"Pretendard Var", "Noto Serif KR", "Apple SD Gothic Neo", "Songti SC", "Malgun Gothic", serif',
          }}
          className="text-indigo-600 font-black text-sm sm:text-base md:text-[17px] leading-none select-none tracking-tight"
        >
          {item.text}
        </span>
      );
    }
    return (
      <span className="text-sm sm:text-base md:text-[16px] leading-none select-none">
        {item.emoji}
      </span>
    );
  };

  const currentItem = ROTATION_ITEMS[currentIdx];
  const nextItem = ROTATION_ITEMS[nextIdx];

  return (
    <span
      className={`inline-block relative h-5 sm:h-6 w-[22px] sm:w-[24px] overflow-hidden select-none align-middle ${className}`}
      title={currentItem.label}
    >
      {/* 1. 현재 아이템: 슬라이딩 시 위로 나감 */}
      <span
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSliding ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {renderContent(currentItem)}
      </span>

      {/* 2. 다음 아이템: 아래에서 위로 진입 */}
      <span
        className={`absolute inset-0 flex items-center justify-center transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSliding ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {renderContent(nextItem)}
      </span>
    </span>
  );
}
