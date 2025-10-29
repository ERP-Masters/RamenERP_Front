// 주문 상태. 지금 백엔드 @IsEnum(OrderStatus) 기준으로
// PENDING / INPROGRESS / CANCELED 등 enum에서 오는 문자열을 받는다고 보면 된다.
export type OrderStatus =
  | "PENDING"
  | "INPROGRESS"
  | "CANCELED"
  | string;

// ▶ 발주 생성 요청 한 줄
//  - vendor_order_id 는 프론트에서 안보내. 서버가 generateVendorOrderId()로 만든다.
//  - status 는 안보내면 서버에서 PENDING 넣어준다.
export interface CreateVendorOrderLine {
  wh_id: number;
  vendor_id: number;
  item_id: number;
  quantity: number;
  status?: OrderStatus;
}

// ▶ 서버 응답 한 줄 (= VendorOrderEntity 형태 그대로)
//  - 주의: 여기에는 DB PK(id)도 없고 created_at도 없다.
//  - 즉, 목록만 봐서는 cancel/update용 :id 값을 모를 수 있음.
export interface VendorOrder {
  vendor_order_id: string;
  wh_id: number;
  vendor_id: number;
  item_id: number;
  quantity: number;
  status: OrderStatus;
}
