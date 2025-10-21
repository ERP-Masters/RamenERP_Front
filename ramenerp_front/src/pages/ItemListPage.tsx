// src/pages/ItemListPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import ItemRegisterForm from "./ItemRegisterForm";

export type UseStateEnum = "USED" | "NOTUSED";

export interface ProductRow {
  id?: number;
  item_id: string;
  category_id: string;
  category_name?: string;
  name: string;
  unit_id: string;
  unit_name?: string;
  unit_price: number;
  expiry_date?: string;
  vendor_id?: string;
  vendor_name?: string;
  is_active?: boolean;
  isused?: UseStateEnum;            // ✅ 상태 필드 추가
  /** 남은일수 (오늘 기준, 음수면 만료 지남) */
  days_left?: number | null;
}
interface DraftRow extends Partial<ProductRow> { unit_code?: string; }

type ItemListPageProps = {
  hide_title?: boolean;
};

const ui_tok = {
  border: "#e5e7eb",
  zebra: "#fafafa",
  radius: 10,
  gap: 8,
  text_muted: "#6b7280",
  danger_text: "#c62828",
  warn_text: "#ef6c00",
  primary_bg: "#0ea5e9",
  primary_border: "#0284c7",
  primary_text: "#fff",
} as const;

const page_style = { padding: 16, maxWidth: 1200, margin: "0 auto" } as const;
const title_style = { fontSize: 22, fontWeight: 800, marginBottom: 8 } as const;

const control_bar_style = {
  display: "flex", gap: ui_tok.gap, alignItems: "center", marginBottom: 12, flexWrap: "wrap" as const,
} as const;
const control_select_style = { padding: 8, minWidth: 160, borderRadius: 8, border: `1px solid ${ui_tok.border}` } as const;
const control_input_style = { padding: 8, width: 120, borderRadius: 8, border: `1px solid ${ui_tok.border}` } as const;
const clear_btn_style = {
  marginLeft: "auto", padding: "8px 12px", border: `1px solid ${ui_tok.border}`, borderRadius: 8, background: "transparent", cursor: "pointer",
} as const;

const table_wrap_style = { overflowX: "auto", border: `1px solid ${ui_tok.border}`, borderRadius: ui_tok.radius } as const;
const table_style = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 } as const;

const th_style = {
  position: "sticky" as const, top: 0, background: "#f8fafc",
  borderBottom: `1px solid ${ui_tok.border}`, padding: "10px 8px",
  textAlign: "left" as const, whiteSpace: "nowrap" as const, fontSize: 13, fontWeight: 700,
} as const;
const td_style = {
  borderBottom: `1px solid ${ui_tok.border}`, padding: "9px 8px",
  textAlign: "left" as const, whiteSpace: "nowrap" as const, fontSize: 14,
} as const;
const td_right_style = { ...td_style, textAlign: "right" as const };

function format_currency(value: number) { return new Intl.NumberFormat("ko-KR").format(value); }
function format_date_to_yyyy_mm_dd(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, "0"); const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 문자열/불리언/숫자 → "USED"|"NOTUSED" 로 정규화 */
function normalize_use_state(v: any): UseStateEnum | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") {
    const s = v.toUpperCase();
    if (s === "USED" || s === "NOTUSED") return s;
    if (s === "TRUE" || s === "1") return "USED";
    if (s === "FALSE" || s === "0") return "NOTUSED";
  }
  if (typeof v === "boolean") return v ? "USED" : "NOTUSED";
  if (typeof v === "number") return v ? "USED" : "NOTUSED";
  return undefined;
}

/** 서버 아이템 → 화면용 정규화 */
function normalize_item(raw: any): ProductRow {
  const id = raw.id ?? raw.item_pk ?? undefined;
  const item_id = String(raw.item_id ?? raw.code ?? raw.sku ?? (typeof id !== "undefined" ? id : ""));
  const category_id_num = raw.category_id ?? raw.category?.id ?? raw.category?.category_id;
  const vendor_id_num = raw.vendor_id ?? raw.vendor?.id ?? raw.vendor?.vendor_id;
  const unit_id_num = raw.unit_id ?? raw.unit?.id ?? raw.unit?.unit_id;
  const unit_price_num = typeof raw.unit_price === "string" ? Number(raw.unit_price) : Number(raw.unit_price);
  const expiry_date = raw.expiry_date ?? raw.expiration_date ?? undefined;
  const category_name_guess = raw.category_name ?? raw.category?.name ?? raw.category?.category_name;
  const vendor_name_guess = raw.vendor_name ?? raw.vendor?.name ?? raw.vendor?.vendor_name;
  const unit_name_guess = raw.unit_name ?? raw.unit?.name ?? raw.unit?.unit_name ?? raw.unit?.code;
  const isused = normalize_use_state(raw.isused ?? raw.is_used ?? raw.used ?? raw.is_active);

  return {
    id,
    item_id,
    name: String(raw.name ?? ""),
    category_id: category_id_num !== undefined ? String(category_id_num) : "",
    category_name: category_name_guess,
    unit_id: unit_id_num !== undefined ? String(unit_id_num) : "",
    unit_name: unit_name_guess,
    unit_price: Number.isFinite(unit_price_num) ? unit_price_num : 0,
    expiry_date: format_date_to_yyyy_mm_dd(expiry_date),
    vendor_id: vendor_id_num !== undefined ? String(vendor_id_num) : undefined,
    vendor_name: vendor_name_guess,
    is_active: typeof raw.is_active === "boolean" ? raw.is_active : undefined,
    isused,
  };
}

/** 공용 맵 변환 */
function to_name_map(arr: any[], id_keys: string[], name_keys: string[]) {
  const map = new Map<string, string>();
  for (const r of arr ?? []) {
    const id_raw = id_keys.map((k) => r?.[k]).find((v) => v !== undefined && v !== null);
    const name_raw = name_keys.map((k) => r?.[k]).find((v) => v !== undefined && v !== null);
    if (id_raw !== undefined && name_raw !== undefined) map.set(String(id_raw), String(name_raw));
  }
  return map;
}

/** 거래처 아이템 조회 */
async function fetch_vendor_items(vendor_id: string, signal?: AbortSignal): Promise<any[]> {
  const try_items_query = async (key: string) => {
    const res = await fetch(`/api/items?${key}=${encodeURIComponent(vendor_id)}`, { signal, headers: { Accept: "application/json" } });
    if (res.ok) {
      const body = await res.json().catch(() => null);
      if (Array.isArray(body)) return body;
      if (body && Array.isArray(body.items)) return body.items;
    }
    return null;
  };
  try { for (const key of ["vendor", "vendor_id", "vendorId"]) { const arr = await try_items_query(key); if (arr) return arr; } } catch (_) {}
  try {
    const r1 = await fetch(`/api/vendors/${encodeURIComponent(vendor_id)}/items`, { signal, headers: { Accept: "application/json" } });
    if (r1.ok) { const j1 = await r1.json().catch(() => null); if (Array.isArray(j1)) return j1; if (j1 && Array.isArray(j1.items)) return j1.items; }
  } catch (_) {}
  try {
    const r2 = await fetch(`/api/vendors/${encodeURIComponent(vendor_id)}`, { signal, headers: { Accept: "application/json" } });
    if (r2.ok) {
      const j2 = await r2.json().catch(() => null);
      if (!j2) return [];
      if (Array.isArray(j2)) return j2;
      if (Array.isArray(j2.items)) return j2.items;
      if (Array.isArray(j2.items_list)) return j2.items_list;
      if (Array.isArray(j2.data?.items)) return j2.data.items;
    }
  } catch (_) {}
  return [];
}

/** 유통기한 n일 이내 품목 */
async function fetch_expiring_items(n: number, signal?: AbortSignal): Promise<any[]> {
  const try_json = async (path: string) => {
    const r = await fetch(path, { signal, headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const body = await r.json().catch(() => null);
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.items)) return body.items;
    return null;
  };
  const paths = [
    `/api/items/expiring/${encodeURIComponent(n)}`,
    `/api/expiring/${encodeURIComponent(n)}`,
    `/api/items?expiring=${encodeURIComponent(n)}`,
  ];
  for (const p of paths) { try { const arr = await try_json(p); if (arr) return arr; } catch (_) {} }
  return [];
}

/* ===== 남은일수 계산 ===== */
const MS_PER_DAY = 24 * 60 * 60 * 1000;
function calc_days_left(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return null;
  const today = new Date(); d.setHours(0,0,0,0); today.setHours(0,0,0,0);
  return Math.ceil((d.getTime() - today.getTime()) / MS_PER_DAY);
}
function render_days_left_text(
  days: number | null | undefined,
  warn_days: number
): React.ReactNode {
  if (days === null || days === undefined) return <span>-</span>;
  if (days < 0) return <span style={{ color: "#555", fontWeight: 700 }}>D+{Math.abs(days)}</span>;
  if (days <= warn_days) return <span style={{ color: ui_tok.danger_text, fontWeight: 800 }}>D-{days}</span>;
  return <span style={{ color: ui_tok.warn_text, fontWeight: 700 }}>D-{days}</span>;
}

const action_btn_style = {
  padding: "6px 10px", borderRadius: 8, border: `1px solid ${ui_tok.border}`, background: "#fff", cursor: "pointer",
} as const;

const overlay_style: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998,
};
const modal_style: React.CSSProperties = {
  width: "min(720px, 94vw)", maxHeight: "90vh", overflowY: "auto",
  background: "#fff", border: `1px solid ${ui_tok.border}`, borderRadius: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)", padding: 16,
};
const fab_style: React.CSSProperties = {
  position: "fixed", right: 24, bottom: 24, zIndex: 9999,
  borderRadius: 999, padding: "12px 16px",
  background: ui_tok.primary_bg, border: `1px solid ${ui_tok.primary_border}`,
  color: ui_tok.primary_text, fontWeight: 800, cursor: "pointer",
};

const ItemListPage: React.FC<ItemListPageProps> = ({ hide_title = false }) => {
  const [products, set_products] = useState<ProductRow[]>([]);
  const [is_loading, set_is_loading] = useState<boolean>(false);
  const [error_message, set_error_message] = useState<string>("");

  const [selected_category_id, set_selected_category_id] = useState<string>("");
  const [selected_vendor_id, set_selected_vendor_id] = useState<string>("");
  const [expiring_days, set_expiring_days] = useState<string>("");
  const [selected_use_state, set_selected_use_state] = useState<"" | UseStateEnum>(""); // ✅ 상태 필터

  const [category_options, set_category_options] = useState<Array<{ id: string; name: string }>>([]);
  const [vendor_options, set_vendor_options] = useState<Array<{ id: string; name: string }>>([]);
  const [unit_options, set_unit_options] = useState<Array<{ id: string; code: string; name: string }>>([]);

  const unit_code_by_id = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of unit_options) m.set(u.id, u.code);
    return m;
  }, [unit_options]);

  const [editing_id, set_editing_id] = useState<string | null>(null);
  const [is_saving, set_is_saving] = useState<boolean>(false);
  const [draft_row, set_draft_row] = useState<DraftRow>({});

  const [is_register_open, set_is_register_open] = useState<boolean>(false);
  const [reload_key, set_reload_key] = useState<number>(0);
  const reload_list = () => set_reload_key((k) => k + 1);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      set_is_loading(true);
      set_error_message("");
      try {
        let items_arr: any[] = [];
        const has_expiring = expiring_days.trim() !== "" && Number(expiring_days) > 0;

        if (has_expiring) {
          const n = Number(expiring_days);
          const params = new URLSearchParams();
          params.set("expiring", String(n));
          if (selected_vendor_id) params.set("vendor", selected_vendor_id);
          if (selected_category_id) params.set("category", selected_category_id);
          try {
            const combined = await fetch(`/api/items?${params.toString()}`, { signal: controller.signal, headers: { Accept: "application/json" } });
            if (combined.ok) {
              const j = await combined.json().catch(() => null);
              items_arr = Array.isArray(j) ? j : j?.items ?? [];
            }
          } catch (_) {}
          if (!Array.isArray(items_arr) || items_arr.length === 0) {
            const raw = await fetch_expiring_items(n, controller.signal);
            items_arr = raw.filter((r: any) => {
              const ok_vendor = selected_vendor_id
                ? String(r.vendor_id ?? r.vendor?.id ?? r.vendor?.vendor_id ?? "") === String(selected_vendor_id)
                : true;
              const ok_category = selected_category_id
                ? String(r.category_id ?? r.category?.id ?? r.category?.category_id ?? "") === String(selected_category_id)
                : true;
              return ok_vendor && ok_category;
            });
          }
        } else if (selected_vendor_id && !selected_category_id) {
          items_arr = await fetch_vendor_items(selected_vendor_id, controller.signal);
        } else if (selected_vendor_id && selected_category_id) {
          const vendor_items = await fetch_vendor_items(selected_vendor_id, controller.signal);
          items_arr = vendor_items.filter((r: any) => {
            const cat = r.category_id ?? r.category?.id ?? r.category?.category_id;
            return String(cat ?? "") === String(selected_category_id);
          });
        } else {
          const url = selected_category_id ? `/api/items?category=${encodeURIComponent(selected_category_id)}` : `/api/items`;
          const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
          const raw = await res.json();
          items_arr = Array.isArray(raw) ? raw : raw.items ?? [];
        }

        const normalized_items = items_arr.map(normalize_item);

        const [cats_res, vendors_res, units_res] = await Promise.all([
          fetch("/api/category", { signal: controller.signal, headers: { Accept: "application/json" } }),
          fetch("/api/vendors/summary", { signal: controller.signal, headers: { Accept: "application/json" } }),
          fetch("/api/units", { signal: controller.signal, headers: { Accept: "application/json" } }),
        ]);

        const cats = cats_res.ok ? await cats_res.json() : [];
        const vendors = vendors_res.ok ? await vendors_res.json() : [];
        const units = units_res.ok ? await units_res.json() : [];

        const cat_name_map = to_name_map(cats, ["id", "category_id"], ["name", "category_name"]);
        const vendor_name_map = to_name_map(vendors, ["id", "vendor_id"], ["name", "vendor_name"]);

        set_category_options(
          Array.from(cat_name_map.entries()).map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name, "ko"))
        );
        set_vendor_options(
          Array.from(vendor_name_map.entries()).map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name, "ko"))
        );

        const units_arr = Array.isArray(units) ? units : units.items ?? [];
        const unit_opts = (units_arr as any[]).map((u) => {
          const id = String(u.id ?? u.unit_id ?? "");
          const code = String(u.code ?? u.unit_code ?? u.name ?? "");
          const name = String(u.name ?? u.unit_name ?? u.code ?? "");
          return { id, code, name };
        }).filter((u) => u.id && u.code);
        set_unit_options(unit_opts);

        const hydrated = normalized_items.map((it) => ({
          ...it,
          category_name: it.category_name ?? (it.category_id ? cat_name_map.get(it.category_id) : undefined),
          vendor_name: it.vendor_name ?? (it.vendor_id ? vendor_name_map.get(it.vendor_id ?? "") : undefined),
        }))
        /** 남은일수 계산 주입 */
        .map((it) => ({ ...it, days_left: calc_days_left(it.expiry_date) }));

        set_products(hydrated);
      } catch (err: any) {
        if (err?.name !== "AbortError") set_error_message(err?.message || "목록 조회 중 오류가 발생했습니다.");
      } finally {
        set_is_loading(false);
      }
    })();
    return () => controller.abort();
  }, [selected_category_id, selected_vendor_id, expiring_days, reload_key]);

  /** 상태/유통기한 필터 반영한 표시용 목록 */
  const visible_products = useMemo(() => {
    let list = products;

    // 사용/미사용 필터
    if (selected_use_state) {
      list = list.filter((p) => (p.isused ?? "USED") === selected_use_state);
    }

    // 유통기한 필터
    const n = Number(expiring_days);
    if (Number.isFinite(n) && n > 0) {
      list = list.filter((p) => {
        const dl = p.days_left ?? calc_days_left(p.expiry_date);
        return dl !== null && dl <= n;
      });
    }
    return list;
  }, [products, selected_use_state, expiring_days]);

  const start_edit = (row: ProductRow) => {
    const unit_code = row.unit_id ? unit_code_by_id.get(row.unit_id) ?? "" : "";
    set_editing_id(row.item_id);
    set_draft_row({
      item_id: row.item_id, name: row.name, category_id: row.category_id, unit_id: row.unit_id,
      unit_code, unit_price: row.unit_price, expiry_date: row.expiry_date || "", vendor_id: row.vendor_id ?? "",
    });
  };
  const cancel_edit = () => { set_editing_id(null); set_draft_row({}); };
  const handle_draft_change = (field: keyof DraftRow, value: string | number) => { set_draft_row((prev) => ({ ...prev, [field]: value })); };
  const handle_unit_code_change = (code: string) => {
    const found = unit_options.find((u) => u.code === code);
    set_draft_row((prev) => ({ ...prev, unit_code: code, unit_id: found ? found.id : "" }));
  };

  const save_edit = async () => {
    if (!editing_id) return;
    const payload: any = {
      item_id: editing_id,
      name: String(draft_row.name ?? ""),
      category_id: draft_row.category_id ? Number(draft_row.category_id) : undefined,
      unit_id: draft_row.unit_id ? Number(draft_row.unit_id) : undefined,
      unit_price: typeof draft_row.unit_price === "number" ? draft_row.unit_price : Number(draft_row.unit_price ?? 0),
      expiry_date: draft_row.expiry_date || null,
      vendor_id: draft_row.vendor_id ? Number(draft_row.vendor_id) : undefined,
      // isused는 일반 수정에서 그대로 둠
    };

    set_is_saving(true);
    try {
      const res = await fetch(`/api/items/${encodeURIComponent(editing_id)}`, {
        method: "PUT", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) { const text = await res.text().catch(() => ""); throw new Error(`수정 실패 (HTTP ${res.status}) ${text}`); }
      await res.json().catch(() => null);

      set_products((prev) =>
        prev.map((p) => {
          if (p.item_id !== editing_id) return p;
          const next: ProductRow = {
            ...p,
            name: String(payload.name ?? p.name),
            category_id: payload.category_id !== undefined ? String(payload.category_id) : p.category_id,
            unit_id: payload.unit_id !== undefined ? String(payload.unit_id) : p.unit_id,
            unit_price: Number.isFinite(payload.unit_price) ? payload.unit_price : p.unit_price,
            expiry_date: payload.expiry_date ?? p.expiry_date,
            vendor_id: payload.vendor_id !== undefined ? String(payload.vendor_id) : p.vendor_id,
          };
          const cat = category_options.find((o) => o.id === next.category_id);
          const ven = vendor_options.find((o) => o.id === (next.vendor_id ?? ""));
          next.category_name = cat?.name ?? p.category_name;
          next.vendor_name = ven?.name ?? p.vendor_name;
          next.days_left = calc_days_left(next.expiry_date);
          return next;
        })
      );

      set_editing_id(null);
      set_draft_row({ });
    } catch (e: any) {
      alert(e?.message || "수정 중 오류가 발생했습니다.");
    } finally {
      set_is_saving(false);
    }
  };

  /** ✅ 미사용 처리 */
  const handle_mark_unused = async (item_id: string) => {
    if (!item_id) return;
    const is_ok = window.confirm(`품목(ID: ${item_id})을 '미사용'으로 변경할까요?`);
    if (!is_ok) return;

    try {
      const res = await fetch(`/api/items/${encodeURIComponent(item_id)}`, {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ isused: "NOTUSED" }), // 백엔드 DTO에 맞춰 전송
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`미사용 처리 실패 (HTTP ${res.status}) ${text}`);
      }
      await res.json().catch(() => null);

      // 상태만 갱신 (필터가 '미사용'이면 이 리스트로 자연스럽게 보임)
      set_products((prev) =>
        prev.map((p) => (p.item_id === item_id ? { ...p, isused: "NOTUSED" } : p))
      );
    } catch (e: any) {
      alert(e?.message || "미사용 처리 중 오류가 발생했습니다.");
    }
  };

  // 경고 기준 (필터 입력값이 있으면 사용, 없으면 7일)
  const warn_threshold = Number(expiring_days) > 0 ? Number(expiring_days) : 7;

  return (
    <div style={page_style}>
      {!hide_title && <h1 style={title_style}>품목 조회</h1>}

      {/* 필터 바 */}
      <div style={control_bar_style}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ui_tok.text_muted }}>카테고리</span>
          <select value={selected_category_id} onChange={(e) => set_selected_category_id(e.target.value)} style={control_select_style}>
            <option value="">전체</option>
            {category_options.map((opt) => (<option key={opt.id} value={opt.id}>{opt.name}</option>))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ui_tok.text_muted }}>거래처</span>
          <select value={selected_vendor_id} onChange={(e) => set_selected_vendor_id(e.target.value)} style={control_select_style}>
            <option value="">전체</option>
            {vendor_options.map((opt) => (<option key={opt.id} value={opt.id}>{opt.name}</option>))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ui_tok.text_muted }}>사용상태</span>
          <select
            value={selected_use_state}
            onChange={(e) => set_selected_use_state(e.target.value as UseStateEnum | "")}
            style={control_select_style}
          >
            <option value="">전체</option>
            <option value="USED">사용</option>
            <option value="NOTUSED">미사용</option> {/* ← 이걸 고르면 '미사용 품목 리스트' */}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: ui_tok.text_muted }}>유통기한 ≤ (일)</span>
          <input type="number" min={1} placeholder="예: 7" value={expiring_days} onChange={(e) => set_expiring_days(e.target.value)} style={control_input_style} />
        </label>

        {(selected_category_id || selected_vendor_id || expiring_days || selected_use_state) && (
          <button
            onClick={() => { set_selected_category_id(""); set_selected_vendor_id(""); set_expiring_days(""); set_selected_use_state(""); }}
            style={clear_btn_style}
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 메인 테이블 */}
      {is_loading && <div style={{ color: ui_tok.text_muted, marginBottom: 8 }}>불러오는 중…</div>}
      {error_message && <div style={{ color: "#c62828", marginBottom: 8 }}>{error_message}</div>}

      <div style={table_wrap_style}>
        <table style={table_style}>
          <thead>
            <tr>
              <th style={th_style}>품목ID</th>
              <th style={th_style}>카테고리ID</th>
              <th style={th_style}>카테고리명</th>
              <th style={th_style}>품목명</th>
              <th style={th_style}>단위</th>
              <th style={th_style}>단가(원)</th>
              <th style={th_style}>유통기한</th>
              <th style={th_style}>남은일수</th>
              <th style={th_style}>거래처명</th>
              <th style={{ ...th_style, textAlign: "right" as const }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {visible_products.map((p, idx) => {
              const is_edit_row = editing_id === p.item_id;
              const row_bg: React.CSSProperties | undefined = idx % 2 === 1 ? { background: ui_tok.zebra } : undefined;

              if (!is_edit_row) {
                const is_unused = (p.isused ?? "USED") === "NOTUSED";
                return (
                  <tr key={p.id ?? p.item_id} style={row_bg}>
                    <td style={td_style}>{p.item_id}</td>
                    <td style={td_style}>{p.category_id}</td>
                    <td style={td_style}>{p.category_name ?? ""}</td>
                    <td style={td_style}>
                      {p.name}
                      {is_unused && <span style={{ marginLeft: 6, fontSize: 12, color: ui_tok.text_muted }}>(미사용)</span>}
                    </td>
                    <td style={td_style}>{(p.unit_id && unit_code_by_id.get(p.unit_id)) ?? p.unit_name ?? p.unit_id}</td>
                    <td style={td_style}>{format_currency(p.unit_price)}</td>
                    <td style={td_style}>{p.expiry_date ?? ""}</td>
                    <td style={{ ...td_style, textAlign: "right" as const }}>
                      {render_days_left_text(p.days_left ?? calc_days_left(p.expiry_date), warn_threshold)}
                    </td>
                    <td style={td_style}>{p.vendor_name ?? ""}</td>
                    <td style={td_right_style}>
                      <button onClick={() => start_edit(p)} style={{ ...action_btn_style, marginRight: 6 }} title="수정" disabled={is_unused}>
                        수정
                      </button>
                      {/* ❌ 삭제 버튼 제거, ✅ 미사용 버튼 추가 (USED일 때만 노출) */}
                      {!is_unused && (
                        <button
                          onClick={() => void handle_mark_unused(p.item_id)}
                          style={{ ...action_btn_style }}
                          title="미사용 처리"
                        >
                          미사용
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }

              // 편집행
              const draft_days_left = calc_days_left(String(draft_row.expiry_date ?? ""));
              return (
                <tr key={p.id ?? p.item_id} style={row_bg}>
                  <td style={td_style}>{p.item_id}</td>
                  <td style={td_style}>
                    <select value={String(draft_row.category_id ?? "")} onChange={(e) => handle_draft_change("category_id", e.target.value)} style={{ padding: 6, minWidth: 120, borderRadius: 8, border: `1px solid ${ui_tok.border}` }}>
                      <option value="">선택</option>
                      {category_options.map((opt) => (<option key={opt.id} value={opt.id}>{opt.name}</option>))}
                    </select>
                  </td>
                  <td style={td_style}>
                    {category_options.find((o) => o.id === String(draft_row.category_id ?? ""))?.name ?? ""}
                  </td>
                  <td style={td_style}>
                    <input type="text" value={String(draft_row.name ?? "")} onChange={(e) => handle_draft_change("name", e.target.value)} style={{ padding: 6, minWidth: 160, width: 220, borderRadius: 8, border: `1px solid ${ui_tok.border}` }} />
                  </td>
                  <td style={td_style}>
                    <select value={String(draft_row.unit_code ?? "")} onChange={(e) => handle_unit_code_change(e.target.value)} style={{ padding: 6, minWidth: 120, borderRadius: 8, border: `1px solid ${ui_tok.border}` }}>
                      <option value="">선택</option>
                      {unit_options.map((u) => (<option key={u.id} value={u.code}>{u.code} ({u.name})</option>))}
                    </select>
                  </td>
                  <td style={td_style}>
                    <input type="number" value={String(draft_row.unit_price ?? 0)} onChange={(e) => handle_draft_change("unit_price", e.target.value)} style={{ padding: 6, width: 120, textAlign: "right", borderRadius: 8, border: `1px solid ${ui_tok.border}` }} min={0} />
                  </td>
                  <td style={td_style}>
                    <input type="date" value={String(draft_row.expiry_date ?? "")} onChange={(e) => handle_draft_change("expiry_date", e.target.value)} style={{ padding: 6, borderRadius: 8, border: `1px solid ${ui_tok.border}` }} />
                  </td>
                  <td style={{ ...td_style, textAlign: "right" as const }}>
                    {render_days_left_text(draft_days_left, warn_threshold)}
                  </td>
                  <td style={td_style}>
                    <select value={String(draft_row.vendor_id ?? "")} onChange={(e) => handle_draft_change("vendor_id", e.target.value)} style={{ padding: 6, minWidth: 140, borderRadius: 8, border: `1px solid ${ui_tok.border}` }}>
                      <option value="">선택</option>
                      {vendor_options.map((opt) => (<option key={opt.id} value={opt.id}>{opt.name}</option>))}
                    </select>
                  </td>
                  <td style={td_right_style}>
                    <button onClick={save_edit} disabled={is_saving} style={{ ...action_btn_style, marginRight: 6 }} title="저장">
                      {is_saving ? "저장 중..." : "저장"}
                    </button>
                    <button onClick={cancel_edit} disabled={is_saving} style={action_btn_style} title="취소">취소</button>
                  </td>
                </tr>
              );
            })}

            {visible_products.length === 0 && !is_loading && !error_message && (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: 18, color: ui_tok.text_muted }}>해당 조건의 품목이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 우하단 신규 품목 등록 버튼 */}
      <button
        type="button"
        style={fab_style}
        onClick={() => set_is_register_open(true)}
        title="신규 품목 등록"
        aria-label="신규 품목 등록"
      >
        신규 품목 등록
      </button>

      {/* 등록 모달 */}
      {is_register_open && (
        <div style={overlay_style} onClick={() => set_is_register_open(false)}>
          <div style={modal_style} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>품목 등록</h2>
              <button
                type="button"
                onClick={() => set_is_register_open(false)}
                style={{ borderRadius: 8, border: `1px solid ${ui_tok.border}`, background: "#fff", cursor: "pointer", padding: "6px 10px" }}
                aria-label="close"
              >
                ×
              </button>
            </div>
            <ItemRegisterForm
              on_success={() => {
                set_is_register_open(false);
                reload_list();
              }}
              on_cancel={() => set_is_register_open(false)}
            />

          </div>
        </div>
      )}
    </div>
  );
};

export default ItemListPage;
