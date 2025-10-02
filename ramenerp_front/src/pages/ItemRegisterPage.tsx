// src/pages/ItemRegisterPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ItemRegisterForm, { ProductData } from "./ItemRegisterForm";

interface CreateProductDto {
  item_id: string;
  name: string;
  category_id: number;
  vendor_id: number;
  unit_id: number;
  unit_price: number;   // @IsInt
  expiry_date?: string; // "YYYY-MM-DD" 허용
}

const to_int = (value: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error("정수 필드에 잘못된 값이 있습니다.");
  }
  return n;
};

const to_create_dto = (data: ProductData): CreateProductDto => {
  return {
    item_id: data.item_id.trim(),
    name: data.name.trim(),
    category_id: to_int(data.category_id),
    vendor_id: to_int(data.vendor_id),
    unit_id: to_int(data.unit_id),
    unit_price: to_int(data.unit_price),
    // IsDateString은 "YYYY-MM-DD"도 통과. 값 없으면 undefined로 생략.
    expiry_date: data.expiry_date?.trim() || undefined,
  };
};

const ItemRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [is_submitting, set_is_submitting] = useState<boolean>(false);
  const [error_message, set_error_message] = useState<string>("");

  const handle_submit = async (data: ProductData) => {
    if (is_submitting) return;
    set_is_submitting(true);
    set_error_message("");

    try {
      const payload = to_create_dto(data);

      // 개발 중 CORS 우회: Vite devServer proxy(/api -> 백엔드) 사용
      const res = await fetch("/api/items", {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify(payload),
});

console.log("request to", res.url, "status", res.status);
const raw = await res.text(); // 404면 서버 메시지가 여기에 있을 수 있음
console.log("response body:", raw);


      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `HTTP ${res.status}`);
      }

      alert("품목 등록이 완료되었습니다.");
      navigate("/product/list");
    } catch (e: any) {
      set_error_message(e?.message || "등록 중 오류가 발생했습니다.");
    } finally {
      set_is_submitting(false);
    }
  };

  return (
    <div>
      <h1>품목 등록 페이지</h1>
      {error_message && (
        <div style={{ color: "crimson", marginBottom: 12 }}>{error_message}</div>
      )}
      <ItemRegisterForm onSubmit={handle_submit} />
      <button
        type="button"
        onClick={() => navigate("/product/list")}
        disabled={is_submitting}
        style={{ marginTop: 12 }}
      >
        목록으로
      </button>
    </div>
  );
};

export default ItemRegisterPage;
