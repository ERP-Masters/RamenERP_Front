// src/pages/VendorOrderCreateForm.tsx
import React from "react";

/* ===== 타입 ===== */
export type OrderStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELED"
  | (string & {});

export type CreateVendorOrderPayload = {
  vendor_order_id: string;
  vendor_id: number;
  item_id: string;   // 외부에서 쓰는 품목 ID(문자열)
  quantity: number;
  status: OrderStatus;
};

type VendorOption = { id: number; name: string };
type ItemOption = { id: number; name: string; item_id?: string };

/* ===== 유틸 ===== */
function build_headers(method: string, extra?: HeadersInit): Headers {
  const m = (method || "GET").toUpperCase();
  const h = new Headers();
  h.set("Accept", "application/json");
  if (m !== "GET" && m !== "HEAD") h.set("Content-Type", "application/json");
  if (extra) new Headers(extra).forEach((v, k) => { if (v != null) h.set(k, v); });
  return h;
}
async function http_json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: build_headers(init?.method || "GET", init?.headers) });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    try { const j = text ? JSON.parse(text) : null; throw new Error(j?.message || j?.error || text || `HTTP ${res.status}`); }
    catch { throw new Error(text || `HTTP ${res.status}`); }
  }
  if (!text) return undefined as unknown as T;
  try { return JSON.parse(text) as T; } catch { throw new Error("서버가 JSON이 아닌 응답을 반환했습니다."); }
}

/* ===== 옵션 로더 (후보 경로 자동 시도 + 응답 정규화) ===== */
async function load_vendors(): Promise<VendorOption[]> {
  const candidates = [
    "/api/vendors/options",
    "/api/vendors/summary",
    "/api/vendors",
    "/api/vendor",
    "/api/vendor/list",
  ];
  for (const url of candidates) {
    try {
      const data = await http_json<any>(url, { method: "GET" });
      const arr: any[] = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
      if (!Array.isArray(arr)) continue;

      const norm: VendorOption[] = arr
        .map((r) => ({
          id: Number(r.id ?? r.vendor_id ?? r.vendor_pk ?? 0),
          name: String(r.name ?? r.vendor_name ?? r.title ?? r.code ?? ""),
        }))
        .filter((v) => v.id && v.name);

      if (norm.length) return norm.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    } catch (_) {}
  }
  return [];
}

async function load_items(): Promise<ItemOption[]> {
  const candidates = [
    "/api/items/options",
    "/api/items",
    "/api/item",
    "/api/products",
    "/api/product",
  ];
  for (const url of candidates) {
    try {
      const data = await http_json<any>(url, { method: "GET" });
      const arr: any[] = Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
      if (!Array.isArray(arr)) continue;

      const norm: ItemOption[] = arr
        .map((r) => {
          const id = Number(r.id ?? r.item_pk ?? r.product_id ?? r.itemId ?? 0);
          const item_id = String(r.item_id ?? r.code ?? r.itemCode ?? r.sku ?? (id ? id : ""));
          const name = String(r.name ?? r.item_name ?? r.product_name ?? r.title ?? "");
          return { id, name, item_id };
        })
        .filter((x) => (x.item_id || x.id) && x.name);
      if (norm.length) return norm;
    } catch (_) {}
  }
  return [];
}

/* ===== 생성 API ===== */
const create_vendor_order = (payload: CreateVendorOrderPayload) =>
  http_json<unknown>("/api/vendorOrder", { method: "POST", body: JSON.stringify(payload) });

/* ===== 컴포넌트 ===== */
type Props = { on_success?: () => void; on_cancel?: () => void };

const VendorOrderCreateForm: React.FC<Props> = ({ on_success, on_cancel }) => {
  const [vendor_order_id, set_vendor_order_id] = React.useState("");
  const [vendor_id, set_vendor_id] = React.useState("");
  const [item_id, set_item_id] = React.useState("");
  const [quantity, set_quantity] = React.useState(1);
  const [status, set_status] = React.useState<OrderStatus>("SUBMITTED");

  const [vendors, set_vendors] = React.useState<VendorOption[]>([]);
  const [items, set_items] = React.useState<ItemOption[]>([]);
  const [loading_opts, set_loading_opts] = React.useState(false);
  const [saving, set_saving] = React.useState(false);
  const [error, set_error] = React.useState("");

  React.useEffect(() => {
    (async () => {
      set_loading_opts(true);
      try {
        const [v, it] = await Promise.all([load_vendors(), load_items()]);
        set_vendors(v);
        set_items(it);
      } catch (e: any) {
        set_error(e?.message || "옵션 로드 실패");
      } finally {
        set_loading_opts(false);
      }
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_error("");

    if (!vendor_order_id || !vendor_id || !item_id || !quantity || !status) {
      set_error("필수값을 모두 입력하세요.");
      return;
    }

    const payload: CreateVendorOrderPayload = {
      vendor_order_id,
      vendor_id: Number(vendor_id),
      item_id, // 문자열 그대로
      quantity: Number(quantity),
      status,
    };

    set_saving(true);
    try {
      await create_vendor_order(payload);
      on_success?.();
    } catch (err: any) {
      set_error(err?.message || "저장 실패");
    } finally {
      set_saving(false);
    }
  };

  const field_style: React.CSSProperties = { display: "grid", gap: 6 };
  const input_style: React.CSSProperties = { padding: 8, borderRadius: 8, border: "1px solid #e5e7eb", width: 280 };
  const select_style = input_style;
  const btn_row: React.CSSProperties = { display: "flex", gap: 8, marginTop: 10 };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <label style={field_style}>
        <span>발주 ID (vendor_order_id) *</span>
        <input value={vendor_order_id} onChange={(e) => set_vendor_order_id(e.target.value)} placeholder="예: VO-2025-0001" style={input_style} />
      </label>

      <label style={field_style}>
        <span>거래처 *</span>
        <select value={vendor_id} onChange={(e) => set_vendor_id(e.target.value)} style={select_style} disabled={loading_opts}>
          <option value="">선택</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>

      <label style={field_style}>
        <span>품목(item_id) *</span>
        <select value={item_id} onChange={(e) => set_item_id(e.target.value)} style={{ ...select_style, width: 360 }} disabled={loading_opts}>
          <option value="">선택</option>
          {items.map((it) => {
            const ext = it.item_id ?? String(it.id);
            return <option key={ext} value={ext}>{ext} — {it.name}</option>;
          })}
        </select>
      </label>

      <label style={field_style}>
        <span>수량 *</span>
        <input type="number" min={1} value={quantity} onChange={(e) => set_quantity(Number(e.target.value))} style={{ ...input_style, width: 160 }} />
      </label>

      <label style={field_style}>
        <span>상태(status) *</span>
        <select value={status} onChange={(e) => set_status(e.target.value as OrderStatus)} style={{ ...select_style, width: 240 }}>
          {/* 실제 OrderStatus와 일치 필요 */}
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="RECEIVED">RECEIVED</option>
          <option value="CANCELED">CANCELED</option>
        </select>
      </label>

      {error && <div style={{ color: "#c62828" }}>{error}</div>}

      <div style={btn_row}>
        <button type="submit" disabled={saving} style={{ padding: "8px 12px" }}>{saving ? "저장 중..." : "저장"}</button>
        <button type="button" onClick={() => on_cancel?.()} style={{ padding: "8px 12px" }}>취소</button>
      </div>
    </form>
  );
};

export default VendorOrderCreateForm;
