"use client";

import React from "react";

interface OpclLogoSymbolProps {
  size?: number | string;
  variant?: "grid" | "cross" | "cycle";
  className?: string;
}

export default function OpclLogoSymbol({
  size = 32,
  variant = "grid",
  className = ""
}: OpclLogoSymbolProps) {
  // 1. [2x2 그리드 엠블럼형] : 안정적인 4분할 배치 (상좌 ㅇ, 상우 ㄱ, 하좌 ㄷ, 하우 ㄱ)
  if (variant === "grid") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-gradient-to-br from-blue-600 via-primary to-indigo-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0 select-none ${className}`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[80%] h-[80%]"
        >
          {/* ㅇ (상좌) */}
          <circle
            cx="13"
            cy="13"
            r="5"
            stroke="white"
            strokeWidth="3.2"
          />
          {/* ㄱ (상우) */}
          <path
            d="M 23 9 H 31 V 17"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* ㄷ (하좌) */}
          <path
            d="M 18 24 H 9 V 32 H 18"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* ㄱ (하우) */}
          <path
            d="M 23 24 H 31 V 32"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  // 2. [십자 4방향 크로스형] : 상(ㅇ), 우(ㄱ), 하(ㄷ), 좌(ㄱ)
  if (variant === "cross") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0 select-none ${className}`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[82%] h-[82%]"
        >
          {/* 중앙 소프트 포인트 */}
          <circle cx="20" cy="20" r="1.5" fill="white" opacity="0.6" />
          
          {/* 상: ㅇ */}
          <circle cx="20" cy="10" r="4.2" stroke="white" strokeWidth="2.8" />
          
          {/* 우: ㄱ */}
          <path d="M 28 17 H 33 V 22" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* 하: ㄷ */}
          <path d="M 24 30 H 16 V 36 H 24" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* 좌: ㄱ */}
          <path d="M 7 17 H 12 V 22" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  // 3. [순환형 모듈러]
  return (
    <div
      style={{ width: size, height: size }}
      className={`bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0 select-none ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[80%] h-[80%]"
      >
        <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="3" />
        <path d="M 24 8 H 32 V 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 16 25 H 8 V 33 H 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 24 25 H 32 V 33" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
