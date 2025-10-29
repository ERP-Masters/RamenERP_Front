// src/pages/VendorOrderCreateForm.tsx
/*import React from "react";
import { create_vendor_order } from "@/api/vendor_orders";
import type {
  CreateVendorOrderPayload,
  OrderStatus,
  VendorOption,
  WarehouseOption,
  ItemOption,
} from "@/types/vendor_order";

/// ===== helpers ===== 
function build_headers(method = "GET"): Headers {
  const h = new Headers();
  h.set("Accept", "application/json");
  if (method !== "GET" && method !== "HEAD") h.set("Content-Type", "application/json");
  return h;
}
async function parse_json_or_throw(res: Response) {
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || res.statusText);
  return text ? JSON.parse(text) : null;
}
async function fetch_warehouses(): Promise<WarehouseOption[]> {
  const res = await fetch(`/api/warehouses`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);
  return (Array.isArray(data) ? data : [])
    .map((w: any) => {
      const id = Number(w.id ?? w.wh_id);
      const name = String(w.name ?? w.warehouse_name ?? "");
      return Number.isFinite(id) && name ? ({ id, name } as WarehouseOption) : null;
    })
    .filter(Boolean) as WarehouseOption[];
}
async function fetch_vendors(): Promise<VendorOption[]> {
  const res = await fetch(`/api/vendors`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);
  return (Array.isArray(data) ? data : [])
    .map((v: any) => {
      const id = Number(v.id);
      const name = String(v.name ?? v.vendor_name ?? "");
      const code = v.vendor_id ? String(v.vendor_id) : undefined;
      return Number.isFinite(id) && name ? ({ id, name, code } as VendorOption & { code?: string }) : null;
    })
    .filter(Boolean) as VendorOption[];
}
async function fetch_items(): Promise<ItemOption[]> {
  const res = await fetch(`/api/items`, { headers: build_headers("GET") });
  const data = await parse_json_or_throw(res);
  return (Array.isArray(data) ? data : [])
    .map((it: any) => {
      const id = Number(it.id);
      const name = it.name ? String(it.name) : undefined;
      const ext_item_id = it.item_id ? String(it.item_id) : undefined;
      return Number.isFinite(id) ? ({ id, name, ext_item_id } as ItemOption & { ext_item_id?: string }) : null;
    })
    .filter(Boolean) as ItemOption[];
}
//// =================== 

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
        const [wh, vs, its] = await Promise.all([fetch_warehouses(), fetch_vendors(), fetch_items()]);
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
    if (!Number.isFinite(quantity) || quantity <= 0) {
      set_error("수량은 1 이상이어야 합니다.");
      return;
    }

    const payload: CreateVendorOrderPayload = {
      wh_id: Number(wh_id),
      vendor_id: Number(vendor_id),
      item_id: String(item_pk),   // ✅ 문자열 ("7")
      quantity: Number(quantity),
      status,
    };
    await create_vendor_order(payload);

    set_saving(true);
    try {
      await create_vendor_order(payload);
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
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name} (#{w.id})</option>)}
        </select>
      </label>

      <label style={field}>
        <span>거래처 *</span>
        <select value={vendor_id} onChange={(e) => set_vendor_id(e.target.value)} style={input}>
          <option value="">선택</option>
          {vendors.map((v: any) => (
            <option key={v.id} value={v.id}>{v.name}{v.code ? ` (${v.code})` : ""}</option>
          ))}
        </select>
      </label>

      <label style={field}>
        <span>품목 *</span>
        <select value={item_pk} onChange={(e) => set_item_pk(e.target.value)} style={{ ...input, width: 420 }}>
          <option value="">선택</option>
          {items.map((it: any) => (
            <option key={it.id} value={it.id}>
              {it.ext_item_id ? `${it.ext_item_id} — ` : ""}{it.name ?? `#${it.id}`} (#{it.id})
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

export default VendorOrderCreateForm;*/
