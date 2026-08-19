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
    const interval = setInterval(() => {
      const targetNext = (currentIdx + 1) % ROTATION_ITEMS.length;
      setNextIdx(targetNext);
      setIsSliding(true);

      const timer = setTimeout(() => {
        setCurrentIdx(targetNext);
        setIsSliding(false);
      }, 450); // CSS 애니메이션 시간과 정확히 일치

      return () => clearTimeout(timer);
    }, 2800); // 2.8초 동안 완벽히 고정되었다가 부드럽게 전환

    return () => clearInterval(interval);
  }, [currentIdx]);

  const currentItem = ROTATION_ITEMS[currentIdx];
  const nextItem = ROTATION_ITEMS[nextIdx];

  const renderItem = (item: typeof ROTATION_ITEMS[0]) => {
    if (item.type === "on") {
      return (
        <span className="text-primary font-black font-sans text-lg sm:text-xl md:text-[22px] tracking-tight leading-none">
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
          className="text-indigo-600 font-black text-lg sm:text-xl md:text-[22px] leading-none select-none tracking-tight"
        >
          {item.text}
        </span>
      );
    }
    return (
      <span className="text-base sm:text-lg md:text-[20px] leading-none select-none">
        {item.emoji}
      </span>
    );
  };

  return (
    <span
      className={`inline-flex items-center justify-center relative h-7 sm:h-8 w-6 sm:w-7 md:w-8 overflow-hidden select-none align-middle ${className}`}
      title={currentItem.label}
    >
      {!isSliding ? (
        // 1. 고정 상태: 미동도 없이 완벽한 제자리 고정
        <span className="flex items-center justify-center w-full h-full">
          {renderItem(currentItem)}
        </span>
      ) : (
        // 2. 롤링 전환 상태: 위로 밀려나가고 아래에서 쑥 올라옴
        <div className="absolute inset-0 flex flex-col w-full h-full animate-roller-push">
          <span className="flex items-center justify-center w-full h-full shrink-0">
            {renderItem(currentItem)}
          </span>
          <span className="flex items-center justify-center w-full h-full shrink-0">
            {renderItem(nextItem)}
          </span>
        </div>
      )}
    </span>
  );
}
