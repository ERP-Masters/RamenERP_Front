// src/pages/ItemNotUsedListPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { change_item_use_state } from "@/api/items";
import { fetch_vendors, type VendorOption } from "@/api/master_data";
import { useNavigate } from "react-router-dom";

type Row = {
  id: number; // DB PK
  item_id: string;
  name: string;
  category_id: string;
  unit_id: string;
  unit_price: number;
  expiry_date?: string | null;
  isused?: string | boolean | null;
  vendor_id?: string;
  vendor_name?: string;
};

type CategoryOpt = { id: string; code?: string; name: string };
type UnitOpt = { id: string; code: string; name: string };
type VendorOpt = { id: string; name: string };

const USED_ROUTE = "/items";

const ui = {
  border: "#e5e7eb",
  zebra: "#fafafa",
  muted: "#6b7280",
  danger: "#c62828",
  warn: "#ef6c00",
} as const;

const page = { padding: 16, maxWidth: 1200, margin: "0 auto" } as const;
const title = { fontSize: 22, fontWeight: 800, marginBottom: 12 } as const;

const twrap = {
  overflowX: "auto",
  border: `1px solid ${ui.border}`,
  borderRadius: 10,
} as const;
const table = {
  width: "100%",
  borderCollapse: "separate" as const,
  borderSpacing: 0,
} as const;
const th = {
  position: "sticky" as const,
  top: 0,
  background: "#f8fafc",
  borderBottom: `1px solid ${ui.border}`,
  padding: "10px 8px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  fontSize: 13,
  fontWeight: 700,
} as const;
const td = {
  borderBottom: `1px solid ${ui.border}`,
  padding: "9px 8px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
  fontSize: 14,
} as const;
const act = {
  padding: "6px 10px",
  borderRadius: 8,
  border: `1px solid ${ui.border}`,
  background: "#fff",
  cursor: "pointer",
} as const;

const norm = (v: unknown): string => {
  const s = String(v ?? "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? String(n) : s;
};

const yyyy_mm_dd = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const money = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

async function safeJson(url: string) {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

const toArray = (j: any): any[] => (Array.isArray(j) ? j : j?.items ?? j?.data ?? []);

const ItemNotUsedListPage: React.FC = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [catOpt, setCatOpt] = useState<CategoryOpt[]>([]);
  const [unitOpt, setUnitOpt] = useState<UnitOpt[]>([]);
  const [venOpt, setVenOpt] = useState<VendorOpt[]>([]);

  const catNameById = useMemo(() => {
    const m = new Map<string, string>();
    catOpt.forEach((c: CategoryOpt) => m.set(c.id, c.name));
    return m;
  }, [catOpt]);

  const unitCodeById = useMemo(() => {
    const m = new Map<string, string>();
    unitOpt.forEach((u: UnitOpt) => m.set(u.id, u.code));
    return m;
  }, [unitOpt]);

  const venNameById = useMemo(() => {
    const m = new Map<string, string>();
    venOpt.forEach((v: VendorOpt) => m.set(v.id, v.name));
    return m;
  }, [venOpt]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError("");

      try {
        // 미사용 품목 불러오기
        const listJson =
          (await safeJson("/items/state?isused=NOTUSED")) ??
          (await safeJson("/api/items/state?isused=NOTUSED"));
        if (listJson === null) throw new Error("미사용 품목 목록 호출 실패");

        const src = toArray(listJson);

        // 마스터 데이터
        const [catsJ, unitsJ, vendorsRaw] = await Promise.all([
          safeJson("/api/category") ?? safeJson("/category"),
          safeJson("/api/units") ?? safeJson("/units"),
          fetch_vendors(),
        ]);

        const cats: CategoryOpt[] = toArray(catsJ)
          .map(
            (c: any): CategoryOpt => ({
              id: norm(c?.id ?? c?.category_id ?? ""),
              code: String(c?.code ?? c?.category_code ?? c?.group ?? "").trim(),
              name: String(c?.name ?? c?.category_name ?? c?.title ?? "").trim(),
            })
          )
          .filter((c: CategoryOpt) => c.id && c.name)
          .sort((a, b) => a.name.localeCompare(b.name, "ko"));

        const units: UnitOpt[] = toArray(unitsJ)
          .map(
            (u: any): UnitOpt => ({
              id: norm(u?.id ?? u?.unit_id ?? ""),
              code: String(u?.code ?? u?.unit_code ?? u?.name ?? "").trim(),
              name: String(u?.name ?? u?.unit_name ?? u?.code ?? "").trim(),
            })
          )
          .filter((u: UnitOpt) => u.id && u.code);

        const vendors: VendorOpt[] = (vendorsRaw || []).map((v: VendorOption) => ({
          id: String(v.id),
          name: v.name ?? `거래처#${v.id}`,
        }));

        const venMap = new Map<string, string>(vendors.map((v) => [v.id, v.name]));

        const normalized: Row[] = src.map((r: any): Row => {
          const vendor_id_raw =
            r.vendor_id !== undefined ? r.vendor_id : r.vendor?.id ?? r.vendor?.vendor_id;
          const vendor_id =
            vendor_id_raw !== undefined ? norm(vendor_id_raw) : undefined;

          const row: Row = {
            id: Number(r.id ?? r.item_pk ?? 0),
            item_id: String(
              r.item_id ??
                r.code ??
                r.sku ??
                r.erp_code ??
                r.itemCode ??
                ""
            ),
            name: String(r.name ?? r.item_name ?? ""),
            category_id: norm(
              r.category_id ??
                r.category?.id ??
                r.category?.category_id ??
                r.categoryId
            ),
            unit_id: norm(
              r.unit_id ??
                r.unit?.id ??
                r.unit?.unit_id ??
                r.unitId
            ),
            unit_price: Number(r.unit_price ?? r.price ?? 0) || 0,
            expiry_date:
              r.expiry_date ??
              r.expiration_date ??
              r.expireDate ??
              null,
            isused: r.isused ?? null,
            vendor_id,
            vendor_name:
              r.vendor_name ??
              r.vendor?.vendor_name ??
              r.vendor?.name ??
              (vendor_id ? venMap.get(vendor_id) : undefined),
          };

          return row;
        });

        setRows(normalized);
        setCatOpt(cats);
        setUnitOpt(units);
        setVenOpt(vendors);
      } catch (e: any) {
        setError(e?.message || "목록 조회 실패");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const onUse = async (r: Row) => {
    if (!r?.id) {
      alert("내부 ID가 없습니다.");
      return;
    }
    if (!window.confirm(`'${r.item_id} - ${r.name}'을(를) 사용 전환할까요?`)) return;

    try {
      await change_item_use_state(Number(r.id), "USED");
      navigate(USED_ROUTE);
    } catch (e: any) {
      alert(e?.message || "사용 전환 실패");
    }
  };

  return (
    <div style={page}>
      <h1 style={title}>미사용 품목 리스트</h1>

      {loading && (
        <div style={{ color: ui.muted, marginBottom: 8 }}>불러오는 중…</div>
      )}
      {error && (
        <div style={{ color: "#c62828", marginBottom: 8 }}>{error}</div>
      )}

      <div style={twrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>품목 ID</th>
              <th style={th}>품목명</th>
              <th style={th}>카테고리명</th>
              <th style={th}>단위</th>
              <th style={th}>단가(원)</th>
              <th style={th}>유통기한</th>
              <th style={th}>거래처명</th>
              <th
                style={{
                  ...th,
                  textAlign: "right" as const,
                }}
              >
                관리
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r: Row, idx: number) => {
              const bg = idx % 2 === 1 ? { background: ui.zebra } : undefined;

              return (
                <tr key={r.id} style={bg}>
                  <td style={td}>{r.item_id}</td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{catNameById.get(r.category_id) ?? ""}</td>
                  <td style={td}>{unitCodeById.get(r.unit_id) ?? ""}</td>
                  <td style={td}>{money(r.unit_price)}</td>
                  <td style={td}>{yyyy_mm_dd(r.expiry_date ?? undefined)}</td>
                  <td style={td}>
                    {r.vendor_name ??
                      (r.vendor_id ? venNameById.get(r.vendor_id) : "")}
                  </td>
                  <td
                    style={{
                      ...td,
                      textAlign: "right",
                    }}
                  >
                    <button
                      type="button"
                      style={act}
                      onClick={() => onUse(r)}
                    >
                      사용 전환
                    </button>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && !loading && !error && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    padding: 18,
                    color: ui.muted,
                  }}
                >
                  등록된 품목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemNotUsedListPage;
