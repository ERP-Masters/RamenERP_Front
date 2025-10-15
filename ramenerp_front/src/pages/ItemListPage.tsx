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

// 편집 드래프트에 unit_code(표시용)를 추가로 허용
interface DraftRow extends Partial<ProductRow> {
  unit_code?: string;
}

const table_style = { width: "100%", borderCollapse: "collapse" } as const;
const th_td_style = {
  borderBottom: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
  whiteSpace: "nowrap",
} as const;
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
  const vendor_id_num = raw.vendor_id ?? raw.vendor?.id ?? raw.vendor?.vendor_id;
  const unit_id_num = raw.unit_id ?? raw.unit?.id ?? raw.unit?.unit_id;

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
    const id_raw = id_keys.map((k) => r?.[k]).find((v) => v !== undefined && v !== null);
    const name_raw = name_keys.map((k) => r?.[k]).find((v) => v !== undefined && v !== null);
    if (id_raw !== undefined && name_raw !== undefined) {
      map.set(String(id_raw), String(name_raw));
    }
  }
  return map;
}

/** 거래처 아이템 조회: 1순위 /items?vendor=, 2순위 /vendors/:id/items, 3순위 /vendors/:id */
async function fetch_vendor_items(vendor_id: string, signal?: AbortSignal): Promise<any[]> {
  const try_items_query = async (key: string) => {
    const res = await fetch(`/api/items?${key}=${encodeURIComponent(vendor_id)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const body = await res.json().catch(() => null);
      if (Array.isArray(body)) return body;
      if (body && Array.isArray(body.items)) return body.items;
    }
    return null;
  };

  try {
    for (const key of ["vendor", "vendor_id", "vendorId"]) {
      const arr = await try_items_query(key);
      if (arr) return arr;
    }
  } catch (_) {}

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
  } catch (_) {}

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
  } catch (_) {}

  return [];
}

/** 유통기한 n일 이내 품목 조회 (여러 엔드포인트 대응) */
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

  for (const p of paths) {
    try {
      const arr = await try_json(p);
      if (arr) return arr;
    } catch (_) {}
  }
  return [];
}

/* ===== 유통기한 배지 유틸 ===== */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calc_days_left(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  // 날짜 기준 비교(시분초 차이 제거)
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / MS_PER_DAY);
}

function get_expiry_badge(
  iso?: string,
  warn_days?: number
): { text: string | null; style: React.CSSProperties | null } {
  const days_left = calc_days_left(iso);
  if (days_left === null) return { text: null, style: null };

  const warn = Number(warn_days) > 0 ? Number(warn_days) : 7;

  // 만료됨
  if (days_left < 0) {
    return {
      text: `만료 D+${Math.abs(days_left)}`,
      style: {
        marginLeft: 8,
        padding: "2px 6px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: "#eee",
        color: "#555",
      },
    };
  }

  // 임박(경고 임계 이내) → 빨강
  if (days_left <= warn) {
    return {
      text: `D-${days_left}`,
      style: {
        marginLeft: 8,
        padding: "2px 6px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: "#ffebee",
        color: "#c62828",
      },
    };
  }

  // 30일 이내 → 주의(주황)
  if (days_left <= 30) {
    return {
      text: `D-${days_left}`,
      style: {
        marginLeft: 8,
        padding: "2px 6px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: "#fff3e0",
        color: "#ef6c00",
      },
    };
  }

  return { text: null, style: null };
}

const ItemListPage: React.FC = () => {
  const [products, set_products] = useState<ProductRow[]>([]);
  const [is_loading, set_is_loading] = useState<boolean>(false);
  const [error_message, set_error_message] = useState<string>("");

  // 필터 상태
  const [selected_category_id, set_selected_category_id] = useState<string>("");
  const [selected_vendor_id, set_selected_vendor_id] = useState<string>("");
  const [expiring_days, set_expiring_days] = useState<string>(""); // ""=해제, "7"=7일 이내

  // 셀렉트 옵션
  const [category_options, set_category_options] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [vendor_options, set_vendor_options] = useState<Array<{ id: string; name: string }>>([]);
  // 단위 옵션(code 표시)
  const [unit_options, set_unit_options] = useState<
    Array<{ id: string; code: string; name: string }>
  >([]);

  // code 조회용 맵
  const unit_code_by_id = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of unit_options) m.set(u.id, u.code);
    return m;
  }, [unit_options]);

  // 삭제 처리 상태
  const [is_deleting_id, set_is_deleting_id] = useState<string | null>(null);

  // === 편집 관련 상태 ===
  const [editing_id, set_editing_id] = useState<string | null>(null);
  const [is_saving, set_is_saving] = useState<boolean>(false);
  const [draft_row, set_draft_row] = useState<DraftRow>({});

  useEffect(() => {
    const controller = new AbortController();

    const fetch_all = async () => {
      set_is_loading(true);
      set_error_message("");

      try {
        // 1) 아이템 목록(서버 필터 적용)
        let items_arr: any[] = [];

        const has_expiring = expiring_days.trim() !== "" && Number(expiring_days) > 0;

        if (has_expiring) {
          const n = Number(expiring_days);

          // (선호) 서버가 동시 필터 지원: /items?expiring=n&vendor=..&category=..
          const build_combined_url = () => {
            const params = new URLSearchParams();
            params.set("expiring", String(n));
            if (selected_vendor_id) params.set("vendor", selected_vendor_id);
            if (selected_category_id) params.set("category", selected_category_id);
            return `/api/items?${params.toString()}`;
          };

          try {
            const combined = await fetch(build_combined_url(), {
              signal: controller.signal,
              headers: { Accept: "application/json" },
            });
            if (combined.ok) {
              const j = await combined.json().catch(() => null);
              items_arr = Array.isArray(j) ? j : j?.items ?? [];
            }
          } catch (_) {}

          // 미지원/실패 시: /expiring/n 결과에 클라에서 거래처/카테고리 필터 적용
          if (!Array.isArray(items_arr) || items_arr.length === 0) {
            const raw = await fetch_expiring_items(n, controller.signal);
            items_arr = raw.filter((r: any) => {
              const ok_vendor = selected_vendor_id
                ? String(r.vendor_id ?? r.vendor?.id ?? r.vendor?.vendor_id ?? "") ===
                  String(selected_vendor_id)
                : true;
              const ok_category = selected_category_id
                ? String(r.category_id ?? r.category?.id ?? r.category?.category_id ?? "") ===
                  String(selected_category_id)
                : true;
              return ok_vendor && ok_category;
            });
          }
        } else if (selected_vendor_id && !selected_category_id) {
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
          items_arr = Array.isArray(items_raw) ? items_raw : items_raw.items ?? [];
        }

        const normalized_items = items_arr.map(normalize_item);

        // 2) 보조 사전: 카테고리/거래처/단위
        const [cats_res, vendors_res, units_res] = await Promise.all([
          fetch("/api/category", {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }),
          fetch("/api/vendors/summary", {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }),
          fetch("/api/units", {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }),
        ]);

        const cats = cats_res.ok ? await cats_res.json() : [];
        const vendors = vendors_res.ok ? await vendors_res.json() : [];
        const units = units_res.ok ? await units_res.json() : [];

        const cat_name_map = to_name_map(cats, ["id", "category_id"], ["name", "category_name"]);
        const vendor_name_map = to_name_map(vendors, ["id", "vendor_id"], ["name", "vendor_name"]);

        // 옵션 채우기: 카테고리/거래처
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

        // 단위 옵션(id, code, name)
        const units_arr = Array.isArray(units) ? units : units.items ?? [];
        const unit_opts = (units_arr as any[])
          .map((u) => {
            const id = String(u.id ?? u.unit_id ?? "");
            const code = String(u.code ?? u.unit_code ?? u.name ?? "");
            const name = String(u.name ?? u.unit_name ?? u.code ?? "");
            return { id, code, name };
          })
          .filter((u) => u.id && u.code);
        set_unit_options(unit_opts);

        // 3) 이름 하이드레이션
        const hydrated = normalized_items.map((it) => ({
          ...it,
          category_name:
            it.category_name ?? (it.category_id ? cat_name_map.get(it.category_id) : undefined),
          vendor_name:
            it.vendor_name ?? (it.vendor_id ? vendor_name_map.get(it.vendor_id) : undefined),
          // unit_name은 code 표시를 우선하므로 뷰에서 code 매핑으로 먼저 보여줌
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
    // ✅ 선택 변경/유통기한 변경 시마다 서버 재조회
  }, [selected_category_id, selected_vendor_id, expiring_days]);

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

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`삭제 실패 (HTTP ${res.status}) ${text}`);
      }

      // 낙관적 업데이트
      set_products((prev) => prev.filter((p) => p.item_id !== item_id));
      // 편집 중이었다면 종료
      if (editing_id === item_id) {
        set_editing_id(null);
        set_draft_row({});
      }
    } catch (e: any) {
      alert(e?.message || "삭제 중 오류가 발생했습니다.");
    } finally {
      set_is_deleting_id(null);
    }
  };

  // === 편집 로직 ===
  const start_edit = (row: ProductRow) => {
    const unit_code = row.unit_id ? unit_code_by_id.get(row.unit_id) ?? "" : "";

    set_editing_id(row.item_id);
    set_draft_row({
      item_id: row.item_id,
      name: row.name,
      category_id: row.category_id,
      unit_id: row.unit_id,
      unit_code, // 표시/선택용
      unit_price: row.unit_price,
      expiry_date: row.expiry_date || "",
      vendor_id: row.vendor_id ?? "",
    });
  };

  const cancel_edit = () => {
    set_editing_id(null);
    set_draft_row({});
  };

  const handle_draft_change = (field: keyof DraftRow, value: string | number) => {
    set_draft_row((prev) => ({ ...prev, [field]: value }));
  };

  const handle_unit_code_change = (code: string) => {
    const found = unit_options.find((u) => u.code === code);
    set_draft_row((prev) => ({
      ...prev,
      unit_code: code,
      unit_id: found ? found.id : "",
    }));
  };

  const save_edit = async () => {
    if (!editing_id) return;
    // 서버 페이로드(숫자 필드 정리)
    const payload: any = {
      item_id: editing_id,
      name: String(draft_row.name ?? ""),
      category_id: draft_row.category_id ? Number(draft_row.category_id) : undefined,
      unit_id: draft_row.unit_id ? Number(draft_row.unit_id) : undefined,
      unit_price:
        typeof draft_row.unit_price === "number"
          ? draft_row.unit_price
          : Number(draft_row.unit_price ?? 0),
      expiry_date: draft_row.expiry_date || null, // 빈값이면 null로 보냄(백엔드 정책에 맞게 조정)
      vendor_id: draft_row.vendor_id ? Number(draft_row.vendor_id) : undefined,
    };

    set_is_saving(true);
    try {
      // 기본: PUT /api/items/:item_id
      const res = await fetch(`/api/items/${encodeURIComponent(editing_id)}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`수정 실패 (HTTP ${res.status}) ${text}`);
      }

      await res.json().catch(() => null);

      // 낙관적 업데이트
      set_products((prev) =>
        prev.map((p) => {
          if (p.item_id !== editing_id) return p;

          const next: ProductRow = {
            ...p,
            name: String(payload.name ?? p.name),
            category_id:
              payload.category_id !== undefined ? String(payload.category_id) : p.category_id,
            unit_id: payload.unit_id !== undefined ? String(payload.unit_id) : p.unit_id,
            unit_price: Number.isFinite(payload.unit_price) ? payload.unit_price : p.unit_price,
            expiry_date: payload.expiry_date ?? p.expiry_date,
            vendor_id: payload.vendor_id !== undefined ? String(payload.vendor_id) : p.vendor_id,
          };

          const cat = category_options.find((o) => o.id === next.category_id);
          const ven = vendor_options.find((o) => o.id === (next.vendor_id ?? ""));
          next.category_name = cat?.name ?? p.category_name;
          next.vendor_name = ven?.name ?? p.vendor_name;
          return next;
        })
      );

      set_editing_id(null);
      set_draft_row({});
    } catch (e: any) {
      alert(e?.message || "수정 중 오류가 발생했습니다.");
    } finally {
      set_is_saving(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>품목 조회 페이지</h1>

      {/* 컨트롤 바: 필터 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>카테고리</span>
          <select
            value={selected_category_id}
            onChange={(e) => set_selected_category_id(e.target.value)}
            style={{ padding: 8, minWidth: 160 }}
          >
            <option value="">전체</option>
            {category_options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
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
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>유통기한 ≤ (일)</span>
          <input
            type="number"
            min={1}
            placeholder="예: 7"
            value={expiring_days}
            onChange={(e) => set_expiring_days(e.target.value)}
            style={{ padding: 8, width: 100 }}
          />
        </label>

        {(selected_category_id || selected_vendor_id || expiring_days) && (
          <button
            onClick={() => {
              set_selected_category_id("");
              set_selected_vendor_id("");
              set_expiring_days("");
            }}
            style={{ marginLeft: "auto", padding: "8px 12px" }}
          >
            필터 초기화
          </button>
        )}
      </div>

      {is_loading && <div style={{ margin: "8px 0" }}>불러오는 중…</div>}
      {error_message && (
        <div style={{ color: "crimson", margin: "8px 0" }}>{error_message}</div>
      )}

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
            {visible_products.map((p) => {
              const is_edit_row = editing_id === p.item_id;

              if (!is_edit_row) {
                // 일반 표시 행
                const badge = get_expiry_badge(
                  p.expiry_date,
                  Number(expiring_days) > 0 ? Number(expiring_days) : 7
                );

                return (
                  <tr key={p.id ?? p.item_id}>
                    <td style={th_td_style}>{p.item_id}</td>
                    <td style={th_td_style}>{p.category_id}</td>
                    <td style={th_td_style}>{p.category_name ?? ""}</td>
                    <td style={th_td_style}>{p.name}</td>
                    <td style={th_td_style}>
                      {(p.unit_id && unit_code_by_id.get(p.unit_id)) ??
                        p.unit_name ??
                        p.unit_id}
                    </td>
                    <td style={th_td_style}>{format_currency(p.unit_price)}</td>
                    <td style={th_td_style}>
                      <span>{p.expiry_date ?? ""}</span>
                      {badge.text ? <span style={badge.style || undefined}>{badge.text}</span> : null}
                    </td>
                    <td style={th_td_style}>{p.vendor_name ?? ""}</td>
                    <td style={th_td_right_style}>
                      {/* 수정(왼쪽) */}
                      <button
                        onClick={() => start_edit(p)}
                        disabled={Boolean(is_deleting_id)}
                        style={{ padding: "6px 10px", marginRight: 6 }}
                        title="수정"
                      >
                        수정
                      </button>

                      {/* 삭제(오른쪽) */}
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
                );
              }

              // 편집 행
              return (
                <tr key={p.id ?? p.item_id}>
                  <td style={th_td_style}>{p.item_id}</td>

                  <td style={th_td_style}>
                    <select
                      value={String(draft_row.category_id ?? "")}
                      onChange={(e) => handle_draft_change("category_id", e.target.value)}
                      style={{ padding: 6, minWidth: 120 }}
                    >
                      <option value="">선택</option>
                      {category_options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={th_td_style}>
                    {category_options.find((o) => o.id === String(draft_row.category_id ?? ""))?.name ??
                      ""}
                  </td>

                  <td style={th_td_style}>
                    <input
                      type="text"
                      value={String(draft_row.name ?? "")}
                      onChange={(e) => handle_draft_change("name", e.target.value)}
                      style={{ padding: 6, minWidth: 160, width: 220 }}
                    />
                  </td>

                  {/* 단위: code 드롭다운 */}
                  <td style={th_td_style}>
                    <select
                      value={String(draft_row.unit_code ?? "")}
                      onChange={(e) => handle_unit_code_change(e.target.value)}
                      style={{ padding: 6, minWidth: 120 }}
                    >
                      <option value="">선택</option>
                      {unit_options.map((u) => (
                        <option key={u.id} value={u.code}>
                          {u.code} ({u.name})
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={th_td_style}>
                    <input
                      type="number"
                      value={String(draft_row.unit_price ?? 0)}
                      onChange={(e) => handle_draft_change("unit_price", e.target.value)}
                      style={{ padding: 6, width: 120, textAlign: "right" }}
                      min={0}
                    />
                  </td>

                  <td style={th_td_style}>
                    <input
                      type="date"
                      value={String(draft_row.expiry_date ?? "")}
                      onChange={(e) => handle_draft_change("expiry_date", e.target.value)}
                      style={{ padding: 6 }}
                    />
                  </td>

                  <td style={th_td_style}>
                    <select
                      value={String(draft_row.vendor_id ?? "")}
                      onChange={(e) => handle_draft_change("vendor_id", e.target.value)}
                      style={{ padding: 6, minWidth: 140 }}
                    >
                      <option value="">선택</option>
                      {vendor_options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={th_td_right_style}>
                    <button
                      onClick={save_edit}
                      disabled={is_saving}
                      style={{ padding: "6px 10px", marginRight: 6 }}
                      title="저장"
                    >
                      {is_saving ? "저장 중..." : "저장"}
                    </button>
                    <button
                      onClick={cancel_edit}
                      disabled={is_saving}
                      style={{ padding: "6px 10px" }}
                      title="취소"
                    >
                      취소
                    </button>
                  </td>
                </tr>
              );
            })}

            {visible_products.length === 0 && !is_loading && !error_message && (
              <tr>
                <td colSpan={9} style={empty_cell_style}>
                  등록된 품목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemListPage;
