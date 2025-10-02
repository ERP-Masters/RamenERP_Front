// src/pages/ItemRegisterForm.tsx
import React, { useState } from "react";

export interface ProductData {
  item_id: String
  name: string;
  category_id: string;
  vendor_id: string;
  unit_id: string;
  unit_price: string;   // 폼 단계에선 문자열
  expiry_date: string;  // yyyy-mm-dd
}

interface ItemRegisterFormProps {
  onSubmit: (data: ProductData) => void;
}

const unit_options = ["팩", "통", "판(계란)", "KG", "BOX", "CAN"] as const;
const category_options = [
  { category_id: "C001", category_name: "육류" },
  { category_id: "C002", category_name: "해산물" },
  { category_id: "C003", category_name: "면류" },
] as const;
const vendor_options = [
  { vendor_id: "V001", name: "CJ 제일제당" },
  { vendor_id: "V002", name: "농협" },
  { vendor_id: "V003", name: "지역 납품업체" },
] as const;

const input_style = { display: "block", marginBottom: 12 } as const;
const label_style = { display: "block", marginTop: 8, marginBottom: 4 } as const;
const error_style = { color: "crimson", fontSize: 12, marginTop: 4 } as const;

const ItemRegisterForm: React.FC<ItemRegisterFormProps> = ({ onSubmit }) => {
  const [form_data, set_form_data] = useState<ProductData>({
    item_id: "",
    name: "",
    category_id: "",
    vendor_id: "",
    unit_id: "",       // ← 변경
    unit_price: "",
    expiry_date: "",
  });

  const [error_message, set_error_message] = useState<string>("");

  const handle_change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    set_form_data((prev) => ({ ...prev, [name]: value }));
  };

  const is_valid_date = (value: string): boolean => {
    if (!value) return false;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp);
  };

  const is_valid_form = (): boolean => {
    if (!form_data.category_id) return false;
    if (!form_data.name.trim()) return false;
    if (!form_data.unit_id) return false;

    // 가격: 양의 숫자
    const price_num = Number(form_data.unit_price);
    if (!Number.isFinite(price_num) || price_num < 0) return false;

    // 날짜: 형식 검증 (옵션필드면 비어있어도 통과)
    if (form_data.expiry_date && !is_valid_date(form_data.expiry_date)) return false;

    if (!form_data.vendor_id) return false;
    return true;
  };

  const handle_submit = (e: React.FormEvent) => {
    e.preventDefault();
    set_error_message("");

    // 트리밍
    const trimmed: ProductData = {
      ...form_data,
      category_id: form_data.category_id.trim(),
      name: form_data.name.trim(),
      unit_id: form_data.unit_id.trim(),
      unit_price: form_data.unit_price.trim(),
      expiry_date: form_data.expiry_date.trim(),
      vendor_id: form_data.vendor_id.trim(),
    };

    set_form_data(trimmed);

    if (!is_valid_form()) {
      set_error_message("필수 항목을 확인해주세요. (카테고리/품목명/단위/단가/거래처, 날짜 형식)");
      return;
    }

    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handle_submit} noValidate>
      <label htmlFor="category_id" style={label_style}>카테고리</label>
      <select
        id="category_id"
        name="category_id"
        value={form_data.category_id}
        onChange={handle_change}
        style={input_style}
        required
      >
        <option value="">선택</option>
        {category_options.map((c) => (
          <option key={c.category_id} value={c.category_id}>
            {c.category_name}
          </option>
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

      <label htmlFor="unit" style={label_style}>단위</label>
      <select
        id="unit"
        name="unit"
        value={form_data.unit_id}
        onChange={handle_change}
        style={input_style}
        required
      >
        <option value="">선택</option>
        {unit_options.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>

      <label htmlFor="unit_price" style={label_style}>단가</label>
      <input
        id="unit_price"
        name="unit_price"
        type="number"
        inputMode="numeric"
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
      />

      <label htmlFor="vendor_id" style={label_style}>거래처</label>
      <select
        id="vendor_id"
        name="vendor_id"
        value={form_data.vendor_id}
        onChange={handle_change}
        style={input_style}
        required
      >
        <option value="">선택</option>
        {vendor_options.map((v) => (
          <option key={v.vendor_id} value={v.vendor_id}>
            {v.name}
          </option>
        ))}
      </select>

      {error_message && <div style={error_style}>{error_message}</div>}

      <button type="submit">등록</button>
    </form>
  );
};

export default ItemRegisterForm;
