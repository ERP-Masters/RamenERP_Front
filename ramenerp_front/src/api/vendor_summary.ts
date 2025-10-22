// src/api/vendor_summary.ts
export type VendorOpt = { id: string; name: string };

const norm = (v: unknown): string => {
  const s = String(v ?? "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? String(n) : s;
};

// "VD_SEOUL_0001" 같은 코드형 판별 (대충 VD_ 로 시작하면 코드형으로 간주)
const is_code_like = (id: string) => /^VD[_-]/i.test(id) || /[A-Z]+_/.test(id);

const by_name = (a: VendorOpt, b: VendorOpt) => a.name.localeCompare(b.name, "ko");

/** 안전 fetch(JSON). 실패/비정상은 null */
async function safeJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

/** 상대 URL 후보들을 절대 URL(예: http://localhost:3000)로도 확장 */
function expandCandidates(paths: string[]): string[] {
  const absBase = "http://localhost:3000";
  const out: string[] = [];
  for (const p of paths) {
    out.push(p);
    if (p.startsWith("/")) out.push(absBase + p);
  }
  return out;
}

/** /api/vendors/summary -> 옵션 목록(요약 없으면 /api/vendors 또는 /api/vendor도 시도) */
export async function fetch_vendor_options(): Promise<VendorOpt[]> {
  let j = await safeJson("/api/vendors/summary");
  if (!j) j = await safeJson("/api/vendors");
  if (!j) j = await safeJson("/api/vendor"); // 단수 라우트일 수도

  const arr: unknown[] = Array.isArray(j) ? j : j?.items ?? [];
  const opts: VendorOpt[] = (arr as any[])
    .map((v) => {
      const id = norm(v?.vendor_id ?? v?.id ?? v?.pk);
      const name = String(v?.name ?? v?.vendor_name ?? v?.title ?? "").trim();
      if (!id || !name) return null;
      return { id, name } as VendorOpt;
    })
    .filter((x: VendorOpt | null): x is VendorOpt => x !== null)
    .sort(by_name);

  return opts;
}

/** 단건 이름 조회: 코드형이면 `/vendors/:code`, 숫자형이면 기존 후보 + 절대경로 폴백까지 */
export async function fetch_vendor_name_by_id(idRaw: string): Promise<string | null> {
  const id = norm(idRaw);
  const eid = encodeURIComponent(id);

  // 1) 코드형(VD_SEOUL_0001 등) 우선 시도
  const codeCandidates = is_code_like(id) ? [
    `/vendors/${eid}`,              // 백엔드가 직접 노출되는 라우트
    `/api/vendors/${eid}`,          // 프록시 붙인 경로
  ] : [];

  // 2) 숫자형/일반형 후보
  const numericCandidates = [
    `/api/vendors/${eid}`,
    `/api/vendor/${eid}`,
    `/api/vendors?id=${eid}`,
    `/api/vendor?id=${eid}`,
    `/vendors/${eid}`,              // 혹시 숫자도 지원한다면
  ];

  const candidates = expandCandidates([...codeCandidates, ...numericCandidates]);

  for (const url of candidates) {
    const j = await safeJson(url);
    if (!j) continue;

    // 응답의 다양한 형태를 흡수
    const row = Array.isArray(j) ? j[0] : (j?.items?.[0] ?? j);
    const name =
      String(row?.name ?? row?.vendor_name ?? row?.title ?? "").trim();
    if (name) return name;
  }
  return null;
}
