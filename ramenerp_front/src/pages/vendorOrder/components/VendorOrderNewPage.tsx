// src/pages/vendorOrder/components/VendorOrderNewPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetch_vendors,
  fetch_items,
  fetch_warehouses,
  prime_item_name_cache,
  prime_item_price_cache,
  type VendorOption,
  type ItemOption,
  type WarehouseOption,
} from "@/api/master_data";

import {
  create_vendor_orders,
  type CreateVendorOrderLine,
} from "@/api/vendor_orders";

/* ===================== UI ===================== */

const ui = {
  border: "#e5e7eb",
  muted: "#6b7280",
  danger: "#dc2626",
  primary_bg: "#0ea5e9",
  primary_tx: "#ffffff",
  surface: "#ffffff",
  radius: 10,
  zebra: "#fafafa",
} as const;

const page_wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  color: "#0f172a",
};

const card: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: ui.radius,
  background: ui.surface,
  padding: 16,
};

const row_grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px,1fr) minmax(180px,1fr) minmax(220px,1.2fr) minmax(140px,0.6fr) auto",
  gap: 12,
  alignItems: "end",
};

const label_style: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: ui.muted,
  marginBottom: 6,
  display: "block",
};

const select_style: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
};

const input_style: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${ui.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
};

const btn_primary: React.CSSProperties = {
  height: 40,
  borderRadius: 8,
  border: "none",
  background: ui.primary_bg,
  color: ui.primary_tx,
  padding: "0 16px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const btn_ghost: React.CSSProperties = {
  height: 36,
  borderRadius: 8,
  border: `1px solid ${ui.border}`,
  background: "#fff",
  padding: "0 12px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const table_wrap: React.CSSProperties = {
  border: `1px solid ${ui.border}`,
  borderRadius: ui.radius,
  overflow: "hidden",
  background: "#fff",
};

const table_style: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: 14,
};

const th_style: React.CSSProperties = {
  background: "#f8fafc",
  borderBottom: `1px solid ${ui.border}`,
  padding: "10px 8px",
  textAlign: "left",
  whiteSpace: "nowrap",
  fontSize: 12,
  fontWeight: 800,
};

const td_style: React.CSSProperties = {
  borderBottom: `1px solid ${ui.border}`,
  padding: "10px 8px",
  whiteSpace: "nowrap",
  fontSize: 13,
};

/* ===================== 유틸 ===================== */

function money(n: number) {
  return new Intl.NumberFormat("ko-KR").format(Number.isFinite(n) ? n : 0);
}

type DraftLine = CreateVendorOrderLine & {
  vendor_name?: string;
  item_name?: string;
  wh_name?: string;
  unit_price?: number;
};

/* ===================== 컴포넌트 ===================== */

const VendorOrderNewPage: React.FC = () => {
  const navigate = useNavigate();

  const [vendors, set_vendors] = useState<VendorOption[]>([]);
  const [items, set_items] = useState<ItemOption[]>([]);
  const [warehouses, set_warehouses] = useState<WarehouseOption[]>([]);

  const [vendor_id, set_vendor_id] = useState<string>("");
  const [wh_id, set_wh_id] = useState<string>("");
  const [item_id, set_item_id] = useState<string>("");
  const [quantity, set_quantity] = useState<string>("1");

  const [lines, set_lines] = useState<DraftLine[]>([]);
  const [loading, set_loading] = useState<boolean>(false);
  const [error_msg, set_error_msg] = useState<string>("");

  // 옵션 로드
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [v, i, w] = await Promise.all([
          fetch_vendors(),
          fetch_items(),
          fetch_warehouses(),
        ]);

        if (cancelled) return;

        set_vendors(v);
        set_items(i);
        set_warehouses(w);

        prime_item_name_cache(i);
        prime_item_price_cache(i);
      } catch {
        if (cancelled) return;
        set_error_msg("마스터 데이터 로딩 중 오류가 발생했습니다.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const vendor_name_by_id = useMemo(() => {
    const m = new Map<number, string>();
    vendors.forEach((v) => m.set(v.id, v.name));
    return m;
  }, [vendors]);

  const item_by_id = useMemo(() => {
    const m = new Map<number, ItemOption>();
    items.forEach((it) => m.set(it.id, it));
    return m;
  }, [items]);

  const wh_name_by_id = useMemo(() => {
    const m = new Map<number, string>();
    warehouses.forEach((w) => m.set(w.id, w.name));
    return m;
  }, [warehouses]);

  const on_add_line = () => {
    set_error_msg("");

    const v_id_num = Number(vendor_id);
    const w_id_num = Number(wh_id);
    const i_id_num = Number(item_id);
    const qty_num = Number(quantity);

    if (!Number.isFinite(v_id_num) || !Number.isFinite(w_id_num) || !Number.isFinite(i_id_num)) {
      set_error_msg("거래처/창고/품목을 모두 선택해 주세요.");
      return;
    }

    if (!Number.isFinite(qty_num) || qty_num <= 0) {
      set_error_msg("수량은 1 이상이어야 합니다.");
      return;
    }

    const item = item_by_id.get(i_id_num);
    const unit_price = item?.unit_price ?? 0;

    const new_line: DraftLine = {
      vendor_id: v_id_num,
      wh_id: w_id_num,
      item_id: i_id_num,
      quantity: qty_num,
      status: "PENDING",
      vendor_name: vendor_name_by_id.get(v_id_num) ?? "",
      item_name: item?.name ?? "",
      wh_name: wh_name_by_id.get(w_id_num) ?? "",
      unit_price,
    };

    set_lines((prev) => [...prev, new_line]);

    // 품목만 연속 입력하기 편하게 수량만 초기화
    set_quantity("1");
  };

  const on_remove_line = (idx: number) => {
    set_lines((prev) => prev.filter((_, i) => i !== idx));
  };

  const on_submit = async () => {
    set_error_msg("");

    if (lines.length === 0) {
      set_error_msg("등록할 발주 라인이 없습니다.");
      return;
    }

    const is_ok = window.confirm(`발주 ${lines.length}건을 등록할까요?`);
    if (!is_ok) return;

    set_loading(true);

    try {
      const payload: CreateVendorOrderLine[] = lines.map((l) => ({
        vendor_id: l.vendor_id,
        wh_id: l.wh_id,
        item_id: l.item_id,
        quantity: l.quantity,
        status: l.status ?? "PENDING",
      }));

      await create_vendor_orders(payload);

      alert("발주 등록이 완료되었습니다.");
      navigate("/vendor-order", { replace: true });
    } catch (e: any) {
      set_error_msg(e?.message || "발주 등록 중 오류가 발생했습니다.");
    } finally {
      set_loading(false);
    }
  };

  return (
    <div style={page_wrap}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
        신규 발주 등록
      </h1>

      {/* 입력 영역 */}
      <div style={card}>
        <div style={row_grid}>
          {/* 거래처 */}
          <div>
            <label style={label_style}>거래처</label>
            <select
              style={select_style}
              value={vendor_id}
              onChange={(e) => set_vendor_id(e.target.value)}
            >
              <option value="">선택</option>
              {vendors.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* 창고 */}
          <div>
            <label style={label_style}>창고</label>
            <select
              style={select_style}
              value={wh_id}
              onChange={(e) => set_wh_id(e.target.value)}
            >
              <option value="">선택</option>
              {warehouses.map((w) => (
                <option key={w.id} value={String(w.id)}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* 품목 */}
          <div>
            <label style={label_style}>품목</label>
            <select
              style={select_style}
              value={item_id}
              onChange={(e) => set_item_id(e.target.value)}
            >
              <option value="">선택</option>
              {items.map((it) => (
                <option key={it.id} value={String(it.id)}>
                  {it.name}
                </option>
              ))}
            </select>
          </div>

          {/* 수량 */}
          <div>
            <label style={label_style}>수량</label>
            <input
              style={input_style}
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => set_quantity(e.target.value)}
            />
          </div>

          {/* 추가 버튼 */}
          <div>
            <label style={{ ...label_style, color: "transparent" }}>추가</label>
            <button type="button" style={btn_primary} onClick={on_add_line}>
              라인 추가
            </button>
          </div>
        </div>

        {error_msg && (
          <div style={{ marginTop: 10, color: ui.danger, fontSize: 12, fontWeight: 700 }}>
            {error_msg}
          </div>
        )}
      </div>

      {/* 라인 목록 */}
      <div style={table_wrap}>
        <table style={table_style}>
          <thead>
            <tr>
              <th style={th_style}>거래처</th>
              <th style={th_style}>창고</th>
              <th style={th_style}>품목</th>
              <th style={th_style}>수량</th>
              <th style={th_style}>단가</th>
              <th style={th_style}>금액</th>
              <th style={th_style}>관리</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td style={{ ...td_style, textAlign: "center", color: ui.muted }} colSpan={7}>
                  추가된 라인이 없습니다.
                </td>
              </tr>
            ) : (
              lines.map((l, idx) => {
                const bg = idx % 2 === 1 ? { background: ui.zebra } : undefined;
                const unit_price = l.unit_price ?? 0;
                const amount = unit_price * (l.quantity ?? 0);

                return (
                  <tr key={`${l.vendor_id}_${l.item_id}_${idx}`} style={bg}>
                    <td style={td_style}>{l.vendor_name ?? ""}</td>
                    <td style={td_style}>{l.wh_name ?? ""}</td>
                    <td style={td_style}>{l.item_name ?? ""}</td>
                    <td style={td_style}>{money(l.quantity ?? 0)}</td>
                    <td style={td_style}>{money(unit_price)}</td>
                    <td style={td_style}>{money(amount)}</td>
                    <td style={td_style}>
                      <button
                        type="button"
                        style={btn_ghost}
                        onClick={() => on_remove_line(idx)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 하단 액션 */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          style={btn_ghost}
          onClick={() => navigate("/vendor-order")}
          disabled={loading}
        >
          목록으로
        </button>
        <button
          type="button"
          style={btn_primary}
          onClick={on_submit}
          disabled={loading}
        >
          {loading ? "등록 중..." : "발주 등록"}
        </button>
      </div>
    </div>
  );
};

export default VendorOrderNewPage;
