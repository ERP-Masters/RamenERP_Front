// src/components/WarehouseDeleteUi.tsx
import React, { useEffect, useState } from "react";

type Target = { warehouse_id: number; name: string };

type Props = {
  open: boolean;
  target: Target | null;
  onClose: () => void;
  onConfirm: () => void; // 버튼 활성화(이름 일치) 후 실행
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
  width: 380,
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 16,
  boxSizing: "border-box",
};

const row: React.CSSProperties = { marginBottom: 10 };

const WarehouseDeleteUi: React.FC<Props> = ({ open, target, onClose, onConfirm }) => {
  const [typing, set_typing] = useState("");
  useEffect(() => { if (open) set_typing(""); }, [open]);

  if (!open || !target) return null;
  const need = (target.name || "").trim();
  const can = typing.trim() === need;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px 0", color: "#b91c1c" }}>창고 삭제</h3>
        <div style={row}>정말로 <b>{need}</b> 창고를 삭제하시겠습니까?</div>
        <div style={{ ...row, fontSize: 12, color: "#6b7280" }}>
          계속하려면 아래 입력란에 <b>{need}</b> 을 정확히 입력하세요.
        </div>
        <input
          type="text"
          value={typing}
          onChange={(e) => set_typing(e.target.value)}
          placeholder={need}
          style={{ width: "100%", marginBottom: 10 }}
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

export default WarehouseDeleteUi;
