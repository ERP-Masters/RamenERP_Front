// src/components/UnitEditUI.tsx
import React, { useEffect, useState } from "react";

export type UnitEditTarget = {
  unit_id: number;
  code: string;
  name: string;
};

type Props = {
  open: boolean;
  target: UnitEditTarget | null;
  onClose: () => void;
  onSubmit: (data: UnitEditTarget) => void | Promise<void>;
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  width: 420,
  maxWidth: "90vw",
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 16,
};

const headerStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 16,
  marginBottom: 10,
};

const rowStyle: React.CSSProperties = {
  marginBottom: 10,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const labelStyle: React.CSSProperties = { width: 70, textAlign: "right" };
const inputStyle: React.CSSProperties = { flex: 1, padding: "6px 8px" };

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 8,
};

const UnitEditUI: React.FC<Props> = ({ open, target, onClose, onSubmit }) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open || !target) return;
    setCode(target.code ?? "");
    setName(target.name ?? "");
  }, [open, target]);

  if (!open || !target) return null;

  const doSubmit = async () => {
    const trimmed = { unit_id: target.unit_id, code: code.trim(), name: name.trim() };
    if (!trimmed.code || !trimmed.name) {
      alert("단위 코드와 단위명을 모두 입력해주세요.");
      return;
    }
    await onSubmit(trimmed);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void doSubmit();
    }
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div style={modalStyle}>
        <div style={headerStyle}>단위 수정</div>

        <div style={rowStyle}>
          <span style={labelStyle}>Unit_ID</span>
          <input style={{ ...inputStyle, background: "#f3f4f6" }} value={target.unit_id} readOnly />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>code</span>
          <input
            style={inputStyle}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="예) KG"
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>name</span>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="예) 킬로그램"
          />
        </div>

        <div style={footerStyle}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "6px 10px", borderRadius: 6, background: "#e5e7eb" }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={doSubmit}
            style={{ padding: "6px 10px", borderRadius: 6, background: "#2563eb", color: "#fff" }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitEditUI;
