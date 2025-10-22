// src/pages/VendorOrderListPage.tsx
import React from "react";
import VendorOrderCreateForm from "@/pages/VendorOrderCreateForm";

/* default + named 모두 임포트해서 가용한 쪽을 선택 */
import VendorApiDefault, * as VendorApiNS from "@/api/vendor_orders";
// 어댑터: named 가 보이면 그걸 쓰고, 아니면 default 객체 사용
const API: any =
  (VendorApiNS as any)?.fetch_vendor_orders ? VendorApiNS : VendorApiDefault;

import type {
  VendorOrderRow,
  OrderStatus,
  VendorOption,
} from "@/types/vendor_order";

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

const page: React.CSSProperties = { padding: 16, maxWidth: 1200, margin: "0 auto" };
const title: React.CSSProperties = { fontSize: 22, fontWeight: 800, marginBottom: 8 };
const bar: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" as const };
const select: React.CSSProperties = { padding: 8, minWidth: 160, borderRadius: 8, border: `1px solid ${ui.border}` };
const input: React.CSSProperties = { padding: 8, width: 160, borderRadius: 8, border: `1px solid ${ui.border}` };
const ghost_btn: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: `1px solid ${ui.border}`, background: "#fff", cursor: "pointer" };
const primary_btn: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: `1px solid ${ui.primary_bd}`, background: ui.primary_bg, color: ui.primary_tx, cursor: "pointer" };
const twrap: React.CSSProperties = { overflowX: "auto", border: `1px solid ${ui.border}`, borderRadius: ui.radius };
const table: React.CSSProperties = { width: "100%", borderCollapse: "separate", borderSpacing: 0 };
const th: React.CSSProperties = { position: "sticky", top: 0, background: ui.head_bg, borderBottom: `1px solid ${ui.border}`, padding: "10px 8px", textAlign: "left", whiteSpace: "nowrap", fontSize: 13, fontWeight: 700 };
const td: React.CSSProperties = { borderBottom: `1px solid ${ui.border}`, padding: "9px 8px", textAlign: "left", whiteSpace: "nowrap", fontSize: 14 };
const td_right: React.CSSProperties = { ...td, textAlign: "right" as const };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 };
const modal: React.CSSProperties = { width: "min(720px, 94vw)", maxHeight: "90vh", overflowY: "auto", background: "#fff", border: `1px solid ${ui.border}`, borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", padding: 16 };

const VendorOrderListPage: React.FC = () => {
  const [rows, set_rows] = React.useState<VendorOrderRow[]>([]);
  const [vendors, set_vendors] = React.useState<VendorOption[]>([]);
  const [status_f, set_status_f] = React.useState<OrderStatus | "">("");
  const [vendor_f, set_vendor_f] = React.useState<string>("");
  const [wh_f, set_wh_f] = React.useState<string>("");
  const [item_f, set_item_f] = React.useState<string>("");

  const [loading, set_loading] = React.useState(false);
  const [error, set_error] = React.useState("");
  const [open, set_open] = React.useState(false);

  const vendor_name_by_id = React.useMemo(() => {
    const m = new Map<number, string>();
    for (const v of vendors) m.set(v.id, v.name);
    return m;
  }, [vendors]);

  const load_options = React.useCallback(async () => {
    try {
      const vs = await API.fetch_vendors();
      set_vendors(Array.isArray(vs) ? vs : []);
    } catch {
      /* no-op */
    }
  }, []);

  const load_list = React.useCallback(async () => {
    set_loading(true);
    set_error("");
    try {
      const data = await API.fetch_vendor_orders({
        status: status_f || undefined,
        vendor_id: vendor_f ? Number(vendor_f) : undefined,
        wh_id: wh_f ? Number(wh_f) : undefined,
        item_id: item_f ? Number(item_f) : undefined,
      });
      set_rows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      set_error(e?.message || "발주 목록 조회 실패");
    } finally {
      set_loading(false);
    }
  }, [status_f, vendor_f, wh_f, item_f]);

  React.useEffect(() => { void load_options(); }, [load_options]);
  React.useEffect(() => { void load_list(); }, [load_list]);

  const filtered = React.useMemo(() => {
    return rows.filter((r) => {
      const okS = !status_f || r.status === status_f;
      const okV = !vendor_f || String(r.vendor_id) === vendor_f;
      const okW = !wh_f || String(r.wh_id) === wh_f;
      const okI = !item_f || String(r.item_id) === item_f;
      return okS && okV && okW && okI;
    });
  }, [rows, status_f, vendor_f, wh_f, item_f]);

  const fmt = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const y = d.getFullYear(),
      m = String(d.getMonth() + 1).padStart(2, "0"),
      dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0"),
      mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${dd} ${hh}:${mi}`;
  };

  return (
    <div style={page}>
      <h1 style={title}>발주 내역</h1>

      <div style={bar}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ui.muted }}>상태</span>
          <select
            value={status_f}
            onChange={(e) => set_status_f(e.target.value as OrderStatus | "")}
            style={select}
          >
            <option value="">전체</option>
            <option value="PENDING">PENDING</option>
            <option value="INPROGRESS">INPROGRESS</option>
            <option value="SHIPPING">SHIPPING</option>
            <option value="PARTIALLY">PARTIALLY</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ui.muted }}>거래처</span>
          <select
            value={vendor_f}
            onChange={(e) => set_vendor_f(e.target.value)}
            style={select}
          >
            <option value="">전체</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ui.muted }}>창고ID</span>
          <input
            value={wh_f}
            onChange={(e) => set_wh_f(e.target.value)}
            placeholder="예: 1"
            style={input}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ui.muted }}>품목PK</span>
          <input
            value={item_f}
            onChange={(e) => set_item_f(e.target.value)}
            placeholder="예: 12"
            style={input}
          />
        </label>

        <button onClick={() => void load_list()} style={ghost_btn}>
          새로고침
        </button>

        <div style={{ marginLeft: "auto" }} />
        <button onClick={() => set_open(true)} style={primary_btn}>
          신규 발주 등록
        </button>
      </div>

      {loading && (
        <div style={{ color: ui.muted, marginBottom: 8 }}>불러오는 중…</div>
      )}
      {error && <div style={{ color: "#c62828", marginBottom: 8 }}>{error}</div>}

      <div style={twrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>발주ID</th>
              <th style={th}>창고ID</th>
              <th style={th}>거래처</th>
              <th style={th}>품목PK</th>
              <th style={th}>수량</th>
              <th style={th}>상태</th>
              <th style={th}>작성일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx) => {
              const bg = idx % 2 === 1 ? { background: ui.zebra } : undefined;
              return (
                <tr key={r.id ?? r.vendor_order_id} style={bg}>
                  <td style={td}>{r.vendor_order_id}</td>
                  <td style={td}>{r.wh_id}</td>
                  <td style={td}>{vendor_name_by_id.get(r.vendor_id) ?? r.vendor_id}</td>
                  <td style={td}>{r.item_id}</td>
                  <td style={td_right}>{r.quantity}</td>
                  <td style={td}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        border: `1px solid ${ui.border}`,
                        fontSize: 12,
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={td}>{fmt(r.created_at)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 18, color: ui.muted }}>
                  발주가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 등록 모달 */}
      {open && (
        <div style={overlay} onClick={() => set_open(false)}>
          <div style={modal} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                신규 발주 등록
              </h2>
              <button
                type="button"
                onClick={() => set_open(false)}
                style={ghost_btn}
                aria-label="close"
              >
                ×
              </button>
            </div>
            <VendorOrderCreateForm
              on_success={() => {
                set_open(false);
                void load_list();
              }}
              on_cancel={() => set_open(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrderListPage;
