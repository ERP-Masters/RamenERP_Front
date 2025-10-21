import React, { useEffect, useMemo, useState } from "react";
import {
  fetch_vendors,
  fetch_warehouses,
  fetch_items,
  create_vendor_order,
} from "@/api/vendor_orders";
import {
  VendorOption,
  WarehouseOption,
  ItemOption,
  VendorOrderItemInput,
  CreateVendorOrderPayload,
} from "@/types/vendor_order";
import VendorOrderItemRow from "./VendorOrderItemRow";

type Props = {
  open: boolean;
  on_close: () => void;
  on_created: () => void;
};

const overlay_style: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
};
const modal_style: React.CSSProperties = {
  width: 760, maxWidth: "95vw", background: "#fff", borderRadius: 16,
  boxShadow: "0 12px 32px rgba(0,0,0,0.15)", padding: 20,
};
const header_style: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
};
const row_style: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 };
const label_style: React.CSSProperties = { fontSize: 13, color: "#555", marginBottom: 6 };
const input_style: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10 };
const table_shell_style: React.CSSProperties = { border: "1px solid #eee", borderRadius: 12, padding: 12, marginTop: 8, background: "#fafafa" };
const footer_style: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 };
const button_style: React.CSSProperties = { padding: "10px 14px", border: "1px solid #ddd", borderRadius: 10, background: "#fff", cursor: "pointer" };
const primary_button_style: React.CSSProperties = { ...button_style, background: "#111", color: "#fff", border: "1px solid #111" };
const error_style: React.CSSProperties = { color: "#d00", fontSize: 13, marginTop: 6 };

const VendorOrderCreateModal: React.FC<Props> = ({ open, on_close, on_created }) => {
  const [vendor_options, set_vendor_options] = useState<VendorOption[]>([]);
  const [warehouse_options, set_warehouse_options] = useState<WarehouseOption[]>([]);
  const [item_options, set_item_options] = useState<ItemOption[]>([]);

  const [vendor_id, set_vendor_id] = useState<number | "">("");
  const [warehouse_id, set_warehouse_id] = useState<number | "">("");
  const [expected_date, set_expected_date] = useState<string>("");
  const [note, set_note] = useState<string>("");

  const [items, set_items] = useState<VendorOrderItemInput[]>([]);
  const [is_submitting, set_is_submitting] = useState<boolean>(false);
  const [error_message, set_error_message] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    let is_mounted = true;
    (async () => {
      try {
        const [vs, ws] = await Promise.all([fetch_vendors(), fetch_warehouses()]);
        if (!is_mounted) return;
        set_vendor_options(vs);
        set_warehouse_options(ws);
      } catch (e: unknown) {
        set_error_message((e as Error).message || "옵션 로드 실패");
      }
    })();
    return () => {
      is_mounted = false;
      set_items([]);
      set_error_message("");
      set_is_submitting(false);
    };
  }, [open]);

  const is_valid_form = useMemo(() => {
    if (!vendor_id || !warehouse_id) return false;
    if (items.length === 0) return false;
    return items.every((r) => r.item_id > 0 && r.unit_id > 0 && r.qty_ordered > 0 && r.unit_price >= 0);
  }, [vendor_id, warehouse_id, items]);

  const add_empty_row = () => {
    set_items((prev) => [...prev, { item_id: 0, unit_id: 0, qty_ordered: 1, unit_price: 0 }]);
  };
  const update_row = (idx: number, patch: Partial<VendorOrderItemInput>) => {
    set_items((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const remove_row = (idx: number) => set_items((prev) => prev.filter((_, i) => i !== idx));

  const handle_submit = async () => {
    if (!is_valid_form) return;
    set_is_submitting(true);
    set_error_message("");
    try {
      const payload: CreateVendorOrderPayload = {
        vendor_id: Number(vendor_id),
        warehouse_id: Number(warehouse_id),
        expected_date: expected_date || undefined,
        note: note || undefined,
        items,
      };
      await create_vendor_order(payload);
      on_created();
      on_close();
    } catch (e: unknown) {
      set_error_message((e as Error).message || "생성 실패");
    } finally {
      set_is_submitting(false);
    }
  };

  const search_items = async (q: string) => {
    try {
      const list = await fetch_items(q);
      set_item_options(list);
      return list;
    } catch (e: unknown) {
      set_error_message((e as Error).message || "아이템 검색 실패");
      return [];
    }
  };

  if (!open) return null;

  return (
    <div style={overlay_style} onClick={on_close}>
      <div style={modal_style} onClick={(e) => e.stopPropagation()}>
        <div style={header_style}>
          <h3 style={{ margin: 0 }}>새 VendorOrder 작성</h3>
          <button style={button_style} onClick={on_close}>닫기</button>
        </div>

        <div style={row_style}>
          <div>
            <div style={label_style}>거래처</div>
            <select
              style={input_style}
              value={vendor_id}
              onChange={(e) => set_vendor_id(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">선택</option>
              {vendor_options.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <div>
            <div style={label_style}>창고</div>
            <select
              style={input_style}
              value={warehouse_id}
              onChange={(e) => set_warehouse_id(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">선택</option>
              {warehouse_options.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div>
            <div style={label_style}>입고 예정일</div>
            <input type="date" style={input_style} value={expected_date} onChange={(e) => set_expected_date(e.target.value)} />
          </div>

          <div>
            <div style={label_style}>비고</div>
            <input placeholder="메모" style={input_style} value={note} onChange={(e) => set_note(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>발주 품목</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="품목 검색"
                style={input_style}
                onChange={(e) => { void search_items(e.target.value); }}
              />
              <button style={button_style} onClick={add_empty_row}>행 추가</button>
            </div>
          </div>

          <div style={table_shell_style}>
            {items.length === 0 ? (
              <div style={{ color: "#777", fontSize: 14 }}>품목 행을 추가하세요.</div>
            ) : (
              items.map((row, idx) => (
                <VendorOrderItemRow
                  key={idx}
                  index={idx}
                  row={row}
                  item_options={item_options}
                  on_change={(patch) => update_row(idx, patch)}
                  on_remove={() => remove_row(idx)}
                />
              ))
            )}
          </div>
        </div>

        {error_message && <div style={error_style}>{error_message}</div>}

        <div style={footer_style}>
          <button style={button_style} onClick={on_close}>취소</button>
          <button style={primary_button_style} onClick={handle_submit} disabled={!is_valid_form || is_submitting}>
            {is_submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorOrderCreateModal;
