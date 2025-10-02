// src/pages/ItemRegisterForm.tsx
import React, { useEffect, useState } from "react";

/** 옵션 {id, name} 기본 타입 */
interface IdNameOption {
  id: number;
  name: string;
}

/** 폼 입력 단계(문자열 유지) */
interface ProductData {
  item_id: string;
  name: string;
  category_id: string; // select 값은 string (전송 직전에 정수 변환)
  vendor_id: string;
  unit_id: string;
  unit_price: string;  // 입력 단계는 문자열
  expiry_date: string; // yyyy-mm-dd
}

/** 서버 DTO (백엔드 DTO와 동일) */
interface CreateItemDto {
  item_id: string;
  name: string;
  category_id: number;
  vendor_id: number;
  unit_id: number;
  unit_price: number;   // @IsInt()
  expiry_date: string;  // @IsDateString()
}

const input_style = { display: "block", marginBottom: 12 } as const;
const label_style = { display: "block", marginTop: 8, marginBottom: 4 } as const;
const error_style = { color: "crimson", fontSize: 12, margin: "8px 0" } as const;
const info_style = { color: "#2e7d32", fontSize: 12, margin: "8px 0" } as const;

const ItemRegisterForm: React.FC = () => {
  // 폼 상태
  const [form_data, set_form_data] = useState<ProductData>({
    item_id: "",
    name: "",
    category_id: "",
    vendor_id: "",
    unit_id: "",
    unit_price: "",
    expiry_date: "",
  });

  // 옵션 상태
  const [category_options, set_category_options] = useState<IdNameOption[]>([]);
  const [vendor_options, set_vendor_options] = useState<IdNameOption[]>([]);
  const [unit_options, set_unit_options] = useState<IdNameOption[]>([]);
  const [is_loading_options, set_is_loading_options] = useState<boolean>(false);
  const [load_error, set_load_error] = useState<string | null>(null);

  // 제출 상태
  const [is_submitting, set_is_submitting] = useState<boolean>(false);
  const [error_message, set_error_message] = useState<string>("");
  const [info_message, set_info_message] = useState<string>("");

  // ───────────── 유틸 ─────────────
  const to_int = (value: string): number => {
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      throw new Error("정수 필드에 잘못된 값이 있습니다.");
    }
    return n;
  };

  const normalize_option = (raw: any, type: "category" | "unit" | "vendor"): IdNameOption => {
    switch (type) {
      case "category":
        return { id: Number(raw.id ?? raw.category_id), name: String(raw.group ??raw.name ?? raw.category_name) };
      case "unit":
        return { id: Number(raw.id ?? raw.unit_id), name: String(raw.code ??raw.name ?? raw.unit_name ?? raw.code) };
      case "vendor":
        return { id: Number(raw.id ?? raw.vendor_id), name: String(raw.name ?? raw.vendor_name) };
    }
  };

  const fetch_json = async <T,>(url: string, signal?: AbortSignal): Promise<T> => {
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  };

  // 어떤 응답이 와도 배열로 변환: [], {items:[]}, {data:[]}, {results:[]}
  const to_array = (raw: any): any[] => {
    if (Array.isArray(raw)) return raw;
    if (raw?.items && Array.isArray(raw.items)) return raw.items;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    if (raw?.results && Array.isArray(raw.results)) return raw.results;
    return [];
  };

  const is_valid_date = (value: string): boolean => {
    if (!value) return false;
    const t = Date.parse(value);
    return Number.isFinite(t);
  };

  const is_valid_form = (): boolean => {
    if (!form_data.item_id.trim()) return false;
    if (!form_data.category_id) return false;
    if (!form_data.name.trim()) return false;
    if (!form_data.unit_id) return false;
    if (!form_data.vendor_id) return false;

    // 정수 가격 (@IsInt)
    const price_num = Number(form_data.unit_price);
    if (!Number.isFinite(price_num) || !Number.isInteger(price_num) || price_num < 0) return false;

    // 서버 DTO가 @IsNotEmpty() + @IsDateString() 이므로 필수
    if (!form_data.expiry_date) return false;
    if (!is_valid_date(form_data.expiry_date)) return false;

    return true;
  };

  const to_create_dto = (data: ProductData): CreateItemDto => ({
    item_id: data.item_id.trim(),
    name: data.name.trim(),
    category_id: to_int(data.category_id),
    vendor_id: to_int(data.vendor_id),
    unit_id: to_int(data.unit_id),
    unit_price: to_int(data.unit_price),
    // "YYYY-MM-DD" 그대로 전송 → @IsDateString 통과
    expiry_date: data.expiry_date.trim(),
  });

  // ───────────── 옵션 로딩 ─────────────
  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;

    async function load_all() {
      set_is_loading_options(true);
      set_load_error(null);
      try {
        const [catsRaw, vendorsRaw, unitsRaw] = await Promise.all([
          fetch_json<any>("/api/category", signal),
          fetch_json<any>("/api/vendors", signal),
          fetch_json<any>("/api/units", signal),
        ]);

        const cats = to_array(catsRaw)
          .map((c) => normalize_option(c, "category"))
          .filter((o) => Number.isFinite(o.id) && !!o.name);
        const vendors = to_array(vendorsRaw)
          .map((v) => normalize_option(v, "vendor"))
          .filter((o) => Number.isFinite(o.id) && !!o.name);
        const units = to_array(unitsRaw)
          .map((u) => normalize_option(u, "unit"))
          .filter((o) => Number.isFinite(o.id) && !!o.name);

        set_category_options(cats);
        set_vendor_options(vendors);
        set_unit_options(units);
      } catch (err: any) {
        // AbortError는 무시 (React StrictMode, 언마운트 등)
        if (err?.name === "AbortError" || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        set_load_error(err?.message || "옵션 목록을 불러오지 못했습니다.");
      } finally {
        set_is_loading_options(false);
      }
    }

    load_all();
    return () => ac.abort();
  }, []);

  // ───────────── 이벤트 ─────────────
  const handle_change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    set_form_data((prev) => ({ ...prev, [name]: value }));
  };

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_error_message("");
    set_info_message("");

    const trimmed: ProductData = {
      ...form_data,
      item_id: form_data.item_id.trim(),
      name: form_data.name.trim(),
      unit_price: form_data.unit_price.trim(),
      expiry_date: form_data.expiry_date.trim(),
      category_id: form_data.category_id.trim(),
      unit_id: form_data.unit_id.trim(),
      vendor_id: form_data.vendor_id.trim(),
    };

    if (!is_valid_form()) {
      set_error_message("필수 항목을 확인해주세요. (품목ID/카테고리/품목명/단위/단가/거래처/유통기한)");
      return;
    }

    try {
      set_is_submitting(true);
      const payload = to_create_dto(trimmed);

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const j = await res.json();
            msg = j?.message
              ? Array.isArray(j.message) ? j.message.join(", ") : String(j.message)
              : msg;
          } else {
            const t = await res.text();
            if (t) msg = t;
          }
        } catch {}
        throw new Error(msg);
      }

      set_info_message("품목 등록이 완료되었습니다.");
      // 성공 후 초기화
      set_form_data({
        item_id: "",
        name: "",
        category_id: "",
        vendor_id: "",
        unit_id: "",
        unit_price: "",
        expiry_date: "",
      });
    } catch (err: any) {
      set_error_message(err?.message || "등록 중 오류가 발생했습니다.");
    } finally {
      set_is_submitting(false);
    }
  };

  // 로딩 중일 때만 비활성화. (실패/빈 배열이어도 입력은 가능, 유효성 검증이 막아줌)
  const is_select_disabled = is_loading_options;

  return (
    <form onSubmit={handle_submit} noValidate>
      {load_error && <div style={error_style}>목록 불러오기 오류: {load_error}</div>}
      {is_loading_options && <div style={{ marginBottom: 8 }}>목록 불러오는 중…</div>}
      {error_message && <div style={error_style}>{error_message}</div>}
      {info_message && <div style={info_style}>{info_message}</div>}

      <label htmlFor="item_id" style={label_style}>품목ID</label>
      <input
        id="item_id"
        name="item_id"
        type="text"
        value={form_data.item_id}
        onChange={handle_change}
        style={input_style}
        required
      />

      <label htmlFor="category_id" style={label_style}>카테고리</label>
      <select
        id="category_id"
        name="category_id"
        value={form_data.category_id}
        onChange={handle_change}
        style={input_style}
        required
        disabled={is_select_disabled}
      >
        <option value="">{is_loading_options ? "불러오는 중…" : (category_options.length ? "선택" : "목록 없음")}</option>
        {category_options.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.name}</option>
        ))}
      </select>

      <label htmlFor="name" style={label_style}>품목명</label>
      <input
        id="name"
        name="name"
        type="text"
        value={form_data.name}
        onChange={handle_change}
        style={input_style}
        required
      />

      <label htmlFor="unit_id" style={label_style}>단위</label>
      <select
        id="unit_id"
        name="unit_id"
        value={form_data.unit_id}
        onChange={handle_change}
        style={input_style}
        required
        disabled={is_select_disabled}
      >
        <option value="">{is_loading_options ? "불러오는 중…" : (unit_options.length ? "선택" : "목록 없음")}</option>
        {unit_options.map((u) => (
          <option key={u.id} value={String(u.id)}>{u.name}</option>
        ))}
      </select>

      <label htmlFor="unit_price" style={label_style}>단가</label>
      <input
        id="unit_price"
        name="unit_price"
        type="number"
        inputMode="numeric"
        step={1}
        min={0}
        value={form_data.unit_price}
        onChange={handle_change}
        style={input_style}
        required
      />

      <label htmlFor="expiry_date" style={label_style}>유통기한</label>
      <input
        id="expiry_date"
        name="expiry_date"
        type="date"
        value={form_data.expiry_date}
        onChange={handle_change}
        style={input_style}
        required
      />

      <label htmlFor="vendor_id" style={label_style}>거래처</label>
      <select
        id="vendor_id"
        name="vendor_id"
        value={form_data.vendor_id}
        onChange={handle_change}
        style={input_style}
        required
        disabled={is_select_disabled}
      >
        <option value="">{is_loading_options ? "불러오는 중…" : (vendor_options.length ? "선택" : "목록 없음")}</option>
        {vendor_options.map((v) => (
          <option key={v.id} value={String(v.id)}>{v.name}</option>
        ))}
      </select>

      <button type="submit" disabled={is_submitting || is_select_disabled}>
        {is_submitting ? "등록 중…" : "등록"}
      </button>
    </form>
  );
};

export default ItemRegisterForm;
