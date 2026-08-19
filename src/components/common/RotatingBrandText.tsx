"use client";

import React, { useState, useEffect } from "react";

interface RotatingBrandTextProps {
  className?: string;
}

// 첨부 이미지의 정통 해서체(楷書) 자형과 부드러운 파스텔 웜블루 그라데이션을 적용한 '溫'
function CalligraphyWen() {
  return (
    <svg
      viewBox="0 0 36 36"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] md:w-[24px] md:h-[24px] inline-block align-middle select-none overflow-visible"
    >
      <defs>
        {/* 차가운 느낌을 포근하게 녹여주는 파스텔 웜-블루-라일락 그라데이션 */}
        <linearGradient id="warmPastelBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="45%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="52%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="url(#warmPastelBlue)"
        style={{
          fontFamily: '"STKaiti", "Kaiti", "KaiTi_GB2312", "DFKai-SB", "Noto Serif KR", "Batang", "Apple SD Gothic Neo", serif',
          fontWeight: 900,
          fontSize: '28px',
          letterSpacing: '-0.02em',
        }}
      >
        溫
      </text>
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
