// src/pages/VendorOrderCreateForm.tsx
import React from "react";
import ApiDefault, * as ApiNS from "@/api/vendor_orders";
import type { CreateVendorOrderPayload, OrderStatus, VendorOption, WarehouseOption, ItemOption } from "@/types/vendor_order";

const API: any = (ApiNS as any)?.create_vendor_order ? ApiNS : ApiDefault;

type Props = { on_success?: () => void; on_cancel?: () => void };

const VendorOrderCreateForm: React.FC<Props> = ({ on_success, on_cancel }) => {
  const [wh_id, set_wh_id] = React.useState<string>("");
  const [vendor_id, set_vendor_id] = React.useState<string>("");
  const [item_pk, set_item_pk] = React.useState<string>("");
  const [quantity, set_quantity] = React.useState<number>(1);
  const [status, set_status] = React.useState<OrderStatus>("PENDING");

  const [warehouses, set_warehouses] = React.useState<WarehouseOption[]>([]);
  const [vendors, set_vendors] = React.useState<VendorOption[]>([]);
  const [items, set_items] = React.useState<ItemOption[]>([]);
  const [saving, set_saving] = React.useState(false);
  const [error, set_error] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const [wh, vs, its] = await Promise.all([
          API.fetch_warehouses(),
          API.fetch_vendors(),
          API.fetch_items(),
        ]);
        set_warehouses(wh ?? []);
        set_vendors(vs ?? []);
        set_items(its ?? []);
      } catch (e: any) {
        set_error(e?.message || "옵션 로드 실패");
      }
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_error("");
    if (!wh_id || !vendor_id || !item_pk || !quantity || !status) {
      set_error("필수값을 모두 입력하세요.");
      return;
    }
    const payload: CreateVendorOrderPayload = {
      wh_id: Number(wh_id),
      vendor_id: Number(vendor_id),
      item_id: Number(item_pk),
      quantity: Number(quantity),
      status,
    };
    set_saving(true);
    try {
      await API.create_vendor_order(payload);
      on_success?.();
    } catch (err: any) {
      set_error(err?.message || "발주 저장 실패");
    } finally {
      set_saving(false);
    }
  };

  const field: React.CSSProperties = { display: "grid", gap: 6 };
  const input: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #e5e7eb", width: 320 };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <label style={field}>
        <span>창고 *</span>
        <select value={wh_id} onChange={(e) => set_wh_id(e.target.value)} style={input}>
          <option value="">선택</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </label>

      <label style={field}>
        <span>거래처 *</span>
        <select value={vendor_id} onChange={(e) => set_vendor_id(e.target.value)} style={input}>
          <option value="">선택</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>

      <label style={field}>
        <span>품목 *</span>
        <select value={item_pk} onChange={(e) => set_item_pk(e.target.value)} style={{ ...input, width: 420 }}>
          <option value="">선택</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.ext_item_id ? `${it.ext_item_id} — ` : ""}{it.name} (#{it.id})
            </option>
          ))}
        </select>
      </label>

      <label style={field}>
        <span>수량 *</span>
        <input type="number" min={1} value={quantity} onChange={(e) => set_quantity(Number(e.target.value))} style={{ ...input, width: 160 }} />
      </label>

      <label style={field}>
        <span>상태 *</span>
        <select value={status} onChange={(e) => set_status(e.target.value as OrderStatus)} style={{ ...input, width: 220 }}>
          <option value="PENDING">PENDING</option>
          <option value="INPROGRESS">INPROGRESS</option>
          <option value="SHIPPING">SHIPPING</option>
          <option value="PARTIALLY">PARTIALLY</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELED">CANCELED</option>
        </select>
      </label>

      {error && <div style={{ color: "#c62828" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="submit" disabled={saving} style={{ padding: "8px 12px" }}>
          {saving ? "저장 중..." : "저장"}
        </button>
        <button type="button" onClick={() => on_cancel?.()} style={{ padding: "8px 12px" }}>
          취소
        </button>
      </div>
    </form>
  );
};

export default VendorOrderCreateForm;
