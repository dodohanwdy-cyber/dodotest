"use client";

import React, { useState, useEffect } from "react";

interface RotatingBrandTextProps {
  className?: string;
}

export default function RotatingBrandText({ className = "" }: RotatingBrandTextProps) {
  // 5가지 순환 키워드 (글자 제거, 순수 심볼/이모지/한자)
  const ROTATION_ITEMS = [
    { id: "on", label: "스마트 상담 ON", type: "on" },
    { id: "light", label: "고민 해결의 불을 켜다", emoji: "💡", type: "emoji" },
    { id: "chat", label: "언제나 열려있는 온라인 상담 창구", emoji: "💬", type: "emoji" },
    { id: "wen", label: "따뜻할 온 (溫)", text: "溫", type: "hanja" },
    { id: "heart", label: "청년을 품는 따뜻한 마음", emoji: "🧡", type: "emoji" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ROTATION_ITEMS.length);
    }, 2500); // 2.5초마다 회전

    return () => clearInterval(interval);
  }, [ROTATION_ITEMS.length]);

  return (
    <span
      className={`inline-block relative h-6 sm:h-7 md:h-8 w-6 sm:w-7 md:w-8 overflow-hidden select-none align-middle ${className}`}
      title={ROTATION_ITEMS[currentIndex].label}
    >
      {/* 아래에서 위로 밀어올리는 세로 롤러 릴 (Vertical Push-up Reel) */}
      <div
        className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
      >
        {ROTATION_ITEMS.map((item, idx) => (
          <div
            key={item.id}
            className="h-6 sm:h-7 md:h-8 flex items-center justify-center shrink-0"
          >
            {item.type === "on" ? (
              <span className="text-primary font-black font-sans text-sm sm:text-base md:text-[17px] tracking-tight leading-none">
                ON
              </span>
            ) : item.type === "hanja" ? (
              /* 모든 OS(Windows, Mac, iOS, Android)에서 깨짐 없이 세련되게 렌더링되는 프리미엄 명조 한자 서체 */
              <span
                style={{
                  fontFamily: '"Pretendard Var", "Noto Serif KR", "Apple SD Gothic Neo", "Songti SC", "Malgun Gothic", serif',
                }}
                className="text-indigo-600 font-black text-sm sm:text-base md:text-[18px] leading-none select-none tracking-tight"
              >
                {item.text}
              </span>
            ) : (
              <span className="text-sm sm:text-base md:text-[17px] leading-none select-none">
                {item.emoji}
              </span>
            )}
          </div>
        ))}
      </div>
    </span>
  );
}
