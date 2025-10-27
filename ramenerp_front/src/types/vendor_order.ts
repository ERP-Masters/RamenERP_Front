// src/types/vendor_order.ts
// 👉 이 파일 하나로 모든 타입을 통일해 주세요.

export type VendorOrderStatus =
  | "PENDING"
  | "INPROGRESS"
  | "CANCELED"
  | "SHIPPING"
  | "PARTIALLY"
  | "COMPLETED";

// 호환용 별칭 (기존 코드에서 OrderStatus 사용)
export type OrderStatus = VendorOrderStatus;

export interface VendorOrder {
  vendor_order_id: string;
  wh_id: number;
  vendor_id: number;
  // 응답은 숫자/문자열 혼용 가능
  item_id: number | string;
  quantity: number;
  status: VendorOrderStatus;
}

// 생성 DTO: 백엔드가 item_id(string; 품목코드)를 요구
export interface CreateVendorOrderDto {
  vendor_order_id: string;   // 서버 생성용, 프론트는 "AUTO"로 넣음
  wh_id: number;
  vendor_id: number;
  item_id: string;           // 품목 코드 문자열
  quantity: number;
  status: VendorOrderStatus;
}

// ✅ 폼/클라이언트에서 쓰는 Payload: vendor_order_id 제외
export type CreateVendorOrderPayload = Omit<CreateVendorOrderDto, "vendor_order_id">;

export type VendorOrderQuery = {
  vendor_id?: number;
  status?: VendorOrderStatus;
  start?: string; // yyyy-mm-dd
  end?: string;   // yyyy-mm-dd
};

// 셀렉트 옵션용 타입들 (폼에서 사용 중)
export interface VendorOption {
  id: number;           // 내부 PK
  name: string;         // 표시명
  code?: string;        // 표시용 코드 (예: "VD_SEOUL_0001")
}

export interface WarehouseOption {
  id: number;           // 내부 PK
  name: string;
}

export interface ItemOption {
  id: number;           // 내부 PK(선택값)
  name?: string;        // 표시명
  // 서버의 item_id(문자열 코드). 프로젝트 일부 컴포넌트는 ext_item_id로 사용 중이라 둘 다 둡니다.
  item_id?: string;
  ext_item_id?: string;
}
