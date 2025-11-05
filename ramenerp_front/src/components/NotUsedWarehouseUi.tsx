// src/components/WarehouseNotUsedUi.tsx
import React from "react";
import { markWarehouseNotUsed } from "../pages/WarehouseNotUsedFunction";

type WarehouseNotUsedTarget = { warehouse_id: number; name: string };

type Props = {
  open: boolean;
  target: WarehouseNotUsedTarget | null;
  onClose: () => void;
  /** 옵션: 성공 후 리스트 새로고침 등에서 사용 */
  onDone?: () => void;
};

const overlay_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal_style: React.CSSProperties = {
  width: 420,
  maxWidth: "90vw",
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 16,
  boxSizing: "border-box",
};

const row_style: React.CSSProperties = { marginBottom: 10 };
const input_style: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  boxSizing: "border-box",
};

const WarehouseNotUsedUi: React.FC<Props> = ({ open, target, onClose, onDone }) => {
  const [typing, set_typing] = React.useState("");
  const [submitting, set_submitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      set_typing("");
      set_submitting(false);
    }
  }, [open]);

  if (!open || !target) return null;

  const need = (target.name || "").trim();
  const can = typing.trim() === need && !submitting;

  const handleConfirm = async () => {
    if (!can) return;
    try {
      set_submitting(true);
      await markWarehouseNotUsed(target.warehouse_id); // ✅ 미사용 등록 기능 호출
      alert("창고가 미사용으로 등록되었습니다.");
      onDone?.();
      onClose();
    } catch (e: any) {
      alert(e?.message || "창고 미사용 등록에 실패했습니다.");
    } finally {
      set_submitting(false);
    }
  };

  return (
    <div style={overlay_style} onClick={onClose}>
      <div style={modal_style} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px 0", color: "#b91c1c" }}>창고 미사용 등록</h3>
        <div style={row_style}>
          정말로 <b>{need}</b> 창고를 미사용으로 등록하시겠습니까?
        </div>
        <div style={{ ...row_style, fontSize: 12, color: "#6b7280" }}>
          계속하려면 아래 입력란에 <b>{need}</b> 을(를) 정확히 입력하세요.
        </div>
        <input
          type="text"
          value={typing}
          onChange={(e) => set_typing(e.target.value)}
          placeholder={need}
          style={input_style}
        />
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 12,
          }}
        >
          <button type="button" onClick={onClose} disabled={submitting}>
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!can}
            style={{
              background: can ? "#ef4444" : "#fca5a5",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              cursor: can ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "처리 중…" : "미사용"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarehouseNotUsedUi;
