import React, { useEffect, useState } from "react";

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
}

const table_style = { width: "100%", borderCollapse: "collapse" } as const;
const th_td_style = { borderBottom: "1px solid #ddd", padding: "8px", textAlign: "left" } as const;
const empty_cell_style = { textAlign: "center", padding: "16px" } as const;

function format_currency(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function format_date_to_yyyy_mm_dd(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 서버 아이템 → 화면용 정규화 (flatten/nested 모두 대응) */
function normalize_item(raw: any): ProductRow {
  const id = raw.id ?? raw.item_pk ?? undefined;

  const item_id = String(
    raw.item_id ?? raw.code ?? raw.sku ?? (typeof id !== "undefined" ? id : "")
  );

  const category_id_num =
    raw.category_id ?? raw.category?.id ?? raw.category?.category_id;
  const vendor_id_num =
    raw.vendor_id ?? raw.vendor?.id ?? raw.vendor?.vendor_id;
  const unit_id_num =
    raw.unit_id ?? raw.unit?.id ?? raw.unit?.unit_id;

  const unit_price_num =
    typeof raw.unit_price === "string" ? Number(raw.unit_price) : Number(raw.unit_price);

  const expiry_date = raw.expiry_date ?? raw.expiration_date ?? undefined;

  const category_name_guess =
    raw.category_name ?? raw.category?.name ?? raw.category?.category_name;
  const vendor_name_guess =
    raw.vendor_name ?? raw.vendor?.name ?? raw.vendor?.vendor_name;
  const unit_name_guess =
    raw.unit_name ?? raw.unit?.name ?? raw.unit?.unit_name ?? raw.unit?.code;

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
  };
}

/** 공용: {id,name}[] 어떤 키여도 유연하게 맵으로 변환 */
function to_name_map(arr: any[], id_keys: string[], name_keys: string[]) {
  const map = new Map<string, string>();
  for (const r of arr ?? []) {
    const id_raw = id_keys.map(k => r?.[k]).find(v => v !== undefined && v !== null);
    const name_raw = name_keys.map(k => r?.[k]).find(v => v !== undefined && v !== null);
    if (id_raw !== undefined && name_raw !== undefined) {
      map.set(String(id_raw), String(name_raw));
    }
  }
  return map;
}

const ItemListPage: React.FC = () => {
  const [products, set_products] = useState<ProductRow[]>([]);
  const [is_loading, set_is_loading] = useState<boolean>(false);
  const [error_message, set_error_message] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    const fetch_all = async () => {
      set_is_loading(true);
      set_error_message("");

      try {
        // 1) 아이템 목록
        const items_res = await fetch("/api/items", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!items_res.ok) {
          throw new Error(`HTTP ${items_res.status}: ${await items_res.text()}`);
        }
        const items_raw = await items_res.json();
        const items_arr: any[] = Array.isArray(items_raw) ? items_raw : (items_raw.items ?? []);
        const normalized_items = items_arr.map(normalize_item);

        // 2) 보조 사전: 카테고리/거래처/단위 목록 (이름 매핑용)
        const [cats_res, vendors_res, units_res] = await Promise.all([
          fetch("/api/category", { signal: controller.signal, headers: { Accept: "application/json" } }),
          fetch("/api/vendors",  { signal: controller.signal, headers: { Accept: "application/json" } }),
          fetch("/api/units",    { signal: controller.signal, headers: { Accept: "application/json" } }),
        ]);

        const cats    = cats_res.ok    ? await cats_res.json()    : [];
        const vendors = vendors_res.ok ? await vendors_res.json() : [];
        const units   = units_res.ok   ? await units_res.json()   : [];

        const cat_name_map    = to_name_map(cats,    ["id","category_id"], ["name","category_name"]);
        const vendor_name_map = to_name_map(vendors,["id","vendor_id"],   ["name","vendor_name"]);
        const unit_name_map   = to_name_map(units,  ["id","unit_id"],     ["name","unit_name","code"]);

        // 3) 이름 하이드레이션 (응답에 이미 있으면 그 값을 우선 사용)
        const hydrated = normalized_items.map(it => ({
          ...it,
          category_name: it.category_name ?? (it.category_id ? cat_name_map.get(it.category_id) : undefined),
          vendor_name:   it.vendor_name   ?? (it.vendor_id   ? vendor_name_map.get(it.vendor_id) : undefined),
          unit_name:     it.unit_name     ?? (it.unit_id     ? unit_name_map.get(it.unit_id) : undefined),
        }));

        set_products(hydrated);
      } catch (err: any) {
        // AbortError는 무시 (React StrictMode, 페이지 이동/언마운트 등)
        if (err?.name === "AbortError" || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        set_error_message(err?.message || "목록 조회 중 오류가 발생했습니다.");
      } finally {
        set_is_loading(false);
      }
    };

    fetch_all();
    return () => controller.abort();
  }, []);

  return (
    <div>
      <h1>품목 조회 페이지</h1>

      {is_loading && <div style={{ margin: "8px 0" }}>불러오는 중…</div>}
      {error_message && <div style={{ color: "crimson", margin: "8px 0" }}>{error_message}</div>}

      <table style={table_style}>
        <thead>
          <tr>
            <th style={th_td_style}>품목ID</th>
            <th style={th_td_style}>카테고리ID</th>
            <th style={th_td_style}>카테고리명</th>
            <th style={th_td_style}>품목명</th>
            <th style={th_td_style}>단위</th>
            <th style={th_td_style}>단가(원)</th>
            <th style={th_td_style}>유통기한</th>
            <th style={th_td_style}>거래처명</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id ?? p.item_id}>
              <td style={th_td_style}>{p.item_id}</td>
              <td style={th_td_style}>{p.category_id}</td>
              <td style={th_td_style}>{p.category_name ?? ""}</td>
              <td style={th_td_style}>{p.name}</td>
              <td style={th_td_style}>{p.unit_name ?? p.unit_id}</td>
              <td style={th_td_style}>{format_currency(p.unit_price)}</td>
              <td style={th_td_style}>{p.expiry_date ?? ""}</td>
              <td style={th_td_style}>{p.vendor_name ?? ""}</td>
            </tr>
          ))}

          {products.length === 0 && !is_loading && !error_message && (
            <tr>
              <td colSpan={8} style={empty_cell_style}>등록된 품목이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ItemListPage;
