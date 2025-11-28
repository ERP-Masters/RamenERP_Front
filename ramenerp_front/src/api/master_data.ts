// src/api/master_data.ts

/* ========= 타입 ========= */
export type VendorOption = {
  id: number;          // 숫자 PK
  name: string;        // 표시용 이름
};

export type WarehouseOption = {
  id: number;          // 숫자 PK
  name: string;        // 표시용 이름
};

export type ItemOption = {
  id: number;          // 숫자 PK
  name: string;        // 품목명
  unit_price?: number; // 단가(원)
  vendor_id?: number;  // 이 품목의 거래처(숫자 PK)
};

export type BranchOption = {
  id: number;          // 숫자 PK
  name: string;        // 지점명
};

/* ========= 공통 유틸 ========= */
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

/** 응답이 배열/단일/래핑일 수 있어 통일해 배열로 변환 */
function toArray(j: any): any[] {
  if (Array.isArray(j)) return j;
  if (Array.isArray(j?.items)) return j.items;
  if (Array.isArray(j?.data)) return j.data;
  return j ? [j] : [];
}

/** 숫자 변환 */
function asNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/** 여러 후보 중 첫 유효 문자열 */
function asName(...cands: any[]): string {
  for (const c of cands) {
    if (c === undefined || c === null) continue;
    const s = String(c).trim();
    if (s) return s;
  }
  return "";
}

/* ========= 거래처 목록 =========
 * 1) /api/vendors/summary 로 코드/이름을 받고
 * 2) /api/vendors/:vendor_code 상세로 숫자 PK 매핑
 */
export async function fetch_vendors(): Promise<VendorOption[]> {
  const summary_json = await safeFetchJSON("/api/vendors/summary");
  const summary_arr = toArray(summary_json);
  if (!summary_arr.length) return [];

  const detail_promises = summary_arr.map(async (row: any) => {
    const code_id =
      row.vendor_id ?? row.vendorId ?? row.code ?? row.id;
    const readable = asName(row.name, row.vendor_name, row.vendorName);
    if (!code_id || !readable) return null;

    const d = await safeFetchJSON(`/api/vendors/${encodeURIComponent(String(code_id))}`);
    if (!d) return null;

    const num_raw =
      d.id ?? d.pk ?? d.vendor_pk ?? d.vendor_pk_id ??
      d.vendorIdNumeric ?? d.vendor_db_id ?? d.vendorId;
    const num_id = asNum(num_raw);
    if (!Number.isFinite(num_id)) return null;

    return { id: num_id, name: readable } as VendorOption;
  });

  const detailed = await Promise.all(detail_promises);
  const dedup = new Map<number, string>();
  for (const v of detailed) {
    if (!v) continue;
    if (!dedup.has(v.id)) dedup.set(v.id, v.name);
  }
  return Array.from(dedup.entries()).map(([id, name]) => ({ id, name }));
}

/* ========= 창고 목록 ========= */
export async function fetch_warehouses(): Promise<WarehouseOption[]> {
  const j = await safeFetchJSON("/api/warehouses");
  const arr = toArray(j);

  return arr
    .map((row: any) => {
      const id_num = asNum(row.id ?? row.wh_id ?? row.warehouse_id ?? row.warehouseId);
      const nm = asName(row.name, row.wh_name, row.warehouse_name, row.whName, row.title);
      if (!Number.isFinite(id_num) || !nm) return null;
      return { id: id_num, name: nm } as WarehouseOption;
    })
    .filter((w): w is WarehouseOption => !!w);
}

/* ========= 품목 목록 (단가 포함) ========= */
export async function fetch_items(): Promise<ItemOption[]> {
  const j = await safeFetchJSON("/api/items");
  const arr = toArray(j);

  return arr
    .map((row: any) => {
      const id_num = asNum(row.id ?? row.item_pk ?? row.itemId ?? row.item_pk_id);
      const nm = asName(row.name, row.item_name, row.itemName, row.title);

      const unit_price_raw =
        row.unit_price ?? row.price ?? row.base_price ?? row.cost ?? row.unitPrice;
      const unit_price_num = Number(unit_price_raw);
      const unit_price = Number.isFinite(unit_price_num) ? unit_price_num : 0;

      const vend_raw =
        row.vendor_id ?? row.vendorId ?? row.vendor_id_pk ?? row.vendor_pk ??
        row.vendor?.id ?? row.vendor?.vendor_pk ?? row.vendor?.vendor_pk_id ??
        row.vendor?.vendorIdNumeric ?? row.vendor?.vendor_db_id;
      const vendor_id = asNum(vend_raw);
      const safe_vendor_id = Number.isFinite(vendor_id) ? vendor_id : undefined;

      if (!Number.isFinite(id_num) || !nm) return null;
      return { id: id_num, name: nm, unit_price, vendor_id: safe_vendor_id } as ItemOption;
    })
    .filter((it): it is ItemOption => !!it);
}

/* ========= 품목명 보강/캐시 ========= */
const __item_name_cache = new Map<number, string>();

function pick_item_id(row: any): number | undefined {
  const cand = row?.id ?? row?.item_pk ?? row?.itemPk ?? row?.item_pk_id ?? row?.itemId;
  const n = Number(cand);
  return Number.isFinite(n) ? n : undefined;
}

function pick_item_name(row: any): string | undefined {
  const name =
    row?.name ?? row?.item_name ?? row?.itemName ?? row?.title ??
    row?.data?.name ?? row?.data?.item_name;
  const s = name && String(name).trim();
  return s ? String(s) : undefined;
}

export async function fetch_item_name_by_id(id: number): Promise<string | undefined> {
  if (__item_name_cache.has(id)) return __item_name_cache.get(id);

  const candidates = [
    "/api/items",
    "/api/items/state?isused=NOTUSED",
    "/api/items?state=NOTUSED",
    "/api/items?isused=NOTUSED",
  ];

  for (const url of candidates) {
    const j = await safeFetchJSON(url);
    if (!j) continue;
    const arr = toArray(j);
    for (const row of arr) {
      const row_id = pick_item_id(row);
      if (row_id !== id) continue;
      const nm = pick_item_name(row);
      if (nm) {
        __item_name_cache.set(id, nm);
        return nm;
      }
    }
  }
  return undefined;
}

export function prime_item_name_cache(items: ItemOption[]) {
  for (const it of items) {
    if (Number.isFinite(it.id as any) && it.name) {
      __item_name_cache.set(it.id, it.name);
    }
  }
}

/* ========= 품목 단가 보강/캐시 ========= */
const __item_price_cache = new Map<number, number>();

function pick_item_price(row: any): number | undefined {
  const raw =
    row?.unit_price ??
    row?.price ??
    row?.base_price ??
    row?.cost ??
    row?.unitPrice;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export async function fetch_item_price_by_id(id: number): Promise<number | undefined> {
  if (__item_price_cache.has(id)) return __item_price_cache.get(id);

  const candidates = [
    "/api/items",
    "/api/items/state?isused=NOTUSED",
    "/api/items?state=NOTUSED",
    "/api/items?isused=NOTUSED",
  ];

  for (const url of candidates) {
    const j = await safeFetchJSON(url);
    if (!j) continue;
    const arr = toArray(j);
    for (const row of arr) {
      const row_id = pick_item_id(row);
      if (row_id !== id) continue;
      const price = pick_item_price(row);
      if (price !== undefined) {
        __item_price_cache.set(id, price);
        return price;
      }
    }
  }
  return undefined;
}

export function prime_item_price_cache(items: ItemOption[]) {
  for (const it of items) {
    if (
      Number.isFinite(it.id as any) &&
      typeof it.unit_price === "number"
    ) {
      __item_price_cache.set(it.id, it.unit_price);
    }
  }
}

/* ========= 지점(브랜치) 목록 =========
 * /api/branches 또는 /api/branch 둘 중 하나만 있어도 동작
 */
export async function fetch_branches(): Promise<BranchOption[]> {
  // 1순위: /api/branches, 실패 시 /api/branch 사용
  const primary_json = await safeFetchJSON("/api/branches");
  const fallback_json = primary_json ?? (await safeFetchJSON("/api/branch"));
  const arr = toArray(fallback_json);

  const temp: BranchOption[] = [];

  for (const row of arr) {
    const id_num = asNum(row.id ?? row.branch_id ?? row.branchId);
    const nm = asName(row.name, row.branch_name, row.branchName, row.title);

    if (!Number.isFinite(id_num) || !nm) continue;

    temp.push({ id: id_num, name: nm });
  }

  // id 중복 제거 + 이름순 정렬
  const dedup = new Map<number, string>();
  for (const b of temp) {
    if (!dedup.has(b.id)) {
      dedup.set(b.id, b.name);
    }
  }

  return Array.from(dedup.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko-KR"));
}
