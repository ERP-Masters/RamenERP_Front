import React, { useEffect, useState } from "react";

interface IdNameOption { id: number; name: string; }
interface ProductData {
  item_id: string;
  name: string;
  category_id: string;
  vendor_id: string;
  unit_id: string;
  unit_price: string;
  expiry_date: string; // yyyy-mm-dd
}
interface CreateItemDto {
  item_id: string;
  name: string;
  category_id: number;
  vendor_id: number;
  unit_id: number;
  unit_price: number;
  expiry_date: string;
}

type ItemRegisterFormProps = {
  on_success?: () => void;
  on_cancel?: () => void;
};

const ui_tok = {
  gap: 12,
  gap_lg: 16,
  radius: 10,
  border: "#e5e7eb",
  text_muted: "#6b7280",
  text: "#111827",
  primary_bg: "#0ea5e9",
  primary_border: "#0284c7",
  primary_text: "#fff",
} as const;

const grid_2_style = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: ui_tok.gap_lg,
} as const;
const section_style = { display: "flex", flexDirection: "column" as const, gap: 6 } as const;
const label_style = { fontSize: 13, color: ui_tok.text_muted, fontWeight: 600 } as const;
const input_style = {
  display: "block", width: "100%", padding: "10px 12px",
  borderRadius: ui_tok.radius, border: `1px solid ${ui_tok.border}`, outline: "none",
} as const;
const select_style = input_style;
const num_style = { ...input_style, textAlign: "right" } as const;
const help_style = { color: ui_tok.text_muted, fontSize: 12 } as const;
const error_style = { color: "#c62828", fontSize: 12, marginTop: 6 } as const;
const info_style = { color: "#2e7d32", fontSize: 12, marginTop: 6 } as const;
const toolbar_style = { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 } as const;
const primary_button_style = {
  padding: "10px 14px", borderRadius: ui_tok.radius,
  background: ui_tok.primary_bg, border: `1px solid ${ui_tok.primary_border}`,
  color: ui_tok.primary_text, fontWeight: 700, cursor: "pointer",
} as const;
const ghost_button_style = {
  padding: "10px 14px", borderRadius: ui_tok.radius,
  background: "transparent", border: `1px solid ${ui_tok.border}`,
  color: "#111827", fontWeight: 600, cursor: "pointer",
} as const;
const subtle_note_style = { marginTop: 6, fontSize: 11, color: ui_tok.text_muted } as const;

const ItemRegisterForm: React.FC<ItemRegisterFormProps> = ({ on_success, on_cancel }) => {
  const [form_data, set_form_data] = useState<ProductData>({
    item_id: "", name: "", category_id: "", vendor_id: "", unit_id: "", unit_price: "", expiry_date: "",
  });

  const [category_options, set_category_options] = useState<IdNameOption[]>([]);
  const [vendor_options, set_vendor_options] = useState<IdNameOption[]>([]);
  const [unit_options, set_unit_options] = useState<IdNameOption[]>([]);
  const [is_loading_options, set_is_loading_options] = useState<boolean>(false);
  const [load_error, set_load_error] = useState<string | null>(null);

  const [is_submitting, set_is_submitting] = useState<boolean>(false);
  const [error_message, set_error_message] = useState<string>("");
  const [info_message, set_info_message] = useState<string>("");

  const to_int = (value: string): number => {
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error("정수 필드에 잘못된 값이 있습니다.");
    return n;
  };

  const normalize_option = (raw: any, type: "category" | "unit" | "vendor"): IdNameOption => {
    switch (type) {
      case "category":
        return { id: Number(raw.id ?? raw.category_id), name: String(raw.group ?? raw.name ?? raw.category_name) };
      case "unit":
        return { id: Number(raw.id ?? raw.unit_id), name: String(raw.code ?? raw.name ?? raw.unit_name ?? raw.code) };
      case "vendor":
        return { id: Number(raw.id ?? raw.vendor_id), name: String(raw.name ?? raw.vendor_name) };
    }
  };

  const fetch_json = async <T,>(url: string, signal?: AbortSignal): Promise<T> => {
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  };

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
    const price_num = Number(form_data.unit_price);
    if (!Number.isFinite(price_num) || !Number.isInteger(price_num) || price_num < 0) return false;
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
    expiry_date: data.expiry_date.trim(),
  });

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    (async () => {
      set_is_loading_options(true);
      set_load_error(null);
      try {
        const [cats_raw, vendors_raw, units_raw] = await Promise.all([
          fetch_json<any>("/api/category", signal),
          fetch_json<any>("/api/vendors", signal),
          fetch_json<any>("/api/units", signal),
        ]);
        const cats = to_array(cats_raw).map((c) => normalize_option(c, "category")).filter((o) => Number.isFinite(o.id) && !!o.name);
        const vendors = to_array(vendors_raw).map((v) => normalize_option(v, "vendor")).filter((o) => Number.isFinite(o.id) && !!o.name);
        const units = to_array(units_raw).map((u) => normalize_option(u, "unit")).filter((o) => Number.isFinite(o.id) && !!o.name);
        set_category_options(cats);
        set_vendor_options(vendors);
        set_unit_options(units);
      } catch (err: any) {
        if (err?.name !== "AbortError") set_load_error(err?.message || "옵션 목록을 불러오지 못했습니다.");
      } finally {
        set_is_loading_options(false);
      }
    })();
    return () => ac.abort();
  }, []);

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
            msg = j?.message ? (Array.isArray(j.message) ? j.message.join(", ") : String(j.message)) : msg;
          } else {
            const t = await res.text();
            if (t) msg = t;
          }
        } catch {}
        throw new Error(msg);
      }

      set_info_message("품목 등록이 완료되었습니다.");
      set_form_data({ item_id: "", name: "", category_id: "", vendor_id: "", unit_id: "", unit_price: "", expiry_date: "" });
      if (on_success) on_success();
    } catch (err: any) {
      set_error_message(err?.message || "등록 중 오류가 발생했습니다.");
    } finally {
      set_is_submitting(false);
    }
  };

  const is_select_disabled = is_loading_options;

  return (
    <form onSubmit={handle_submit} noValidate>
      {load_error && <div style={error_style}>목록 불러오기 오류: {load_error}</div>}
      {is_loading_options && <div style={help_style}>목록 불러오는 중…</div>}
      {error_message && <div style={error_style}>{error_message}</div>}
      {info_message && <div style={info_style}>{info_message}</div>}

      <div style={{ marginTop: 8, marginBottom: 12 }}>
        <div style={{ ...help_style, fontWeight: 700, color: ui_tok.text }}>기본 정보</div>
        <div style={grid_2_style}>
          <div style={section_style}>
            <label htmlFor="item_id" style={label_style}>품목ID</label>
            <input id="item_id" name="item_id" type="text" value={form_data.item_id} onChange={handle_change} style={input_style} required />
            <div style={subtle_note_style}>예: ITEM_001</div>
          </div>

          <div style={section_style}>
            <label htmlFor="name" style={label_style}>품목명</label>
            <input id="name" name="name" type="text" value={form_data.name} onChange={handle_change} style={input_style} required />
          </div>

          <div style={section_style}>
            <label htmlFor="category_id" style={label_style}>카테고리</label>
            <select id="category_id" name="category_id" value={form_data.category_id} onChange={handle_change} style={select_style} required disabled={is_select_disabled}>
              <option value="">{is_loading_options ? "불러오는 중…" : (category_options.length ? "선택" : "목록 없음")}</option>
              {category_options.map((c) => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
            </select>
          </div>

          <div style={section_style}>
            <label htmlFor="vendor_id" style={label_style}>거래처</label>
            <select id="vendor_id" name="vendor_id" value={form_data.vendor_id} onChange={handle_change} style={select_style} required disabled={is_select_disabled}>
              <option value="">{is_loading_options ? "불러오는 중…" : (vendor_options.length ? "선택" : "목록 없음")}</option>
              {vendor_options.map((v) => (<option key={v.id} value={String(v.id)}>{v.name}</option>))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ ...help_style, fontWeight: 700, color: ui_tok.text }}>규격 / 가격 / 유통기한</div>
        <div style={grid_2_style}>
          <div style={section_style}>
            <label htmlFor="unit_id" style={label_style}>단위</label>
            <select id="unit_id" name="unit_id" value={form_data.unit_id} onChange={handle_change} style={select_style} required disabled={is_select_disabled}>
              <option value="">{is_loading_options ? "불러오는 중…" : (unit_options.length ? "선택" : "목록 없음")}</option>
              {unit_options.map((u) => (<option key={u.id} value={String(u.id)}>{u.name}</option>))}
            </select>
          </div>

          <div style={section_style}>
            <label htmlFor="unit_price" style={label_style}>단가(원)</label>
            <input id="unit_price" name="unit_price" type="number" inputMode="numeric" step={1} min={0} value={form_data.unit_price} onChange={handle_change} style={num_style} required />
            <div style={subtle_note_style}>정수만 입력 가능</div>
          </div>

          <div style={section_style}>
            <label htmlFor="expiry_date" style={label_style}>유통기한</label>
            <input id="expiry_date" name="expiry_date" type="date" value={form_data.expiry_date} onChange={handle_change} style={input_style} required />
          </div>

          <div />
        </div>
      </div>

      <div style={toolbar_style}>
        {on_cancel && (
          <button type="button" onClick={on_cancel} disabled={is_submitting} style={ghost_button_style}>
            취소
          </button>
        )}
        <button type="submit" disabled={is_submitting || is_select_disabled} style={primary_button_style}>
          {is_submitting ? "등록 중…" : "등록"}
        </button>
      </div>
    </form>
  );
};

export default ItemRegisterForm;
