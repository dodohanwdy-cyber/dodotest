"use client";

import React, { useState, useEffect } from "react";

interface RotatingBrandTextProps {
  className?: string;
}

// 어린이가 크레파스로 정성스럽게 꾹꾹 눌러쓴 듯한 포근한 손글씨 '溫' (SVG 벡터)
function CrayonHandmadeWen() {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] md:w-[24px] md:h-[24px] inline-block align-middle select-none"
    >
      <defs>
        {/* 파스텔 블루에서 시작해 따뜻한 온기(소프트 코랄/핑크)로 스며드는 크레용 웜 그라데이션 */}
        <linearGradient id="crayonWarmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>

      {/* 삼수변 (氵) - 동글동글하고 다정한 크레용 터치 */}
      {/* 1. 상단 점 */}
      <circle cx="7" cy="9.5" r="1.8" fill="url(#crayonWarmGradient)" />
      {/* 2. 중단 점 */}
      <circle cx="6" cy="16.5" r="1.8" fill="url(#crayonWarmGradient)" />
      {/* 3. 하단 삐침 */}
      <path
        d="M 5 26.5 Q 7 23.5 9.5 20.5"
        stroke="url(#crayonWarmGradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 우상단 (日) - 둥글고 바르게 쓴 날 일 */}
      {/* 좌측 세로 */}
      <path
        d="M 15 8.5 V 17"
        stroke="url(#crayonWarmGradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* 상단 가로 및 우측 세로 */}
      <path
        d="M 15 8.5 H 27.5 Q 28 8.5 28 9 V 17"
        stroke="url(#crayonWarmGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 중앙 가로 */}
      <path
        d="M 15.5 12.8 H 27"
        stroke="url(#crayonWarmGradient)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* 하단 가로 */}
      <path
        d="M 15.5 17 H 27.5"
        stroke="url(#crayonWarmGradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* 우하단 (皿) - 포근하게 감싸는 그릇 명 */}
      {/* 상단 덮개 가로 */}
      <path
        d="M 12 21.5 H 31"
        stroke="url(#crayonWarmGradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* 좌측 세로 기둥 */}
      <path
        d="M 15.5 22 V 28"
        stroke="url(#crayonWarmGradient)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* 우측 세로 기둥 */}
      <path
        d="M 27.5 22 V 28"
        stroke="url(#crayonWarmGradient)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* 안쪽 1번째 기둥 */}
      <path
        d="M 19.5 22 V 28"
        stroke="url(#crayonWarmGradient)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* 안쪽 2번째 기둥 */}
      <path
        d="M 23.5 22 V 28"
        stroke="url(#crayonWarmGradient)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* 바닥 받침 가로 (포근하고 안정적인 손글씨 맺음) */}
      <path
        d="M 10 28.5 H 33"
        stroke="url(#crayonWarmGradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
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
  { id: "wen", label: "청년을 향한 따뜻할 온 (溫)", type: "crayon" },
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
    if (item.type === "crayon") {
      return <CrayonHandmadeWen />;
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
