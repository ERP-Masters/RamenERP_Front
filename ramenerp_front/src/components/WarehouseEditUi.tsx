import React, { useEffect, useState } from "react";
import type { WarehouseEditTarget } from "../pages/WarehouseEditFunction";

type Props = {
  open: boolean;
  target: WarehouseEditTarget | null;
  onClose: () => void;
  onSubmit: (data: WarehouseEditTarget) => Promise<void> | void;
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
  borderRadius: 10,
  boxShadow: "0 12px 32px rgba(0,0,0,.25)",
  padding: 16,
  boxSizing: "border-box",
};

const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 };

const label: React.CSSProperties = { width: 84, whiteSpace: "nowrap", fontWeight: 600 };
const input: React.CSSProperties = { flex: 1, padding: "6px 8px", boxSizing: "border-box" };

const WarehouseEditUi: React.FC<Props> = ({ open, target, onClose, onSubmit }) => {
  const [name, set_name] = useState("");
  const [location, set_location] = useState("");

  useEffect(() => {
    if (open && target) {
      set_name(target.name || "");
      set_location(target.location || "");
    }
  }, [open, target]);

  if (!open || !target) return null;

  const handle_ok = async () => {
    const payload: WarehouseEditTarget = {
      warehouse_id: target.warehouse_id,
      name: name.trim(),
      location: location.trim(),
    };
    await onSubmit(payload);
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 12px 0" }}>창고 수정</h3>

        <div style={row}>
          <span style={label}>name</span>
          <input style={input} value={name} onChange={(e) => set_name(e.target.value)} />
        </div>

        <div style={row}>
          <span style={label}>location</span>
          <input style={input} value={location} onChange={(e) => set_location(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
          <button type="button" onClick={onClose}>취소</button>
          <button
            type="button"
            onClick={handle_ok}
            style={{ background: "#111827", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6 }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarehouseEditUi;
