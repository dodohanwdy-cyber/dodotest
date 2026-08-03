"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface UITagContextType {
  showTags: boolean;
  setShowTags: (show: boolean) => void;
  toggleTags: () => void;
}

const UITagContext = createContext<UITagContextType>({
  showTags: true,
  setShowTags: () => {},
  toggleTags: () => {},
});

export const UITagProvider = ({ children }: { children: React.ReactNode }) => {
  const [showTags, setShowTagsState] = useState<boolean>(true);

  useEffect(() => {
    // 로컬 스토리지 또는 URL 파라미터에서 설정 불러오기
    const saved = localStorage.getItem("show_ui_tags");
    if (saved !== null) {
      setShowTagsState(saved === "true");
    }
  }, []);

  const setShowTags = (show: boolean) => {
    setShowTagsState(show);
    localStorage.setItem("show_ui_tags", String(show));
  };

  const toggleTags = () => {
    setShowTags(!showTags);
  };

  return (
    <UITagContext.Provider value={{ showTags, setShowTags, toggleTags }}>
      {children}
    </UITagContext.Provider>
  );
};

export const useUITag = () => useContext(UITagContext);
