// src/components/BranchNotUsedUi.tsx
import React, { useEffect, useState } from "react";

type Target = { branch_id: number; name: string };

type Props = {
  open: boolean;
  target: Target | null;
  onClose: () => void;
  onConfirm: () => void; // 이름 일치 시에만 활성화
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
  width: 420,                 // 고정 폭
  maxWidth: "94vw",           // 작은 화면 대응
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 16,
  boxSizing: "border-box",    // 패딩 포함하여 넘침 방지
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#b91c1c",
  fontWeight: 800,
  fontSize: 18,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
};

const inputStyle: React.CSSProperties = {
  width: "100%",              // 컨테이너 가득
  boxSizing: "border-box",    // 패딩/보더 포함
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  outline: "none",
};

const actionsRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
  marginTop: 2,
};

const BranchNotUsedUi: React.FC<Props> = ({ open, target, onClose, onConfirm }) => {
  const [typing, set_typing] = useState("");

  useEffect(() => {
    if (open) set_typing("");
  }, [open]);

  if (!open || !target) return null;

  const need = (target.name || "").trim();
  const can = typing.trim() === need;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>직영점 미사용 등록</h3>

        <div>
          정말로 <b>{need}</b> 직영점을 미사용으로 등록하시겠습니까?
        </div>

        <div style={subtitleStyle}>
          계속하려면 아래 입력란에 <b>{need}</b> 을(를) 정확히 입력하세요.
        </div>

        <input
          type="text"
          value={typing}
          onChange={(e) => set_typing(e.target.value)}
          placeholder={need}
          style={inputStyle}
        />

        <div style={actionsRow}>
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
            미사용
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchNotUsedUi;
