// src/pages/ItemRegisterPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ItemRegisterForm, { ProductData } from "./ItemRegisterForm";

interface CreateProductDto {
  category_id: string;
  name: string;
  unit: string;
  unit_price: number;       // 서버로는 숫자 전송
  expiry_date?: string;     // ISO(YYYY-MM-DD 또는 YYYY-MM-DDT00:00:00Z 등)
  vendor_id: string;
}

const to_create_dto = (data: ProductData): CreateProductDto => {
  const unit_price_num = Number(data.unit_price);
  return {
    category_id: data.category_id.trim(),
    name: data.name.trim(),
    unit: data.unit.trim(),
    unit_price: Number.isFinite(unit_price_num) ? unit_price_num : 0,
    expiry_date: data.expiry_date?.trim() || undefined,
    vendor_id: data.vendor_id.trim(),
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
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `HTTP ${res.status}`);
      }

      // 성공 처리
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
      {error_message && <div style={{ color: "crimson", marginBottom: 12 }}>{error_message}</div>}
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
