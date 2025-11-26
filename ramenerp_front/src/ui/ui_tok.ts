// src/ui/ui_tok.ts
// 전체 페이지에서 공통으로 쓰는 색 / 라운드 / 포커스 등 UI 토큰

export const ui_tok = {
  // 페이지 배경
  bg_page: "#f5f7fb",

  // 카드 / 패널
  surface: "#ffffff",
  border: "#e5e7eb",
  header_bg: "#f8fafc",
  zebra: "#fafafa",

  // 텍스트
  text: "#111827",
  label: "#6b7280",

  // 기본 라운드
  radius: 12,

  // 버튼 / 포커스
  focus: "0 0 0 3px rgba(14,165,233,0.25)",
  primary_bg: "#0ea5e9",
  primary_border: "#0284c7",
  primary_text: "#ffffff",

  // 경고 / 위험
  danger: "#ef4444",

  // 자잘한 간격 기본값
  gap: 8,
} as const;
