// src/pages/ItemListPage.tsx
import React, { useEffect, useMemo, useState } from "react";

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
const th_td_style = { borderBottom: "1px solid #ddd", padding: "8px", textAlign: "left", whiteSpace: "nowrap" } as const;
const th_td_right_style = { ...th_td_style, textAlign: "right" } as const;
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

  const category_id_num = raw.category_id ?? raw.category?.id ?? raw.category?.category_id;
  const vendor_id_num   = raw.vendor_id   ?? raw.vendor?.id   ?? raw.vendor?.vendor_id;
  const unit_id_num     = raw.unit_id     ?? raw.unit?.id     ?? raw.unit?.unit_id;

  const unit_price_num =
    typeof raw.unit_price === "string" ? Number(raw.unit_price) : Number(raw.unit_price);

  const expiry_date = raw.expiry_date ?? raw.expiration_date ?? undefined;

  const category_name_guess = raw.category_name ?? raw.category?.name ?? raw.category?.category_name;
  const vendor_name_guess   = raw.vendor_name   ?? raw.vendor?.name   ?? raw.vendor?.vendor_name;
  const unit_name_guess     = raw.unit_name     ?? raw.unit?.name     ?? raw.unit?.unit_name ?? raw.unit?.code;

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
    const id_raw = id_keys.map((k) => r?.[k]).find((v) => v !== undefined && v !== null);
    const name_raw = name_keys.map((k) => r?.[k]).find((v) => v !== undefined && v !== null);
    if (id_raw !== undefined && name_raw !== undefined) {
      map.set(String(id_raw), String(name_raw));
    }
  }
  return map;
}

/** 거래처 아이템 조회: 1순위 /vendors/:id/items, 2순위 /vendors/:id 에서 items 필드 탐색 */
async function fetch_vendor_items(vendor_id: string, signal?: AbortSignal): Promise<any[]> {
  try {
    const res1 = await fetch(`/api/vendors/${encodeURIComponent(vendor_id)}/items`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (res1.ok) {
      const body1 = await res1.json().catch(() => null);
      if (Array.isArray(body1)) return body1;
      if (body1 && Array.isArray(body1.items)) return body1.items;
    }
  } catch (_) { /* ignore */ }

  try {
    const res2 = await fetch(`/api/vendors/${encodeURIComponent(vendor_id)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (res2.ok) {
      const body2 = await res2.json().catch(() => null);
      if (!body2) return [];
      if (Array.isArray(body2)) return body2;
      if (Array.isArray(body2.items)) return body2.items;
      if (Array.isArray(body2.items_list)) return body2.items_list;
      if (Array.isArray(body2.data?.items)) return body2.data.items;
    }
  } catch (_) { /* ignore */ }

  return [];
}

const ItemListPage: React.FC = () => {
  const [products, set_products] = useState<ProductRow[]>([]);
  const [is_loading, set_is_loading] = useState<boolean>(false);
  const [error_message, set_error_message] = useState<string>("");

  // 필터 상태
  const [selected_category_id, set_selected_category_id] = useState<string>("");
  const [selected_vendor_id, set_selected_vendor_id] = useState<string>("");

  // 셀렉트 옵션(이름 맵에서 뽑음)
  const [category_options, set_category_options] = useState<Array<{ id: string; name: string }>>([]);
  const [vendor_options, set_vendor_options] = useState<Array<{ id: string; name: string }>>([]);

  // 삭제 처리 상태
  const [is_deleting_id, set_is_deleting_id] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetch_all = async () => {
      set_is_loading(true);
      set_error_message("");

      try {
        // 1) 아이템 목록(서버 필터 적용)
        let items_arr: any[] = [];

        if (selected_vendor_id && !selected_category_id) {
          // 거래처만 선택
          items_arr = await fetch_vendor_items(selected_vendor_id, controller.signal);
        } else if (selected_vendor_id && selected_category_id) {
          // 거래처 + 카테고리 동시
          const vendor_items = await fetch_vendor_items(selected_vendor_id, controller.signal);
          items_arr = vendor_items.filter((r: any) => {
            const cat = r.category_id ?? r.category?.id ?? r.category?.category_id;
            return String(cat ?? "") === String(selected_category_id);
          });
        } else {
          // 카테고리만 선택 or 전체
          const url = selected_category_id
            ? `/api/items?category=${encodeURIComponent(selected_category_id)}`
            : `/api/items`;
          const items_res = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });
          if (!items_res.ok) {
            throw new Error(`HTTP ${items_res.status}: ${await items_res.text()}`);
          }
          const items_raw = await items_res.json();
          items_arr = Array.isArray(items_raw) ? items_raw : (items_raw.items ?? []);
        }

        const normalized_items = items_arr.map(normalize_item);

        // 2) 보조 사전: 카테고리/거래처/단위 (이름 매핑용)
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
        const unit_name_map = to_name_map(units, ["id", "unit_id"], ["name", "unit_name", "code"]);

        // 옵션 채우기
        set_category_options(
          Array.from(cat_name_map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name, "ko"))
        );
        set_vendor_options(
          Array.from(vendor_name_map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name, "ko"))
        );

        // 3) 이름 하이드레이션
        const hydrated = normalized_items.map((it) => ({
          ...it,
          category_name: it.category_name ?? (it.category_id ? cat_name_map.get(it.category_id) : undefined),
          vendor_name: it.vendor_name ?? (it.vendor_id ? vendor_name_map.get(it.vendor_id) : undefined),
          unit_name: it.unit_name ?? (it.unit_id ? unit_name_map.get(it.unit_id) : undefined),
        }));

        set_products(hydrated);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          set_error_message(err?.message || "목록 조회 중 오류가 발생했습니다.");
        }
      } finally {
        set_is_loading(false);
      }
    };

    fetch_all();
    return () => controller.abort();
    // ✅ 선택 변경 시마다 서버 재조회
  }, [selected_category_id, selected_vendor_id]);

  // (선택) 추가적인 클라 검색이 필요하다면 여기서 useMemo로 한 번 더 거르면 됨.
  const visible_products = useMemo(() => products, [products]);

  // 삭제
  const handle_delete = async (item_id: string) => {
    if (!item_id) return;
    const is_ok = window.confirm(`품목(ID: ${item_id})을 삭제할까요?`);
    if (!is_ok) return;

    set_is_deleting_id(item_id);
    try {
      // 기본: DELETE /api/items/:item_id
      const res = await fetch(`/api/items/${encodeURIComponent(item_id)}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      // (대안) 백엔드가 쿼리스트링만 받는다면 아래 한 줄로 교체:
      // const res = await fetch(`/api/items?item_id=${encodeURIComponent(item_id)}`, { method: "DELETE" });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`삭제 실패 (HTTP ${res.status}) ${text}`);
      }

      // 낙관적 업데이트
      set_products((prev) => prev.filter((p) => p.item_id !== item_id));
    } catch (e: any) {
      alert(e?.message || "삭제 중 오류가 발생했습니다.");
    } finally {
      set_is_deleting_id(null);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>품목 조회 페이지</h1>

      {/* 컨트롤 바: 필터 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>카테고리</span>
          <select
            value={selected_category_id}
            onChange={(e) => set_selected_category_id(e.target.value)}
            style={{ padding: 8, minWidth: 160 }}
          >
            <option value="">전체</option>
            {category_options.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>거래처</span>
          <select
            value={selected_vendor_id}
            onChange={(e) => set_selected_vendor_id(e.target.value)}
            style={{ padding: 8, minWidth: 160 }}
          >
            <option value="">전체</option>
            {vendor_options.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </label>

        {(selected_category_id || selected_vendor_id) && (
          <button
            onClick={() => { set_selected_category_id(""); set_selected_vendor_id(""); }}
            style={{ marginLeft: "auto", padding: "8px 12px" }}
          >
            필터 초기화
          </button>
        )}
      </div>

      {is_loading && <div style={{ margin: "8px 0" }}>불러오는 중…</div>}
      {error_message && <div style={{ color: "crimson", margin: "8px 0" }}>{error_message}</div>}

      <div style={{ overflowX: "auto" }}>
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
              <th style={th_td_right_style}>관리</th>
            </tr>
          </thead>
          <tbody>
            {visible_products.map((p) => (
              <tr key={p.id ?? p.item_id}>
                <td style={th_td_style}>{p.item_id}</td>
                <td style={th_td_style}>{p.category_id}</td>
                <td style={th_td_style}>{p.category_name ?? ""}</td>
                <td style={th_td_style}>{p.name}</td>
                <td style={th_td_style}>{p.unit_name ?? p.unit_id}</td>
                <td style={th_td_style}>{format_currency(p.unit_price)}</td>
                <td style={th_td_style}>{p.expiry_date ?? ""}</td>
                <td style={th_td_style}>{p.vendor_name ?? ""}</td>
                <td style={th_td_right_style}>
                  <button
                    onClick={() => handle_delete(p.item_id)}
                    disabled={is_deleting_id === p.item_id}
                    style={{ padding: "6px 10px" }}
                    title="삭제"
                  >
                    {is_deleting_id === p.item_id ? "삭제 중..." : "삭제"}
                  </button>
                </td>
              </tr>
            ))}

            {visible_products.length === 0 && !is_loading && !error_message && (
              <tr>
                <td colSpan={9} style={empty_cell_style}>등록된 품목이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemListPage;
