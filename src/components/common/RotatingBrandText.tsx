"use client";

import React, { useState, useEffect } from "react";

interface RotatingBrandTextProps {
  className?: string;
}

// 어린이가 크레파스로 정성스럽게 꾹꾹 눌러쓴 듯한 몽글몽글하고 포근한 한글 '온' (SVG 벡터)
function CrayonHandmadeOn() {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] md:w-[24px] md:h-[24px] inline-block align-middle select-none"
    >
      <defs>
        {/* 파스텔 블루에서 시작해 따뜻한 온기(소프트 코랄/핑크)로 스며드는 크레용 웜 그라데이션 */}
        <linearGradient id="crayonWarmOnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>

      {/* 1. 초성 'ㅇ' - 몽글몽글하고 둥근 크레파스 원형 */}
      <circle
        cx="18"
        cy="10.5"
        r="4.8"
        stroke="url(#crayonWarmOnGradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* 2. 중성 'ㅗ' - 다정하게 받쳐주는 손글씨 기둥과 가로획 */}
      {/* ㅗ 세로 기둥 */}
      <path
        d="M 18 15.5 V 19.5"
        stroke="url(#crayonWarmOnGradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* ㅗ 가로 획 (부드럽게 둥근 모서리) */}
      <path
        d="M 8.5 20 H 27.5"
        stroke="url(#crayonWarmOnGradient)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />

      {/* 3. 종성 'ㄴ' - 포근하게 감싸 안아주는 둥근 니은 받침 */}
      <path
        d="M 11.5 24.5 V 28.5 Q 11.5 30 13 30 H 24.5"
        stroke="url(#crayonWarmOnGradient)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 8단계 교대 순환 (이모지/한글 '온' 사이마다 무조건 'ON' 삽입)
const ROTATION_ITEMS = [
  { id: "on-1", label: "스마트 상담 ON", text: "ON", type: "on" },
  { id: "light", label: "고민 해결의 불을 켜다", emoji: "💡", type: "emoji" },
  { id: "on-2", label: "스마트 상담 ON", text: "ON", type: "on" },
  { id: "chat", label: "언제나 열려있는 온라인 상담 창구", emoji: "💬", type: "emoji" },
  { id: "on-3", label: "스마트 상담 ON", text: "ON", type: "on" },
  { id: "on-korean", label: "청년을 품는 따뜻한 온기 (온)", type: "crayon-on" },
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
    if (item.type === "crayon-on") {
      return <CrayonHandmadeOn />;
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
