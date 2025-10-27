// src/pages/VendorOrderCreateModal.tsx
import React, { useEffect, useState } from "react";
import { create_vendor_orders } from "../api/vendor_orders";
import { type CreateVendorOrderLine } from "../types/vendor_order";
import {
  fetch_vendors,
  fetch_warehouses,
  fetch_items,
  type VendorOption,
  type WarehouseOption,
  type ItemOption,
} from "../api/master_data";

const overlay_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modal_style: React.CSSProperties = {
  width: "min(600px,90%)",
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
  padding: 20,
  maxHeight: "80vh",
  overflowY: "auto",
  fontSize: "clamp(12px,1.05vw,16px)",
};

const section_style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginBottom: 16,
};

const label_style: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "0.8em",
  color: "#6b7280",
  marginBottom: 4,
};

const input_style: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: "0.9em",
};

const row_style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr auto",
  gap: 8,
  alignItems: "center",
  marginBottom: 8,
  fontSize: "0.9em",
};

const small_btn_style: React.CSSProperties = {
  border: "1px solid #d1d5db",
  background: "#fff",
  borderRadius: 8,
  padding: "6px 8px",
  fontSize: "0.8em",
  cursor: "pointer",
};

interface Props {
  open: boolean;
  on_close: () => void;
  on_created: () => void;
}

// 신규 발주 등록 모달
function VendorOrderCreateModal({ open, on_close, on_created }: Props) {
  const [is_saving, set_is_saving] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  // 선택지
  const [vendors, set_vendors] = useState<VendorOption[]>([]);
  const [warehouses, set_warehouses] = useState<WarehouseOption[]>([]);
  const [items, set_items] = useState<ItemOption[]>([]);

  // 공통 선택값
  const [selected_vendor_id, set_selected_vendor_id] = useState<string>("");
  const [selected_wh_id, set_selected_wh_id] = useState<string>("");

  // 품목/수량 라인들
  const [lines, set_lines] = useState<
    Array<{ item_id: string; quantity: string }>
  >([{ item_id: "", quantity: "" }]);

  // 마스터 데이터 로드
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [vList, wList, iList] = await Promise.all([
          fetch_vendors(),
          fetch_warehouses(),
          fetch_items(),
        ]);
        set_vendors(
          vList.map((v) => ({
            id: v.id,
            name: v.name ?? `거래처#${v.id}`,
          })),
        );
        set_warehouses(
          wList.map((w) => ({
            id: w.id,
            name: w.name ?? `창고#${w.id}`,
          })),
        );
        set_items(
          iList.map((it) => ({
            id: it.id,
            name: it.name ?? `품목#${it.id}`,
          })),
        );
      } catch (err: any) {
        set_error_msg(err.message ?? "마스터 데이터 로드 실패");
      }
    })();
  }, [open]);

  function add_line() {
    set_lines((prev) => [...prev, { item_id: "", quantity: "" }]);
  }

  function remove_line(idx: number) {
    set_lines((prev) => prev.filter((_, i) => i !== idx));
  }

  function update_line(
    idx: number,
    key: "item_id" | "quantity",
    val: string,
  ) {
    set_lines((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [key]: val } : row)),
    );
  }

  async function handle_submit() {
    if (!selected_vendor_id || !selected_wh_id) {
      set_error_msg("거래처 / 창고를 선택하세요.");
      return;
    }

    // 빈 라인 제외
    const payload: CreateVendorOrderLine[] = lines
      .filter(
        (l) =>
          l.item_id.trim() !== "" &&
          l.quantity.trim() !== "" &&
          Number(l.quantity) > 0,
      )
      .map((l) => ({
        vendor_id: Number(selected_vendor_id),
        wh_id: Number(selected_wh_id),
        item_id: Number(l.item_id),
        quantity: Number(l.quantity),
        // status는 보내지 않음 -> 서버에서 PENDING 기본값
      }));

    if (!payload.length) {
      set_error_msg("발주 라인을 추가하세요.");
      return;
    }

    try {
      set_is_saving(true);
      set_error_msg("");

      await create_vendor_orders(payload); // 배열 통째로 전송

      // 초기화
      set_selected_vendor_id("");
      set_selected_wh_id("");
      set_lines([{ item_id: "", quantity: "" }]);

      on_created(); // 부모: 목록 리로드 + 모달 닫기
    } catch (err: any) {
      set_error_msg(err.message ?? "발주 등록 실패");
    } finally {
      set_is_saving(false);
    }
  }

  if (!open) return null;

  return (
    <div style={overlay_style}>
      <div style={modal_style}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "1rem",
            marginBottom: 12,
          }}
        >
          거래처 발주 작성
        </div>

        {/* 거래처 / 창고 공통 영역 */}
        <div style={section_style}>
          <div>
            <div style={label_style}>거래처</div>
            <select
              style={input_style}
              value={selected_vendor_id}
              onChange={(e) => set_selected_vendor_id(e.target.value)}
            >
              <option value="">선택</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={label_style}>창고</div>
            <select
              style={input_style}
              value={selected_wh_id}
              onChange={(e) => set_selected_wh_id(e.target.value)}
            >
              <option value="">선택</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 품목 라인들 */}
        <div
          style={{
            fontWeight: 600,
            fontSize: "0.8em",
            color: "#6b7280",
          }}
        >
          품목 / 수량
        </div>

        {lines.map((line, idx) => (
          <div key={idx} style={row_style}>
            <select
              style={input_style}
              value={line.item_id}
              onChange={(e) => update_line(idx, "item_id", e.target.value)}
            >
              <option value="">품목 선택</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>

            <input
              style={input_style}
              placeholder="수량"
              value={line.quantity}
              onChange={(e) => update_line(idx, "quantity", e.target.value)}
            />

            <button
              style={small_btn_style}
              onClick={() => remove_line(idx)}
              disabled={lines.length === 1}
            >
              삭제
            </button>
          </div>
        ))}

        <button
          style={{
            ...small_btn_style,
            marginBottom: 16,
            fontWeight: 600,
          }}
          onClick={add_line}
        >
          + 품목 추가
        </button>

        {error_msg && (
          <div
            style={{
              color: "red",
              fontSize: "0.8em",
              marginBottom: 8,
            }}
          >
            {error_msg}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <button
            style={small_btn_style}
            onClick={on_close}
            disabled={is_saving}
          >
            닫기
          </button>
          <button
            style={{
              ...small_btn_style,
              fontWeight: 600,
              borderColor: "#111827",
            }}
            onClick={handle_submit}
            disabled={is_saving}
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

export default VendorOrderCreateModal;
