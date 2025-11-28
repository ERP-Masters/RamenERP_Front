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

/* ===== CategoryEditPage와 동일한 톤으로 UI만 정렬 ===== */
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
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
  boxShadow: "0 12px 32px rgba(0,0,0,.25)",
  padding: 16,
  boxSizing: "border-box",
};

const headerStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 16,
  marginBottom: 12,
};

/* 필드 한 세트(라벨 윗줄 + 컨트롤 아랫줄) */
const fieldWrap: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto auto",
  rowGap: 6,
  marginBottom: 12,
};
const labelBlock: React.CSSProperties = { fontWeight: 600, whiteSpace: "nowrap" };
const controlBlock: React.CSSProperties = { width: "100%", padding: "6px 8px", boxSizing: "border-box" };

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 6,
};
/* ===================================================== */

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

        {/* Unit_ID 표시는 숨김(오토 인크리먼트/읽기 전용) */}

        <div style={fieldWrap}>
          <label style={labelBlock}>code</label>
          <input
            style={controlBlock}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="예) KG"
          />
        </div>

        <div style={fieldWrap}>
          <label style={labelBlock}>name</label>
          <input
            style={controlBlock}
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
            style={{ padding: "6px 10px", borderRadius: 6, background: "#111827", color: "#fff" }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitEditUI;
