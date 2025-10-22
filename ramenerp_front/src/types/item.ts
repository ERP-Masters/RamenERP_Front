// src/types/item.ts
export type UseState = "USED" | "NOTUSED";

export interface ItemRow {
  id: number;               // 내부 PK
  item_id: string;          // 외부 코드 (예: IT_...)
  name: string;
  category_id: number;
  category_name?: string;
  unit_id: number;
  unit_name?: string;
  unit_price: number;
  expiry_date?: string;     // ISO
  vendor_id?: number;
  vendor_name?: string;
  isused?: UseState;        // 서버가 내려주면 사용
}
