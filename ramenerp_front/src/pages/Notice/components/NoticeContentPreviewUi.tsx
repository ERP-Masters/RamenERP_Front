// src/pages/Notice/components/NoticeContentPreviewUi.tsx
import React from "react";
import type { NoticePreviewPosition } from "../function/NoticeContentPreviewFunction";

type Props = {
  open: boolean;
  content: string;
  position: NoticePreviewPosition;
};

const tooltip_base_style: React.CSSProperties = {
  position: "fixed",
  zIndex: 1500,
  maxWidth: 360,
  padding: "8px 10px",
  borderRadius: 10,
  // 🔹 배경을 흰색, 글씨를 까만색 계열로 변경
  background: "#ffffff",
  color: "#111827",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 25px rgba(15,23,42,0.18)",
  fontSize: 12,
  lineHeight: 1.4,
  pointerEvents: "none",
  whiteSpace: "pre-wrap",
};

const NoticeContentPreviewUi: React.FC<Props> = ({
  open,
  content,
  position,
}) => {
  if (!open || !content.trim()) return null;

  const style: React.CSSProperties = {
    ...tooltip_base_style,
    left: position.x,
    top: position.y,
    // 마우스 위쪽에 살짝 뜨도록
    transform: "translate(-50%, calc(-100% - 10px))",
  };

  return <div style={style}>{content}</div>;
};

export default NoticeContentPreviewUi;
