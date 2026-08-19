"use client";

import React, { useState, useEffect } from "react";

interface RotatingBrandTextProps {
  className?: string;
}

// 서예 붓글씨 느낌의 한자 '溫' 전용 SVG 벡터 컴포넌트 (모든 기기에서 100% 동일하게 붓터치 렌더링)
function CalligraphyWen() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[19px] h-[19px] sm:w-[21px] sm:h-[21px] md:w-[23px] md:h-[23px] text-indigo-600 inline-block align-middle select-none"
    >
      {/* 삼수변 (氵) - 붓글씨 점획과 삐침 */}
      <path
        d="M 6.5 7.5 C 7.8 8.8 8.8 10.5 7.8 11.8 C 7 12.8 5.5 11.5 5 10 C 4.5 8.8 5.2 7 6.5 7.5 Z"
        fill="currentColor"
      />
      <path
        d="M 5 15 C 6.5 16.2 7.8 17.5 7 18.8 C 6.2 19.8 4.8 18.5 4.2 17.2 C 3.6 15.8 4.2 14.5 5 15 Z"
        fill="currentColor"
      />
      <path
        d="M 4 26 C 5.5 24 7.5 20.5 9 17 C 9.5 16 10.5 16.8 9.8 18.2 C 8.2 21.5 6 25.5 4.5 27.5 C 3.8 28.5 3 27.5 4 26 Z"
        fill="currentColor"
      />

      {/* 우상단 (日) - 정갈한 붓글씨 날 일 */}
      <path
        d="M 13 6.5 C 13.8 6.5 13.8 15 13.2 15.5 C 12.6 15.5 12.6 6.5 13 6.5 Z"
        fill="currentColor"
      />
      <path
        d="M 13 6.8 C 17 6.2 24.5 5.8 26 7 C 26.8 7.8 26.2 15 25.5 15.5 C 24.5 15.5 24.8 8.2 21 8.2 C 18 8.2 15 8.5 13.5 8.5 Z"
        fill="currentColor"
      />
      {/* 日 내부 가로 획 */}
      <path
        d="M 13.5 11 C 17 10.8 22 10.5 25 10.8 C 25.5 10.8 25.5 11.8 24.8 11.8 C 21 11.8 17 12 13.5 12 Z"
        fill="currentColor"
      />
      {/* 日 하단 가로 획 */}
      <path
        d="M 13.2 15 C 17 14.8 22 14.5 25.5 14.8 C 26 14.8 26 15.8 25.2 15.8 C 21 15.8 17 16 13.2 16 Z"
        fill="currentColor"
      />

      {/* 우하단 (皿) - 그릇 명 붓 획과 갈고리 */}
      {/* 皿 상단 가로 획 */}
      <path
        d="M 11.5 18.2 C 16 17.8 25.5 17.2 28 18.2 C 28.8 18.5 28.5 19.5 27.5 19.5 C 24 19.2 16 19.5 11.5 19.5 Z"
        fill="currentColor"
      />
      {/* 皿 좌측 세로 */}
      <path
        d="M 13.5 19 C 14 19 13.8 26 13 26 C 12.5 26 12.5 19 13.5 19 Z"
        fill="currentColor"
      />
      {/* 皿 우측 세로 및 갈고리 */}
      <path
        d="M 26 18.5 C 26.8 18.5 26.5 25.5 26 26.2 C 25.2 27 24 26.5 24 25.5 C 24 24.5 24.8 19.5 26 18.5 Z"
        fill="currentColor"
      />
      {/* 皿 중간 두 기둥 */}
      <path
        d="M 17.5 19 C 18 19 18 25.5 17.5 25.5 C 17 25.5 17 19 17.5 19 Z"
        fill="currentColor"
      />
      <path
        d="M 21.5 19 C 22 19 22 25.5 21.5 25.5 C 21 25.5 21 19 21.5 19 Z"
        fill="currentColor"
      />
      {/* 皿 바닥 웅장한 가로 획 (서예의 마무리 필맥) */}
      <path
        d="M 9.5 26 C 15 25.5 26 25 29.5 26.2 C 30.5 26.6 30 28 28.5 27.8 C 24 27.2 15 27.5 9.5 27.8 C 8.5 27.8 8.5 26 9.5 26 Z"
        fill="currentColor"
      />
    </svg>
  );
}

// 8단계 교대 순환 (이모지/한자 사이마다 무조건 'ON' 삽입)
const ROTATION_ITEMS = [
  { id: "on-1", label: "스마트 상담 ON", text: "ON", type: "on" },
  { id: "light", label: "고민 해결의 불을 켜다", emoji: "💡", type: "emoji" },
  { id: "on-2", label: "스마트 상담 ON", text: "ON", type: "on" },
  { id: "chat", label: "언제나 열려있는 온라인 상담 창구", emoji: "💬", type: "emoji" },
  { id: "on-3", label: "스마트 상담 ON", text: "ON", type: "on" },
  { id: "wen", label: "청년을 향한 따뜻할 온 (溫)", type: "calligraphy" },
  { id: "on-4", label: "스마트 상담 ON", text: "ON", type: "on" },
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
    if (item.type === "calligraphy") {
      return <CalligraphyWen />;
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
