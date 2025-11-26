// src/components/common/IconButtons.tsx
import React from "react";

export const icon_btn_style: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 4,
  cursor: "pointer",
  lineHeight: 0,
};

/* 공통 기본 타입 */
type BasicIconButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
};

/* ✏ 수정 아이콘 버튼 */
export const EditIconButton: React.FC<BasicIconButtonProps> = ({
  onClick,
  disabled,
}) => {
  return (
    <button
      type="button"
      style={icon_btn_style}
      onClick={onClick}
      disabled={disabled}
      title="수정"
      aria-label="수정"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M13.585 3.586a2 2 0 0 1 2.828 2.828l-8.486 8.486-3.414.586.586-3.414 8.486-8.486Z"
          stroke="#374151"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 5l3 3"
          stroke="#374151"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
};

/* ❌ 미사용(비활성화) 아이콘 버튼 */
type NotUsedIconButtonProps = BasicIconButtonProps & {
  is_loading?: boolean;
};

export const NotUsedIconButton: React.FC<NotUsedIconButtonProps> = ({
  onClick,
  disabled,
  is_loading,
}) => {
  const stroke_color = is_loading ? "#9ca3af" : "#ef4444";

  return (
    <button
      type="button"
      style={icon_btn_style}
      onClick={onClick}
      disabled={disabled || is_loading}
      title={is_loading ? "미사용 처리 중" : "미사용 등록"}
      aria-label={is_loading ? "미사용 처리 중" : "미사용"}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 7h8l-.7 9.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7Z"
          stroke={stroke_color}
          strokeWidth="1.5"
        />
        <path
          d="M4 7h12M8 7V4h4v3"
          stroke={stroke_color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
};

/* ✅ 사용(활성화) 아이콘 버튼 — 미사용 페이지에서 “사용 전환”용 */
type UsedIconButtonProps = BasicIconButtonProps & {
  is_loading?: boolean;
};

export const UsedIconButton: React.FC<UsedIconButtonProps> = ({
  onClick,
  disabled,
  is_loading,
}) => {
  const stroke_color = is_loading ? "#9ca3af" : "#16a34a";

  return (
    <button
      type="button"
      style={icon_btn_style}
      onClick={onClick}
      disabled={disabled || is_loading}
      title={is_loading ? "사용 전환 중" : "사용으로 전환"}
      aria-label={is_loading ? "사용 전환 중" : "사용으로 전환"}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 10.5 8.5 15 16 5"
          stroke={stroke_color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};
