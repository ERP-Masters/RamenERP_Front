// src/api/master_data.ts

// ========= 타입 =========
export type VendorOption = {
  id: number;   // 숫자 PK (발주 API에 vendor_id로 들어가는 값)
  name: string; // 표시용 이름 (예: "CJ 식품")
};

export type WarehouseOption = {
  id: number;   // 숫자 PK (발주 API에 wh_id로 들어가는 값)
  name: string; // 표시용 이름 (예: "서울", "인천" 등)
};

export type ItemOption = {
  id: number;         // 숫자 PK (발주 API에 item_id로 들어가는 값)
  name: string;       // 품목 이름
  unit_price?: number;// 단가(원)
  vendor_id?: number; // 이 품목의 거래처(숫자 PK). 필터링용
};


// ========= 공통 유틸 =========

async function safeFetchJSON(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

/**
 * 응답이 배열일 수도 있고 {items:[...]}일 수도 있고 {data:[...]}일 수도 있고, 단일 객체일 수도 있음
 */
function toArray(j: any): any[] {
  if (Array.isArray(j)) return j;
  if (Array.isArray(j?.items)) return j.items;
  if (Array.isArray(j?.data)) return j.data;
  return j ? [j] : [];
}

/** 숫자 변환 헬퍼 */
function asNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/** 문자열 후보들 중에서 가장 먼저 나오는 유효 문자열 */
function asName(...candidates: any[]): string {
  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    const s = String(c).trim();
    if (s) return s;
  }
  return "";
}


// ========= 거래처 목록 =========
//
// 1) /api/vendors/summary  (예: [{ vendor_id:"VD_SEOUL_0001", name:"CJ 식품" }, ...])
// 2) 각 vendor_id(코드)로 /api/vendors/:vendor_id 를 조회해서 숫자 PK(id 등)를 얻음
//    → 발주 API에 보낼 vendor_id는 숫자여야 하므로 여기서 매핑
//
// 최종: [{ id: 1, name: "CJ 식품" }, ...]
//
export async function fetch_vendors(): Promise<VendorOption[]> {
  // 1) 요약 호출
  const summaryJson = await safeFetchJSON("/api/vendors/summary");
  const summaryArr = toArray(summaryJson);

  if (!summaryArr.length) {
    return [];
  }

  // 2) 각 summary 항목으로 상세 조회 -> 숫자 PK 추출
  const detailPromises = summaryArr.map(async (row: any) => {
    // 코드형 ID (예: "VD_SEOUL_0001")
    const codeId =
      row.vendor_id ??
      row.vendorId ??
      row.code ??
      row.id;

    // 사람이 읽을 이름
    const readableName = asName(
      row.name,
      row.vendor_name,
      row.vendorName,
    );

    if (!codeId || !readableName) {
      return null;
    }

    // 상세 조회
    const detailJson = await safeFetchJSON(
      `/api/vendors/${encodeURIComponent(String(codeId))}`,
    );
    if (!detailJson) return null;

    // 상세에서 숫자 PK를 추출
    const numericIdCandidate =
      detailJson.id ??
      detailJson.pk ??
      detailJson.vendor_pk ??
      detailJson.vendor_pk_id ??
      detailJson.vendorIdNumeric ??
      detailJson.vendor_db_id ??
      detailJson.vendor_pkid ??
      detailJson.vendorId; // 혹시 숫자형일 수도 있으므로 마지막에 한 번 더

    const numericId = asNum(numericIdCandidate);
    if (!Number.isFinite(numericId)) {
      // 숫자 PK를 못 찾으면 스킵
      return null;
    }

    return {
      id: numericId,
      name: readableName,
    } as VendorOption;
  });

  const detailedList = await Promise.all(detailPromises);

  // null 제거 + id 중복 제거
  const resultMap = new Map<number, string>();
  for (const v of detailedList) {
    if (!v) continue;
    if (!resultMap.has(v.id)) {
      resultMap.set(v.id, v.name);
    }
  }

  return Array.from(resultMap.entries()).map(
    ([id, name]) => ({ id, name } as VendorOption),
  );
}


// ========= 창고 목록 =========
//
// GET /api/warehouses
// → [{ id or wh_id, name or warehouse_name, ... }, ...]
//
// 발주 API에는 wh_id가 숫자로 들어가야 하므로 여기서 숫자/이름만 뽑음.
//
export async function fetch_warehouses(): Promise<WarehouseOption[]> {
  const j = await safeFetchJSON("/api/warehouses");
  const arr = toArray(j);

  return arr
    .map((row: any) => {
      // 숫자 PK 후보
      const idRaw =
        row.id ??
        row.wh_id ??
        row.warehouse_id ??
        row.warehouseId;
      const idNum = asNum(idRaw);

      // 창고 이름 후보
      const nameStr = asName(
        row.name,
        row.wh_name,
        row.warehouse_name,
        row.whName,
        row.title,
      );

      if (!Number.isFinite(idNum)) return null;
      if (!nameStr) return null;

      return {
        id: idNum,
        name: nameStr,
      } as WarehouseOption;
    })
    .filter(
      (w: WarehouseOption | null): w is WarehouseOption => w !== null,
    );
}


// ========= 품목 목록 =========
//
// GET /api/items
// → 우리가 필요한 값:
//    - id (숫자 PK)         → 발주 payload에서 item_id로 사용
//    - name (표시용)
//    - unit_price (단가)    → 금액 계산
//    - vendor_id (숫자 PK)  → 거래처 선택 시 해당 거래처 품목만 필터링
//
// 백엔드 응답에서 단가/거래처가 다른 키로 올 수 있으므로 후보들을 다 훑어보고 매핑.
//
export async function fetch_items(): Promise<ItemOption[]> {
  const j = await safeFetchJSON("/api/items");
  const arr = toArray(j);

  return arr
    .map((row: any) => {
      // ---- 품목 PK 후보 ----
      const idRaw =
        row.id ??
        row.item_pk ??
        row.itemId ??
        row.item_pk_id;
      const idNum = asNum(idRaw);

      // ---- 품목 이름 후보 ----
      const nameStr = asName(
        row.name,
        row.item_name,
        row.itemName,
        row.title,
      );

      // ---- 단가 후보 ----
      const unitPriceRaw =
        row.unit_price ??
        row.price ??
        row.base_price ??
        row.cost ??
        row.unitPrice;
      const unitPriceNum = Number(unitPriceRaw);
      const safeUnitPrice = Number.isFinite(unitPriceNum)
        ? unitPriceNum
        : 0;

      // ---- 거래처(숫자 PK) 후보 ----
      //
      // 예:
      //   row.vendor_id === 1
      //   row.vendor?.id === 1
      //   row.vendor?.vendor_id === "VD_SEOUL_0001" (이건 코드일 수도 있음)
      //   row.vendor?.vendor_pk === 1
      //
      // 우선적으로 "숫자"로 보이는 값을 찾는다.
      //
      const vendIdRaw =
        row.vendor_id ??
        row.vendorId ??
        row.vendor_id_pk ??
        row.vendor_pk ??
        row.vendor?.id ??
        row.vendor?.vendor_pk ??
        row.vendor?.vendor_pk_id ??
        row.vendor?.vendorIdNumeric ??
        row.vendor?.vendor_db_id;

      const vendIdNum = asNum(vendIdRaw);
      const safeVendorId = Number.isFinite(vendIdNum)
        ? vendIdNum
        : undefined;

      if (!Number.isFinite(idNum)) return null;
      if (!nameStr) return null;

      return {
        id: idNum,
        name: nameStr,
        unit_price: safeUnitPrice,
        vendor_id: safeVendorId,
      } as ItemOption;
    })
    .filter(
      (it: ItemOption | null): it is ItemOption => it !== null,
    );
}
