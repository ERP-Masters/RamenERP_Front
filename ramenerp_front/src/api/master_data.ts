// src/api/master_data.ts

export type VendorOption = { id: number; name: string };
export type WarehouseOption = { id: number; name: string };
export type ItemOption = { id: number; name: string };

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

function toArray(j: any): any[] {
  if (Array.isArray(j)) return j;
  if (Array.isArray(j?.items)) return j.items;
  if (Array.isArray(j?.data)) return j.data;
  return j ? [j] : [];
}

function asNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function asName(...candidates: any[]): string {
  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    const s = String(c).trim();
    if (s) return s;
  }
  return "";
}

/* ======================================================
   거래처 목록
   단계:
   1) /api/vendors/summary -> [{ vendor_id: "VD_SEOUL_0001", name: "CJ 식품" }, ...]
   2) 각 vendor_id(코드)로 /api/vendors/:vendor_id -> 상세 조회
      여기서 숫자 PK(id 등)를 뽑아온다.
   최종 리턴: [{ id: 1, name: "CJ 식품" }, ...]
   이 id(숫자)가 바로 발주 API에 보내야 하는 vendor_id 값이 됨.
   ====================================================== */
export async function fetch_vendors(): Promise<VendorOption[]> {
  // 1) 요약 목록 가져오기
  const summaryJson = await safeFetchJSON("/api/vendors/summary");
  const summaryArr = toArray(summaryJson);

  // 안전장치: 요약 없으면 빈 배열
  if (!summaryArr.length) return [];

  // 2) 각 summary 항목별로 상세 조회해서 numeric id 매칭
  const detailPromises = summaryArr.map(async (row: any) => {
    const codeId = row.vendor_id ?? row.vendorId ?? row.code ?? row.id;
    const readableName = asName(row.name, row.vendor_name, row.vendorName);

    if (!codeId || !readableName) {
      return null;
    }

    // 상세 호출 (/api/vendors/:vendor_id)
    const detailJson = await safeFetchJSON(
      `/api/vendors/${encodeURIComponent(String(codeId))}`,
    );
    if (!detailJson) return null;

    // 상세에서 숫자 PK 후보 추출
    const numericIdCandidate =
      detailJson.id ??
      detailJson.pk ??
      detailJson.vendor_pk ??
      detailJson.vendor_pk_id ??
      detailJson.vendorIdNumeric ??
      detailJson.vendor_db_id ??
      detailJson.vendor_pkid ??
      detailJson.vendorId; // 혹시 숫자로도 내려올 수 있으니까 마지막에 한번 더 시도

    const numericId = asNum(numericIdCandidate);
    if (!Number.isFinite(numericId)) {
      // 숫자 PK를 못 찾으면 이 거래처는 발주에 쓸 수 없음 → 제외
      return null;
    }

    return {
      id: numericId,
      name: readableName,
    } as VendorOption;
  });

  const detailedList = await Promise.all(detailPromises);

  // null 제거 + 중복 제거
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

/* ======================================================
   창고 목록
   GET /api/warehouses -> [{ id or wh_id, name or warehouse_name ... }, ...]
   그대로 유지
   ====================================================== */
export async function fetch_warehouses(): Promise<WarehouseOption[]> {
  const j = await safeFetchJSON("/api/warehouses");
  const arr = toArray(j);

  return arr
    .map((row: any) => {
      const idRaw =
        row.id ??
        row.wh_id ??
        row.warehouse_id ??
        row.warehouseId;
      const idNum = asNum(idRaw);

      const nameStr = asName(
        row.name,
        row.wh_name,
        row.warehouse_name,
        row.whName,
        row.title,
      );

      if (!Number.isFinite(idNum)) return null;
      if (!nameStr) return null;

      return { id: idNum, name: nameStr } as WarehouseOption;
    })
    .filter(
      (w: WarehouseOption | null): w is WarehouseOption => w !== null,
    );
}

/* ======================================================
   품목 목록
   GET /api/items -> [{ id or item_pk, name or item_name ... }, ...]
   그대로 유지
   ====================================================== */
export async function fetch_items(): Promise<ItemOption[]> {
  const j = await safeFetchJSON("/api/items");
  const arr = toArray(j);

  return arr
    .map((row: any) => {
      const idRaw =
        row.id ??
        row.item_pk ??
        row.itemId ??
        row.item_pk_id;
      const idNum = asNum(idRaw);

      const nameStr = asName(
        row.name,
        row.item_name,
        row.itemName,
        row.title,
      );

      if (!Number.isFinite(idNum)) return null;
      if (!nameStr) return null;

      return { id: idNum, name: nameStr } as ItemOption;
    })
    .filter(
      (it: ItemOption | null): it is ItemOption => it !== null,
    );
}
