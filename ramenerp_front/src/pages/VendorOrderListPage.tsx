// src/pages/VendorOrderListPage.tsx
import React from "react";
import VendorOrderCreateForm from "@/pages/VendorOrderCreateForm";

/* ===== 타입 ===== */
type OrderStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELED"
  | (string & {});

type VendorOrderRow = {
  id?: number;
  vendor_order_id: string;
  vendor_id: number;
  item_id: string;
  quantity: number;
  status: OrderStatus;
  created_at?: string;
};

type VendorOption = { id: number; name: string };

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
const fmt_date = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};

/* ===== 스타일 ===== */
const ui = {
  border: "#e5e7eb",
  zebra: "#fafafa",
  head_bg: "#f8fafc",
  radius: 10,
  muted: "#6b7280",
  primary_bg: "#0ea5e9",
  primary_bd: "#0284c7",
  primary_tx: "#fff",
} as const;

const page_style: React.CSSProperties = { padding: 16, maxWidth: 1200, margin: "0 auto" };
const title_style: React.CSSProperties = { fontSize: 22, fontWeight: 800, marginBottom: 8 };
const bar: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" as const };
const select_style: React.CSSProperties = { padding: 8, minWidth: 160, borderRadius: 8, border: `1px solid ${ui.border}` };
const input_style: React.CSSProperties = { padding: 8, width: 180, borderRadius: 8, border: `1px solid ${ui.border}` };
const ghost_btn: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: `1px solid ${ui.border}`, background: "#fff", cursor: "pointer" };
const primary_btn: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: `1px solid ${ui.primary_bd}`, background: ui.primary_bg, color: ui.primary_tx, cursor: "pointer" };
const table_wrap: React.CSSProperties = { overflowX: "auto", border: `1px solid ${ui.border}`, borderRadius: ui.radius };
const table_style: React.CSSProperties = { width: "100%", borderCollapse: "separate", borderSpacing: 0 };
const th_style: React.CSSProperties = { position: "sticky", top: 0, background: ui.head_bg, borderBottom: `1px solid ${ui.border}`, padding: "10px 8px", textAlign: "left", whiteSpace: "nowrap", fontSize: 13, fontWeight: 700 };
const td_style: React.CSSProperties = { borderBottom: `1px solid ${ui.border}`, padding: "9px 8px", textAlign: "left", whiteSpace: "nowrap", fontSize: 14 };
const td_right: React.CSSProperties = { ...td_style, textAlign: "right" as const };
const overlay_style: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 };
const modal_style: React.CSSProperties = { width: "min(720px, 94vw)", maxHeight: "90vh", overflowY: "auto", background: "#fff", border: `1px solid ${ui.border}`, borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", padding: 16 };

/* ===== 페이지 ===== */
const VendorOrderListPage: React.FC = () => {
  const [rows, set_rows] = React.useState<VendorOrderRow[]>([]);
  const [vendors, set_vendors] = React.useState<VendorOption[]>([]);
  const [is_loading, set_is_loading] = React.useState(false);
  const [error, set_error] = React.useState("");

  // 필터
  const [status_filter, set_status_filter] = React.useState<OrderStatus | "">("");
  const [vendor_filter, set_vendor_filter] = React.useState<string>("");
  const [item_query, set_item_query] = React.useState<string>("");

  // 신규 등록 모달
  const [is_create_open, set_is_create_open] = React.useState(false);

  const vendor_name_by_id = React.useMemo(() => {
    const m = new Map<number, string>();
    for (const v of vendors) m.set(v.id, v.name);
    return m;
  }, [vendors]);

  const load_options = React.useCallback(async () => {
    try {
      const v = await http_json<VendorOption[]>("/api/vendors/options", { method: "GET" });
      set_vendors(Array.isArray(v) ? v : []);
    } catch (e: any) {
      console.warn("vendors load failed:", e?.message);
    }
  }, []);

  const load_list = React.useCallback(async () => {
    set_is_loading(true);
    set_error("");
    try {
      const q = new URLSearchParams();
      if (status_filter) q.set("status", String(status_filter));
      if (vendor_filter) q.set("vendor_id", vendor_filter);
      if (item_query) q.set("item_id", item_query.trim());

      const url = `/api/vendorOrder${q.toString() ? `?${q.toString()}` : ""}`;
      const res = await http_json<any>(url, { method: "GET" });

      const list: any[] = Array.isArray(res) ? res : (res?.items ?? []);
      const normalized: VendorOrderRow[] = list.map((r) => ({
        id: r.id ?? r.vendor_order_pk ?? undefined,
        vendor_order_id: String(r.vendor_order_id ?? r.code ?? r.order_code ?? ""),
        vendor_id: Number(r.vendor_id ?? r.vendor?.id ?? r.vendor_pk ?? 0),
        item_id: String(r.item_id ?? r.item?.item_id ?? r.item_code ?? ""),
        quantity: Number(r.quantity ?? r.qty ?? 0),
        status: String(r.status ?? "SUBMITTED") as OrderStatus,
        created_at: r.created_at ?? r.createdAt ?? r.created_date ?? undefined,
      }));

      set_rows(normalized);
    } catch (e: any) {
      set_error(e?.message || "목록 조회 실패");
    } finally {
      set_is_loading(false);
    }
  }, [status_filter, vendor_filter, item_query]);

  React.useEffect(() => { void load_options(); }, [load_options]);
  React.useEffect(() => { void load_list(); }, [load_list]);

  const filtered_rows = React.useMemo(() => {
    return rows.filter((r) => {
      const ok_status = !status_filter || r.status === status_filter;
      const ok_vendor = !vendor_filter || String(r.vendor_id) === vendor_filter;
      const ok_item = !item_query || r.item_id.toLowerCase().includes(item_query.toLowerCase());
      return ok_status && ok_vendor && ok_item;
    });
  }, [rows, status_filter, vendor_filter, item_query]);

  return (
    <div style={page_style}>
      <h1 style={title_style}>발주 내역</h1>

      {/* 컨트롤 바 */}
      <div style={bar}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ui.muted }}>상태</span>
          <select value={status_filter} onChange={(e) => set_status_filter(e.target.value as OrderStatus | "")} style={select_style}>
            <option value="">전체</option>
            <option value="PENDING">PENDING</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ui.muted }}>거래처</span>
          <select value={vendor_filter} onChange={(e) => set_vendor_filter(e.target.value)} style={select_style}>
            <option value="">전체</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ui.muted }}>품목ID</span>
          <input value={item_query} onChange={(e) => set_item_query(e.target.value)} placeholder="예: ITEM_001" style={input_style} />
        </label>

        <button onClick={() => void load_list()} style={ghost_btn}>새로고침</button>

        <div style={{ marginLeft: "auto" }} />
        <button onClick={() => set_is_create_open(true)} style={primary_btn}>신규 발주 등록</button>
      </div>

      {is_loading && <div style={{ color: ui.muted, marginBottom: 8 }}>불러오는 중…</div>}
      {error && <div style={{ color: "#c62828", marginBottom: 8 }}>{error}</div>}

      <div style={table_wrap}>
        <table style={table_style}>
          <thead>
            <tr>
              <th style={th_style}>발주ID</th>
              <th style={th_style}>거래처</th>
              <th style={th_style}>품목ID</th>
              <th style={th_style}>수량</th>
              <th style={th_style}>상태</th>
              <th style={th_style}>생성일</th>
            </tr>
          </thead>
          <tbody>
            {filtered_rows.map((r, idx) => {
              const row_bg: React.CSSProperties | undefined = idx % 2 === 1 ? { background: ui.zebra } : undefined;
              return (
                <tr key={r.id ?? r.vendor_order_id} style={row_bg}>
                  <td style={td_style}>{r.vendor_order_id}</td>
                  <td style={td_style}>{r.vendor_id}</td>{/* 이름 매핑은 vendor_name_by_id.get(r.vendor_id)로 바꿔도 됨 */}
                  <td style={td_style}>{r.item_id}</td>
                  <td style={td_right}>{r.quantity}</td>
                  <td style={td_style}>
                    <span style={{ padding: "2px 8px", borderRadius: 999, border: `1px solid ${ui.border}`, fontSize: 12 }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={td_style}>{fmt_date(r.created_at)}</td>
                </tr>
              );
            })}
            {filtered_rows.length === 0 && !is_loading && !error && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 18, color: ui.muted }}>발주가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 신규 등록 모달 */}
      {is_create_open && (
        <div style={overlay_style} onClick={() => set_is_create_open(false)}>
          <div style={modal_style} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>신규 발주 등록</h2>
              <button type="button" onClick={() => set_is_create_open(false)} style={ghost_btn} aria-label="close">×</button>
            </div>
            <VendorOrderCreateForm
              on_success={() => {
                set_is_create_open(false);
                void load_list();
              }}
              on_cancel={() => set_is_create_open(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrderListPage;
