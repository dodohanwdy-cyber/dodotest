"use client";

import React, { useState, useEffect } from "react";

interface RotatingBrandTextProps {
  className?: string;
}

// 8단계 교대 순환 (이모지/한글 '온' 사이마다 무조건 'ON' 삽입)
const ROTATION_ITEMS = [
  { id: "on-1", label: "스마트 상담 ON", text: "ON", type: "on" },
  { id: "light", label: "고민 해결의 불을 켜다", emoji: "💡", type: "emoji" },
  { id: "on-2", label: "스마트 상담 ON", text: "ON", type: "on" },
  { id: "chat", label: "언제나 열려있는 온라인 상담 창구", emoji: "💬", type: "emoji" },
  { id: "on-3", label: "스마트 상담 ON", text: "ON", type: "on" },
  { id: "on-korean", label: "청년을 품는 따뜻한 온기 (온)", text: "온", type: "fromsol-on" },
  { id: "on-4", label: "스마트 상담 ON", text: "ON", type: "on" },
  { id: "heart", label: "청년을 향한 따뜻한 마음", emoji: "🧡", type: "emoji" },
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
      }, 450); // 450ms 부드러운 푸시업 애니메이션

      return () => clearTimeout(timer);
    }, 2400); // 2.4초마다 교대로 부드럽게 롤링

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
    if (item.type === "fromsol-on") {
      return (
        /* 눈누 '그리운 프롬솔' 서체 적용 + 파스텔 웜블루-핑크 온기 그라데이션 */
        <span
          style={{
            fontFamily: '"DearFromsol", "Pretendard Var", sans-serif',
          }}
          className="text-2xl sm:text-[26px] md:text-[28px] font-normal leading-none select-none text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-500 to-pink-500 inline-block transform translate-y-[-1px]"
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
      className={`inline-flex items-center justify-center relative h-7 sm:h-8 w-7 sm:w-8 overflow-hidden select-none align-middle ${className}`}
      title={currentItem.label}
    >
      {!isSliding ? (
        // 1. 고정 상태: 흔들림 없이 정적 유지
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
