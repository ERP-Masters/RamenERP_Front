// src/pages/ItemRegisterForm.tsx
import React from "react";

type UseState = "USED" | "NOTUSED";
type Option = { id: string; name: string; extra?: string; numId?: number }; // ← 숫자 ID 보관

type Props = { on_success?: () => void; on_cancel?: () => void };

const ui = {
  border: "#e5e7eb",
  input: { padding: 8, borderRadius: 8, border: "1px solid #e5e7eb", width: 320 } as React.CSSProperties,
  field: { display: "grid", gap: 6, marginBottom: 8 } as React.CSSProperties,
};

async function fetch_json(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    try { const j = text ? JSON.parse(text) : null; throw new Error(j?.message || j?.error || text || `HTTP ${res.status}`); }
    catch { throw new Error(text || `HTTP ${res.status}`); }
  }
  return text ? JSON.parse(text) : null;
}

/** 공통 옵션 정규화: id는 문자열 유지, 가능한 경우 numId(숫자 ID)도 채움 */
function normalize_options(
  raw: any[],
  idKeys: string[],
  nameKeys: string[],
  extraKeys?: string[],
  numericIdKeys: string[] = ["id", "pk", "vendor_pk", "category_pk", "unit_pk"]
): Option[] {
  const out: Option[] = [];
  for (const r of raw ?? []) {
    const idVal = idKeys.map((k) => r?.[k]).find((v) => v !== undefined && v !== null);
    const nameVal = nameKeys.map((k) => r?.[k]).find((v) => v !== undefined && v !== null);
    if (idVal === undefined || nameVal === undefined) continue;
    const extraVal = extraKeys?.map((k) => r?.[k]).find((v) => v !== undefined && v !== null);
    const numericRaw = numericIdKeys.map((k) => r?.[k]).find((v) => typeof v === "number" && Number.isFinite(v));
    out.push({
      id: String(idVal), // 문자열 유지(VD_코드 같은 것도 허용)
      name: String(nameVal),
      extra: extraVal != null ? String(extraVal) : undefined,
      numId: typeof numericRaw === "number" ? numericRaw : undefined,
    });
  }
  return out;
}

/** 카테고리/단위/거래처 옵션 로더 — 여러 엔드포인트를 순차 시도 */
async function fetch_category_options(): Promise<Option[]> {
  const candidates = ["/api/category", "/api/categories", "/api/categories/options"];
  for (const url of candidates) {
    try {
      const raw = await fetch_json(url);
      const arr = Array.isArray(raw) ? raw : raw?.items ?? [];
      const opts = normalize_options(arr, ["id", "category_id"], ["category_name", "name"]);
      if (opts.length) return opts;
    } catch {}
  }
  return [];
}

async function fetch_unit_options(): Promise<Option[]> {
  const candidates = ["/api/units", "/api/unit", "/api/units/options"];
  for (const url of candidates) {
    try {
      const raw = await fetch_json(url);
      const arr = Array.isArray(raw) ? raw : raw?.items ?? [];
      const opts = normalize_options(arr, ["id", "unit_id"], ["name", "unit_name", "code"], ["code"]);
      if (opts.length) return opts;
    } catch {}
  }
  return [];
}

async function fetch_vendor_options(): Promise<Option[]> {
  // 숫자 id를 얻기 위해 상세 엔드포인트를 먼저 시도
  const candidates = [
    "/api/vendors",          // ← 상세(숫자 id 있을 확률 높음)
    "/api/vendors/summary",
    "/api/vendors/options",
  ];
  for (const url of candidates) {
    try {
      const raw = await fetch_json(url);
      const arr = Array.isArray(raw) ? raw : raw?.items ?? [];
      const opts = normalize_options(
        arr,
        ["id", "vendor_id"],      // id: 문자열(VD_코드 포함)
        ["name", "vendor_name"],  // 표시명
        undefined,
        ["id", "vendor_pk", "pk"] // 숫자 id 후보 키
      );
      if (opts.length) return opts;
    } catch {}
  }
  return [];
}

const isDigits = (s: unknown) => typeof s === "string" && /^\d+$/.test(s);
const isValidDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

const ItemRegisterForm: React.FC<Props> = ({ on_success, on_cancel }) => {
  // 상태는 문자열로 관리
  const [category_id, set_category_id] = React.useState<string>("");
  const [name, set_name] = React.useState("");
  const [unit_id, set_unit_id] = React.useState<string>("");
  const [unit_price, set_unit_price] = React.useState<string>("");
  const [expiry_date, set_expiry_date] = React.useState("");
  const [vendor_id, set_vendor_id] = React.useState<string>("");
  const [isused, set_isused] = React.useState<UseState>("USED");

  const [category_opts, set_category_opts] = React.useState<Option[]>([]);
  const [unit_opts, set_unit_opts] = React.useState<Option[]>([]);
  const [vendor_opts, set_vendor_opts] = React.useState<Option[]>([]);

  const [loading, set_loading] = React.useState(false);
  const [saving, set_saving] = React.useState(false);
  const [error, set_error] = React.useState("");
  const [field_errors, set_field_errors] = React.useState<string[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      set_loading(true);
      set_error(""); set_field_errors([]);
      try {
        const [cats, units, vends] = await Promise.all([
          fetch_category_options(),
          fetch_unit_options(),
          fetch_vendor_options(),
        ]);
        if (!alive) return;
        set_category_opts(cats.sort((a,b)=>a.name.localeCompare(b.name,"ko")));
        set_unit_opts(units.sort((a,b)=>(a.extra??a.name).localeCompare(b.extra??b.name,"ko")));
        set_vendor_opts(vends.sort((a,b)=>a.name.localeCompare(b.name,"ko")));
      } catch (e: any) {
        if (!alive) return;
        set_error(e?.message || "옵션 로드 실패");
      } finally {
        if (alive) set_loading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const validate = () => {
    const errs: string[] = [];

    if (category_opts.length === 0) errs.push("카테고리 목록이 비어있습니다. 먼저 카테고리를 등록하세요.");
    if (!category_id) errs.push("카테고리를 선택하세요.");

    if (!name.trim()) errs.push("품목명을 입력하세요.");

    const priceNum = Number(unit_price);
    if (!Number.isFinite(priceNum) || priceNum < 0) errs.push("단가는 0 이상 숫자로 입력하세요.");

    if (unit_opts.length === 0) errs.push("단위 목록이 비어있습니다. 먼저 단위를 등록하세요.");
    if (!unit_id) errs.push("단위를 선택하세요.");

    if (!isValidDate(expiry_date)) errs.push("유통기한을 선택하세요.");

    if (vendor_opts.length === 0) {
      errs.push("거래처 목록이 비어있습니다. 먼저 거래처를 등록하세요.");
    } else if (!vendor_id) {
      errs.push("거래처를 선택하세요.");
    } else {
      // 숫자 id 확보 가능 여부를 미리 점검
      const chosen = vendor_opts.find(v => v.id === vendor_id);
      const numeric = chosen?.numId ?? (isDigits(vendor_id) ? Number(vendor_id) : NaN);
      if (!Number.isFinite(numeric)) {
        errs.push("선택한 거래처에 숫자 ID가 없습니다. 백엔드에서 'id(숫자)'를 함께 내려주도록 수정이 필요합니다.");
      }
    }

    if (isused !== "USED" && isused !== "NOTUSED") errs.push("사용 상태를 선택하세요.");

    set_field_errors(errs);
    return errs.length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_error(""); set_field_errors([]);
    if (!validate()) return;

    const chosenVendor = vendor_opts.find(v => v.id === vendor_id);
    const vendor_id_num = chosenVendor?.numId ?? (isDigits(vendor_id) ? Number(vendor_id) : NaN);
    if (!Number.isFinite(vendor_id_num)) {
      set_field_errors(["선택한 거래처에 숫자 ID가 없습니다. 백엔드가 숫자 id를 함께 내려주거나 /api/vendors 같은 상세 엔드포인트를 사용해주세요."]);
      return;
    }

    const chosenCat = category_opts.find(c => c.id === category_id);
    const category_id_num = chosenCat?.numId ?? (isDigits(category_id) ? Number(category_id) : Number(category_id));
    const chosenUnit = unit_opts.find(u => u.id === unit_id);
    const unit_id_num = chosenUnit?.numId ?? (isDigits(unit_id) ? Number(unit_id) : Number(unit_id));

    const payload = {
      category_id: Number(category_id_num),
      name: String(name.trim()),
      unit_id: Number(unit_id_num),
      unit_price: Number(unit_price),
      expiry_date: String(expiry_date),
      vendor_id: Number(vendor_id_num),
      isused: isused as UseState,
    };

    set_saving(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        try { const j = text ? JSON.parse(text) : null; throw new Error(j?.message || j?.error || text || `HTTP ${res.status}`); }
        catch { throw new Error(text || `HTTP ${res.status}`); }
      }
      on_success?.();
    } catch (err: any) {
      set_error(err?.message || "등록 실패");
    } finally {
      set_saving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
      <label style={ui.field}>
        <span>카테고리 *</span>
        <select
          value={category_id}
          onChange={(e) => set_category_id(e.target.value)}
          style={{ ...ui.input, width: 360 }}
          required
          disabled={loading || category_opts.length === 0}
        >
          <option value="">선택</option>
          {category_opts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <label style={ui.field}>
        <span>품목명 *</span>
        <input
          value={name}
          onChange={(e) => set_name(e.target.value)}
          style={ui.input}
          placeholder="예: 생면"
          required
        />
      </label>

      <label style={ui.field}>
        <span>단위 *</span>
        <select
          value={unit_id}
          onChange={(e) => set_unit_id(e.target.value)}
          style={{ ...ui.input, width: 360 }}
          required
          disabled={loading || unit_opts.length === 0}
        >
          <option value="">선택</option>
          {unit_opts.map((u) => (
            <option key={u.id} value={u.id}>
              {u.extra ? `${u.extra} (${u.name})` : u.name}
            </option>
          ))}
        </select>
      </label>

      <label style={ui.field}>
        <span>단가(원) *</span>
        <input
          type="number"
          min={0}
          value={unit_price}
          onChange={(e) => set_unit_price(e.target.value)}
          style={ui.input}
          required
        />
      </label>

      <label style={ui.field}>
        <span>유통기한 *</span>
        <input
          type="date"
          value={expiry_date}
          onChange={(e) => set_expiry_date(e.target.value)}
          style={ui.input}
          required
        />
      </label>

      <label style={ui.field}>
        <span>거래처 *</span>
        <select
          value={vendor_id}
          onChange={(e) => set_vendor_id(e.target.value)}
          style={{ ...ui.input, width: 360 }}
          required
          disabled={loading || vendor_opts.length === 0}
        >
          <option value="">선택</option>
          {vendor_opts.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </label>

      <label style={ui.field}>
        <span>사용 상태 *</span>
        <select
          value={isused}
          onChange={(e) => set_isused(e.target.value as UseState)}
          style={{ ...ui.input, width: 200 }}
          required
        >
          <option value="USED">USED</option>
          <option value="NOTUSED">NOTUSED</option>
        </select>
      </label>

      {field_errors.length > 0 && (
        <div style={{ color: "#c62828" }}>
          {field_errors.map((m, i) => <div key={i}>• {m}</div>)}
        </div>
      )}
      {error && <div style={{ color: "#c62828" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="submit" disabled={saving || loading} style={{ padding: "8px 12px" }}>
          {saving ? "저장 중..." : "등록"}
        </button>
        <button type="button" onClick={() => on_cancel?.()} style={{ padding: "8px 12px" }}>
          취소
        </button>
      </div>
    </form>
  );
};

export default ItemRegisterForm;
