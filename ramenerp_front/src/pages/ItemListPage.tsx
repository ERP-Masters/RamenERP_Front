// src/pages/ItemListPage.tsx
import React, { useEffect, useState } from "react";

// NOTE: ProductData 경로가 실제로는 "pages/ItemRegisterForm"가 아닐 수 있으니
// 공용 타입은 src/types/product.ts 등으로 분리하는 걸 권장합니다.
export interface ProductRow {
  id: number;
  category_id: string;
  category_name?: string;
  name: string;
  unit: string;            // 예: "KG", "EA"
  unit_price: number;      // 숫자 보장
  expiry_date?: string;    // ISO 문자열
  vendor_id?: string;
  vendor_name?: string;
  is_active?: boolean;     // boolean이면 접두어는 is_
}

const table_style = { width: "100%", borderCollapse: "collapse" } as const;
const th_td_style = { borderBottom: "1px solid #ddd", padding: "8px", textAlign: "left" } as const;
const empty_cell_style = { textAlign: "center", padding: "16px" } as const;

function format_currency(value: number) {
  // 원화 표기(간단). 더 정교하게 하려면 Intl.NumberFormat 사용.
  return new Intl.NumberFormat("ko-KR").format(value);
}

function format_date(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const ItemListPage: React.FC = () => {
  const [products, set_products] = useState<ProductRow[]>([]);
  const [is_loading, set_is_loading] = useState<boolean>(false);
  const [error_message, set_error_message] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    const fetch_products = async () => {
      set_is_loading(true);
      set_error_message("");
      try {
        const res = await fetch("/api/products?include=vendor,category", {
          signal: controller.signal,
          headers: { "Accept": "application/json" }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `HTTP ${res.status}`);
        }
        const data: ProductRow[] = await res.json();
        // 서버에서 unit_price가 문자열로 올 수 있으니 숫자 보장
        const normalized = data.map((p) => ({
          ...p,
          unit_price: typeof p.unit_price === "string" ? Number(p.unit_price) : p.unit_price
        }));
        set_products(normalized);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          set_error_message(e.message || "목록 조회 중 오류가 발생했습니다.");
        }
      } finally {
        set_is_loading(false);
      }
    };
    fetch_products();
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
            <tr key={p.id}>
              <td style={th_td_style}>{p.id}</td>
              <td style={th_td_style}>{p.category_id}</td>
              <td style={th_td_style}>{p.category_name ?? ""}</td>
              <td style={th_td_style}>{p.name}</td>
              <td style={th_td_style}>{p.unit}</td>
              <td style={th_td_style}>{format_currency(p.unit_price)}</td>
              <td style={th_td_style}>{format_date(p.expiry_date)}</td>
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
