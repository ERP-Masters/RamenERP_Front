// src/pages/ItemRegisterForm.tsx
import React from "react";

type UseState = "USED" | "NOTUSED";
type Option = { id: string; name: string; extra?: string; numId?: number };

type Props = { on_success?: () => void; on_cancel?: () => void };

const COLOR = {
  border: "#d1d5db",
  borderLight: "#e5e7eb",
  textLabel: "#374151",
  textBody: "#111827",
  danger: "#c62828",
  cardBg: "#f9fafb",
  primaryBg: "#0ea5e9",
  primaryBd: "#0284c7",
  primaryTx: "#fff",
  arrow: "#6b7280",
} as const;

const CONTROL_H = 32;

const ui = {
  card: {
    width: "100%",
    maxWidth: 720,
    background: COLOR.cardBg,
    border: `1px solid ${COLOR.borderLight}`,
    borderRadius: 10,
    display: "grid",
    gridTemplateColumns: "1fr",
  } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    columnGap: 16,
    rowGap: 12,
    padding: 16,
    paddingBottom: 12,
  } as React.CSSProperties,

  field: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  } as React.CSSProperties,

  labelRow: {
    fontSize: 12,
    fontWeight: 600,
    color: COLOR.textLabel,
    lineHeight: 1.4,
    marginBottom: 4,
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,

  reqMark: {
    color: COLOR.primaryBd,
    fontWeight: 700,
    marginLeft: 4,
    fontSize: 12,
    lineHeight: 1,
  } as React.CSSProperties,

  ctrlWrap: {
    width: "66%",
    minWidth: 0,
  } as React.CSSProperties,

  ctrlBox: {
    position: "relative",
    height: CONTROL_H,
    width: "100%",
    borderRadius: 6,
    border: `1px solid ${COLOR.border}`,
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    padding: "0 8px",
  } as React.CSSProperties,

  ctrlBoxSelect: {
    position: "relative",
    height: CONTROL_H,
    width: "100%",
    borderRadius: 6,
    border: `1px solid ${COLOR.border}`,
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    padding: "0 28px 0 8px",
  } as React.CSSProperties,

  arrow: {
    position: "absolute" as const,
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 10,
    lineHeight: 1,
    color: COLOR.arrow,
    pointerEvents: "none" as const,
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif",
  },

  ctrlInputEl: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    border: 0,
    outline: "none",
    background: "transparent",
    fontSize: 13,
    lineHeight: 1.4,
    color: COLOR.textBody,
    height: "100%",
    padding: 0,
  } as React.CSSProperties,

  ctrlSelectEl: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    border: 0,
    outline: "none",
    background: "transparent",
    fontSize: 13,
    lineHeight: 1.4,
    color: COLOR.textBody,
    height: "100%",
    padding: 0,
    WebkitAppearance: "none" as const,
    MozAppearance: "none" as const,
    appearance: "none" as const,
  } as React.CSSProperties,

  errorBox: {
    gridColumn: "1 / -1",
    fontSize: 12,
    lineHeight: 1.5,
    color: COLOR.danger,
    background: "#fff",
    borderRadius: 6,
    border: `1px solid ${COLOR.danger}`,
    padding: "8px 10px",
  } as React.CSSProperties,

  footer: {
    borderTop: `1px solid ${COLOR.borderLight}`,
    background: COLOR.cardBg,
    padding: "10px 16px 12px",
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    borderRadius: "0 0 10px 10px",
  } as React.CSSProperties,

  btnPrimary: {
    minWidth: 70,
    height: CONTROL_H,
    borderRadius: 6,
    border: `1px solid ${COLOR.primaryBd}`,
    background: COLOR.primaryBg,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.3,
    color: COLOR.primaryTx,
    cursor: "pointer",
    padding: "0 10px",
  } as React.CSSProperties,

  btnGhost: {
    minWidth: 60,
    height: CONTROL_H,
    borderRadius: 6,
    border: `1px solid ${COLOR.border}`,
    background: "#fff",
    fontSize: 13,
    lineHeight: 1.3,
    color: COLOR.textBody,
    cursor: "pointer",
    padding: "0 10px",
  } as React.CSSProperties,
};

/* fetch utils / option normalize 그대로 */
async function fetch_json(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    try {
      const j = text ? JSON.parse(text) : null;
      throw new Error(
        j?.message || j?.error || text || `HTTP ${res.status}`,
      );
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }
  return text ? JSON.parse(text) : null;
}

function normalize_options(
  raw: any[],
  id_keys: string[],
  name_keys: string[],
  extra_keys?: string[],
  numeric_id_keys: string[] = [
    "id",
    "pk",
    "vendor_pk",
    "category_pk",
    "unit_pk",
  ],
): Option[] {
  const out: Option[] = [];
  for (const r of raw ?? []) {
    const id_val = id_keys
      .map((k) => r?.[k])
      .find((v) => v !== undefined && v !== null);
    const name_val = name_keys
      .map((k) => r?.[k])
      .find((v) => v !== undefined && v !== null);
    if (id_val === undefined || name_val === undefined) continue;
    const extra_val = extra_keys
      ?.map((k) => r?.[k])
      .find((v) => v !== undefined && v !== null);
    const numeric_raw = numeric_id_keys
      .map((k) => r?.[k])
      .find((v) => typeof v === "number" && Number.isFinite(v));
    out.push({
      id: String(id_val),
      name: String(name_val),
      extra: extra_val != null ? String(extra_val) : undefined,
      numId:
        typeof numeric_raw === "number"
          ? numeric_raw
          : undefined,
    });
  }
  return out;
}

async function fetch_category_options(): Promise<Option[]> {
  const candidates = [
    "/api/category",
    "/api/categories",
    "/api/categories/options",
  ];
  for (const url of candidates) {
    try {
      const raw = await fetch_json(url);
      const arr = Array.isArray(raw) ? raw : raw?.items ?? [];
      const opts = normalize_options(
        arr,
        ["id", "category_id"],
        ["category_name", "name"],
      );
      if (opts.length) return opts;
    } catch {}
  }
  return [];
}

async function fetch_unit_options(): Promise<Option[]> {
  const candidates = [
    "/api/units",
    "/api/unit",
    "/api/units/options",
  ];
  for (const url of candidates) {
    try {
      const raw = await fetch_json(url);
      const arr = Array.isArray(raw) ? raw : raw?.items ?? [];
      const opts = normalize_options(
        arr,
        ["id", "unit_id"],
        ["name", "unit_name", "code"],
        ["code"],
      );
      if (opts.length) return opts;
    } catch {}
  }
  return [];
}

async function fetch_vendor_options(): Promise<Option[]> {
  const candidates = [
    "/api/vendors",
    "/api/vendors/summary",
    "/api/vendors/options",
  ];
  for (const url of candidates) {
    try {
      const raw = await fetch_json(url);
      const arr = Array.isArray(raw) ? raw : raw?.items ?? [];
      const opts = normalize_options(
        arr,
        ["id", "vendor_id"],
        ["name", "vendor_name"],
        undefined,
        ["id", "vendor_pk", "pk"],
      );
      if (opts.length) return opts;
    } catch {}
  }
  return [];
}

const is_digits = (s: unknown) =>
  typeof s === "string" && /^\d+$/.test(s);

const ItemRegisterForm: React.FC<Props> = ({
  on_success,
  on_cancel,
}) => {
  const [category_id, set_category_id] =
    React.useState<string>("");
  const [name, set_name] = React.useState("");
  const [unit_id, set_unit_id] =
    React.useState<string>("");
  const [unit_price, set_unit_price] =
    React.useState<string>("");
  const [vendor_id, set_vendor_id] =
    React.useState<string>("");

  const [category_opts, set_category_opts] =
    React.useState<Option[]>([]);
  const [unit_opts, set_unit_opts] = React.useState<Option[]>(
    [],
  );
  const [vendor_opts, set_vendor_opts] =
    React.useState<Option[]>([]);

  const [loading, set_loading] =
    React.useState(false);
  const [saving, set_saving] = React.useState(false);
  const [error, set_error] = React.useState("");
  const [field_errors, set_field_errors] =
    React.useState<string[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      set_loading(true);
      set_error("");
      set_field_errors([]);
      try {
        const [cats, units, vends] =
          await Promise.all([
            fetch_category_options(),
            fetch_unit_options(),
            fetch_vendor_options(),
          ]);
        if (!alive) return;
        set_category_opts(
          cats.sort((a, b) =>
            a.name.localeCompare(b.name, "ko"),
          ),
        );
        set_unit_opts(
          units.sort((a, b) =>
            (a.extra ?? a.name).localeCompare(
              b.extra ?? b.name,
              "ko",
            ),
          ),
        );
        set_vendor_opts(
          vends.sort((a, b) =>
            a.name.localeCompare(b.name, "ko"),
          ),
        );
      } catch (e: any) {
        if (!alive) return;
        set_error(e?.message || "옵션 로드 실패");
      } finally {
        if (alive) set_loading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const validate = () => {
    const errs: string[] = [];

    if (category_opts.length === 0)
      errs.push(
        "카테고리 목록이 비어있습니다. 먼저 카테고리를 등록하세요.",
      );
    if (!category_id) errs.push("카테고리를 선택하세요.");

    if (!name.trim()) errs.push("품목명을 입력하세요.");

    const price_num = Number(unit_price);
    if (
      !Number.isFinite(price_num) ||
      price_num < 0
    ) {
      errs.push(
        "단가는 0 이상 숫자로 입력하세요.",
      );
    }

    if (unit_opts.length === 0)
      errs.push(
        "단위 목록이 비어있습니다. 먼저 단위를 등록하세요.",
      );
    if (!unit_id) errs.push("단위를 선택하세요.");

    if (vendor_opts.length === 0) {
      errs.push(
        "거래처 목록이 비어있습니다. 먼저 거래처를 등록하세요.",
      );
    } else if (!vendor_id) {
      errs.push("거래처를 선택하세요.");
    } else {
      const chosen = vendor_opts.find(
        (v) => v.id === vendor_id,
      );
      const numeric =
        chosen?.numId ??
        (is_digits(vendor_id)
          ? Number(vendor_id)
          : NaN);
      if (!Number.isFinite(numeric)) {
        errs.push(
          "선택한 거래처에 숫자 ID가 없습니다. 백엔드에서 'id(숫자)'를 함께 내려주도록 수정이 필요합니다.",
        );
      }
    }

    set_field_errors(errs);
    return errs.length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!window.confirm("등록하시겠습니까?")) {
      return;
    }

    set_error("");
    set_field_errors([]);
    if (!validate()) return;

    const chosen_vendor = vendor_opts.find(
      (v) => v.id === vendor_id,
    );
    const vendor_id_num =
      chosen_vendor?.numId ??
      (is_digits(vendor_id)
        ? Number(vendor_id)
        : NaN);
    if (!Number.isFinite(vendor_id_num)) {
      set_field_errors([
        "선택한 거래처에 숫자 ID가 없습니다. 백엔드가 숫자 id를 함께 내려주거나 /api/vendors 같은 상세 엔드포인트를 사용해주세요.",
      ]);
      return;
    }

    const chosen_cat = category_opts.find(
      (c) => c.id === category_id,
    );
    const category_id_num =
      chosen_cat?.numId ??
      (is_digits(category_id)
        ? Number(category_id)
        : Number(category_id));
    const chosen_unit = unit_opts.find(
      (u) => u.id === unit_id,
    );
    const unit_id_num =
      chosen_unit?.numId ??
      (is_digits(unit_id)
        ? Number(unit_id)
        : Number(unit_id));

    const DEFAULT_EXPIRY_DATE = "2099-12-31";

    const payload = {
      category_id: Number(category_id_num),
      name: String(name.trim()),
      unit_id: Number(unit_id_num),
      unit_price: Number(unit_price),
      vendor_id: Number(vendor_id_num),
      isused: "USED" as UseState,
      expiry_date: DEFAULT_EXPIRY_DATE,
    };

    set_saving(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        try {
          const j = text ? JSON.parse(text) : null;
          throw new Error(
            j?.message ||
              j?.error ||
              text ||
              `HTTP ${res.status}`,
          );
        } catch {
          throw new Error(
            text || `HTTP ${res.status}`,
          );
        }
      }
      on_success?.();
    } catch (err: any) {
      set_error(err?.message || "등록 실패");
    } finally {
      set_saving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: 720,
        width: "100%",
      }}
    >
      <div style={ui.card}>
        <div style={ui.grid}>
          {/* 카테고리 */}
          <div style={ui.field}>
            <div style={ui.labelRow}>
              <span>카테고리</span>
              <span style={ui.reqMark}>*</span>
            </div>
            <div style={ui.ctrlWrap}>
              <div style={ui.ctrlBoxSelect}>
                <select
                  value={category_id}
                  onChange={(e) =>
                    set_category_id(
                      e.target.value,
                    )
                  }
                  style={ui.ctrlSelectEl}
                  required
                  disabled={
                    loading ||
                    category_opts.length ===
                      0
                  }
                >
                  <option value="">
                    선택
                  </option>
                  {category_opts.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
                <span style={ui.arrow}>
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* 품목명 */}
          <div style={ui.field}>
            <div style={ui.labelRow}>
              <span>품목명</span>
              <span style={ui.reqMark}>*</span>
            </div>
            <div style={ui.ctrlWrap}>
              <div style={ui.ctrlBox}>
                <input
                  value={name}
                  onChange={(e) =>
                    set_name(
                      e.target.value,
                    )
                  }
                  style={ui.ctrlInputEl}
                  placeholder="예: 생면"
                  required
                />
              </div>
            </div>
          </div>

          {/* 단위 */}
          <div style={ui.field}>
            <div style={ui.labelRow}>
              <span>단위</span>
              <span style={ui.reqMark}>*</span>
            </div>
            <div style={ui.ctrlWrap}>
              <div style={ui.ctrlBoxSelect}>
                <select
                  value={unit_id}
                  onChange={(e) =>
                    set_unit_id(
                      e.target.value,
                    )
                  }
                  style={ui.ctrlSelectEl}
                  required
                  disabled={
                    loading ||
                    unit_opts.length === 0
                  }
                >
                  <option value="">
                    선택
                  </option>
                  {unit_opts.map((u) => (
                    <option
                      key={u.id}
                      value={u.id}
                    >
                      {u.extra
                        ? `${u.extra} (${u.name})`
                        : u.name}
                    </option>
                  ))}
                </select>
                <span style={ui.arrow}>
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* 단가(원) */}
          <div style={ui.field}>
            <div style={ui.labelRow}>
              <span>단가(원)</span>
              <span style={ui.reqMark}>*</span>
            </div>
            <div style={ui.ctrlWrap}>
              <div style={ui.ctrlBox}>
                <input
                  type="number"
                  min={0}
                  value={unit_price}
                  onChange={(e) =>
                    set_unit_price(
                      e.target.value,
                    )
                  }
                  style={{
                    ...ui.ctrlInputEl,
                    textAlign: "right",
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* 거래처 */}
          <div style={ui.field}>
            <div style={ui.labelRow}>
              <span>거래처</span>
              <span style={ui.reqMark}>*</span>
            </div>
            <div style={ui.ctrlWrap}>
              <div style={ui.ctrlBoxSelect}>
                <select
                  value={vendor_id}
                  onChange={(e) =>
                    set_vendor_id(
                      e.target.value,
                    )
                  }
                  style={ui.ctrlSelectEl}
                  required
                  disabled={
                    loading ||
                    vendor_opts.length === 0
                  }
                >
                  <option value="">
                    선택
                  </option>
                  {vendor_opts.map((v) => (
                    <option
                      key={v.id}
                      value={v.id}
                    >
                      {v.name}
                    </option>
                  ))}
                </select>
                <span style={ui.arrow}>
                  ▼
                </span>
              </div>
            </div>
          </div>

          {(field_errors.length > 0 ||
            error) && (
            <div style={ui.errorBox}>
              {field_errors.map((m, i) => (
                <div key={i}>
                  • {m}
                </div>
              ))}
              {error && (
                <div>• {error}</div>
              )}
            </div>
          )}
        </div>

        <div style={ui.footer}>
          <button
            type="submit"
            disabled={saving || loading}
            style={ui.btnPrimary}
          >
            {saving
              ? "저장 중..."
              : "등록"}
          </button>
          <button
            type="button"
            onClick={() => on_cancel?.()}
            style={ui.btnGhost}
          >
            취소
          </button>
        </div>
      </div>
    </form>
  );
};

export default ItemRegisterForm;
