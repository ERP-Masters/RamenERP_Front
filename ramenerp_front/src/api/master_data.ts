// src/api/master_data.ts

import {
  fetch_vendors_options,
  fetch_items_summary,
  fetch_warehouses_summary,
} from "@/api/lookups";

/* ========= 타입 ========= */
export type VendorOption = {
  id: number; // 숫자 PK
  name: string;
  code?: string; // 표시용 코드가 필요할 때 대비
};

export type WarehouseOption = {
  id: number;
  name: string;
};

export type ItemOption = {
  id: number;
  name: string;
  unit_price?: number; // 단가(원) - 백엔드가 주면 그대로, 없으면 0 처리
  vendor_id?: number;
};

export type BranchOption = {
  id: number;
  name: string;
};

/* ========= 공통 유틸 ========= */
async function safe_fetch_json(url: string): Promise<any | null> {
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

function to_array(j: any): any[] {
  if (Array.isArray(j)) return j;
  if (Array.isArray(j?.items)) return j.items;
  if (Array.isArray(j?.data)) return j.data;
  return j ? [j] : [];
}

function as_num(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function as_name(...cands: any[]): string {
  for (const c of cands) {
    if (c === undefined || c === null) continue;
    const s = String(c).trim();
    if (s) return s;
  }
  return "";
}

/* ========= 거래처 목록 =========
 * ✅ 이제 /api/vendors 기반 단일 소스
 */
export async function fetch_vendors(): Promise<VendorOption[]> {
  const rows = await fetch_vendors_options();

  return rows
    .map((v) => ({
      id: v.id,
      name: v.name,
      code: v.code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko-KR"));
}

/* ========= 창고 목록 =========
 * ✅ /api/warehouses 단일 소스
 */
export async function fetch_warehouses(): Promise<WarehouseOption[]> {
  const rows = await fetch_warehouses_summary();

  return rows
    .map((w) => ({ id: w.id, name: w.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko-KR"));
}

/* ========= 품목 목록 =========
 * ✅ /api/items 단일 소스
 * - 단가는 백엔드가 내려주는 경우만 반영
 */
export async function fetch_items(): Promise<ItemOption[]> {
  const summary = await fetch_items_summary();

  // items_summary는 unit_price, vendor_id를 보장하지 않으므로
  // 필요 시 원본 /api/items에서 보강 시도
  const raw_json = await safe_fetch_json("/api/items");
  const raw_arr = to_array(raw_json);

  const raw_map = new Map<number, any>();
  for (const r of raw_arr) {
    const id_num = as_num(r?.id ?? r?.item_pk ?? r?.itemId);
    if (Number.isFinite(id_num)) raw_map.set(id_num, r);
  }

  const rows: ItemOption[] = summary
    .map((s) => {
      const id = as_num(s.id);
      if (!Number.isFinite(id)) return null;

      const raw = raw_map.get(id);

      const name =
        as_name(s.name, raw?.name, raw?.item_name, raw?.itemName) || "";

      if (!name) return null;

      const unit_price_raw =
        raw?.unit_price ?? raw?.price ?? raw?.base_price ?? raw?.cost ?? raw?.unitPrice;
      const unit_price_num = Number(unit_price_raw);
      const unit_price = Number.isFinite(unit_price_num) ? unit_price_num : 0;

      const vendor_raw =
        raw?.vendor_id ??
        raw?.vendorId ??
        raw?.vendor?.id ??
        raw?.vendor_pk ??
        raw?.vendor?.vendor_pk;
      const vendor_id_num = as_num(vendor_raw);
      const vendor_id = Number.isFinite(vendor_id_num) ? vendor_id_num : undefined;

      return { id, name, unit_price, vendor_id } as ItemOption;
    })
    .filter((x): x is ItemOption => !!x);

  return rows.sort((a, b) => a.name.localeCompare(b.name, "ko-KR"));
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
    row?.name ??
    row?.item_name ??
    row?.itemName ??
    row?.title ??
    row?.data?.name ??
    row?.data?.item_name;
  const s = name && String(name).trim();
  return s ? String(s) : undefined;
}

export async function fetch_item_name_by_id(id: number): Promise<string | undefined> {
  if (__item_name_cache.has(id)) return __item_name_cache.get(id);

  const candidates = [
    "/api/items",
    "/api/items/state?state=NOTUSED",
    "/api/items/state?isused=NOTUSED",
    "/api/items?state=NOTUSED",
    "/api/items?isused=NOTUSED",
  ];

  for (const url of candidates) {
    const j = await safe_fetch_json(url);
    if (!j) continue;
    const arr = to_array(j);
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
    if (Number.isFinite(it.id) && it.name) {
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
    "/api/items/state?state=NOTUSED",
    "/api/items/state?isused=NOTUSED",
    "/api/items?state=NOTUSED",
    "/api/items?isused=NOTUSED",
  ];

  for (const url of candidates) {
    const j = await safe_fetch_json(url);
    if (!j) continue;
    const arr = to_array(j);
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
    if (Number.isFinite(it.id) && typeof it.unit_price === "number") {
      __item_price_cache.set(it.id, it.unit_price);
    }
  }
}

/* ========= 지점 목록 =========
 * 기존 방식 유지 (백엔드 라우트 변동 대비)
 */
export async function fetch_branches(): Promise<BranchOption[]> {
  const primary_json = await safe_fetch_json("/api/branches");
  const fallback_json = primary_json ?? (await safe_fetch_json("/api/branch"));
  const arr = to_array(fallback_json);

  const temp: BranchOption[] = [];

  for (const row of arr) {
    const id_num = as_num(row.id ?? row.branch_id ?? row.branchId);
    const nm = as_name(row.name, row.branch_name, row.branchName, row.title);
    if (!Number.isFinite(id_num) || !nm) continue;
    temp.push({ id: id_num, name: nm });
  }

  const dedup = new Map<number, string>();
  for (const b of temp) {
    if (!dedup.has(b.id)) dedup.set(b.id, b.name);
  }

  return Array.from(dedup.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko-KR"));
}
