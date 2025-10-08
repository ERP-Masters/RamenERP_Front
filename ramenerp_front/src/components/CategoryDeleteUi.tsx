// src/components/CategoryDeleteUI.tsx
import React, { useEffect, useState } from "react";

type Target = { category_id: number; category_name: string };

type Props = {
  open: boolean;
  target: Target | null;
  onClose: () => void;
  onConfirm: () => void; // 이름 확인 통과 시 호출(실제 삭제는 서비스에서)
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal: React.CSSProperties = {
  width: 420,
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 16,
  boxSizing: "border-box",
};

const CategoryDeleteUI: React.FC<Props> = ({ open, target, onClose, onConfirm }) => {
  const [typing, set_typing] = useState("");

  useEffect(() => { if (open) set_typing(""); }, [open]);

  if (!open || !target) return null;

  const need = (target.category_name || "").trim();
  const can = typing.trim() === need;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px 0", color: "#b91c1c" }}>카테고리 삭제</h3>
        <p>정말로 <b>{need}</b> 카테고리를 삭제하시겠습니까?</p>
        <p style={{ fontSize: 12, color: "#6b7280" }}>
          계속하려면 아래 입력란에 <b>{need}</b> 를 정확히 입력하세요.
        </p>
        <input
          type="text"
          value={typing}
          onChange={(e) => set_typing(e.target.value)}
          placeholder={need}
          style={{ width: "100%", marginTop: 6, marginBottom: 12 }}
        />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose}>취소</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!can}
            style={{
              background: can ? "#ef4444" : "#fca5a5",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: 6,
              cursor: can ? "pointer" : "not-allowed",
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDeleteUI;
