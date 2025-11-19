// src/components/WarehouseDetailInfo.tsx
// 창고 상세 조회 "작은 화면" 모달 UI 코드

import React, { useEffect, useState } from "react";
import {
  fetchWarehouseDetailById,
  type WarehouseDetailItem,
} from "../pages/WarehouseDetailInfoFunction";

const ui_tok = {
  border: "#e5e7eb",
  surface: "#ffffff",
  header_bg: "#f8fafc",
  text: "#111827",
  label: "#6b7280",
  danger: "#ef4444",
  radius: 12,
} as const;

const overlay_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 3000,
};

const modal_style: React.CSSProperties = {
  width: "min(880px, 94vw)",
  background: ui_tok.surface,
  borderRadius: ui_tok.radius,
  border: `1px solid ${ui_tok.border}`,
  boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  maxHeight: "80vh",
};

const head_style: React.CSSProperties = {
  padding: "10px 14px",
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  fontWeight: 800,
};

const body_style: React.CSSProperties = {
  padding: 10,
  overflow: "auto",
};

const table_style = {
  width: "100%",
  borderCollapse: "separate" as const,
  borderSpacing: 0,
};

const th_style: React.CSSProperties = {
  padding: "10px 8px",
  textAlign: "left",
  background: ui_tok.header_bg,
  borderBottom: `1px solid ${ui_tok.border}`,
  fontSize: 13,
  fontWeight: 700,
  position: "sticky",
  top: 0,
  zIndex: 1,
  whiteSpace: "nowrap",
};

const td_style: React.CSSProperties = {
  borderBottom: `1px solid ${ui_tok.border}`,
  padding: "10px 8px",
  textAlign: "left",
  whiteSpace: "nowrap",
  fontSize: 13,
};

const foot_style: React.CSSProperties = {
  padding: "10px 14px",
  borderTop: `1px solid ${ui_tok.border}`,
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const btn_style: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 999,
  border: `1px solid ${ui_tok.border}`,
  background: "#fff",
  cursor: "pointer",
  fontSize: 12,
};

function fmt_date(iso?: string | null) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${da} ${hh}:${mm}`;
  } catch {
    return String(iso);
  }
}

export type WarehouseDetailInfoProps = {
  is_open: boolean;
  /** 내부 DB 숫자형 창고 ID (필수) */
  warehouse_id: number | null;
  onClose: () => void;
};

const WarehouseDetailInfo: React.FC<WarehouseDetailInfoProps> = ({
  is_open,
  warehouse_id,
  onClose,
}) => {
  const [rows, set_rows] = useState<WarehouseDetailItem[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  useEffect(() => {
    if (!is_open || warehouse_id == null) return;
    set_is_loading(true);
    set_error_msg("");
    (async () => {
      try {
        const list = await fetchWarehouseDetailById(warehouse_id);
        set_rows(list);
      } catch (e: any) {
        set_rows([]);
        set_error_msg(e?.message || "상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        set_is_loading(false);
      }
    })();
  }, [is_open, warehouse_id]);

  if (!is_open) return null;

  return (
    <div style={overlay_style} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal_style}>
        <div style={head_style}>
          <div>창고 상세 보기</div>
          <button type="button" onClick={onClose} style={btn_style}>
            닫기
          </button>
        </div>

        <div style={body_style}>
          {is_loading && <div style={{ color: ui_tok.label }}>불러오는 중…</div>}
          {error_msg && <div style={{ color: "#b91c1c" }}>{error_msg}</div>}

          {!is_loading && !error_msg && (
            <table style={table_style}>
              <thead>
                <tr>
                  <th style={th_style}>재고 코드</th>
                  <th style={th_style}>창고</th>
                  <th style={th_style}>품목</th>
                  <th style={th_style}>LOT 코드</th>
                  <th style={th_style}>수량</th>
                  <th style={th_style}>안전 재고</th>
                  <th style={th_style}>입고 일시</th>
                  <th style={th_style}>만료 일시</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={td_style}>{r.inventory_id}</td>
                    <td style={td_style}>{r.warehouse_id}</td>
                    <td style={td_style}>{r.item_id}</td>
                    <td style={td_style}>{r.lot_id}</td>
                    <td style={td_style}>{r.quantity}</td>
                    <td style={td_style}>{r.safety_stock}</td>
                    <td style={td_style}>{fmt_date(r.store_date)}</td>
                    <td style={td_style}>{fmt_date(r.expiry_date)}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={8} style={{ ...td_style, color: ui_tok.label, textAlign: "center" }}>
                      표시할 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div style={foot_style}>
          <button type="button" onClick={onClose} style={btn_style}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDetailInfo;
