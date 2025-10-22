import React, { useEffect, useState } from "react";

export type CategoryEditTarget = {
  category_id: number;               // 요청은 숫자 ID
  group: string;
  category_name: string;
};

type ApiCategory = {
  category_id: number | string;      // 서버가 문자열 반환할 수도 있어서 유연하게
  group: string;
  category_name: string;
  is_active?: boolean | null;
};

type Props = {
  open: boolean;
  target: CategoryEditTarget | null;
  onClose: () => void;
  onSaved: (updated: ApiCategory) => void;
};

const GROUP_OPTIONS = [
  "MEAT","SEAFOOD","NOODLES","VEGETABLES","DAIRY","EGGS","PROCESSED","SAUCE","BROTH_SOUP",
] as const;

/* ===== UI ===== */
const overlay_style: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modal_style: React.CSSProperties = { width: 420, background: "#fff", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,.25)", padding: 16, boxSizing: "border-box" };
const field_wrap: React.CSSProperties = { display: "grid", gridTemplateRows: "auto auto", rowGap: 6, marginBottom: 12 };
const label_block: React.CSSProperties = { fontWeight: 600, whiteSpace: "nowrap" };
const control_block: React.CSSProperties = { width: "100%", padding: "6px 8px", boxSizing: "border-box" };
const actions_row: React.CSSProperties = { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 };

const CategoryEditPage: React.FC<Props> = ({ open, target, onClose, onSaved }) => {
  const [group, set_group] = useState<string>("");
  const [category_name, set_category_name] = useState<string>("");
  const [submitting, set_submitting] = useState<boolean>(false);
  const [error, set_error] = useState<string>("");

  useEffect(() => {
    if (!open || !target) return;
    set_group(target.group || "");
    set_category_name(target.category_name || "");
    set_error("");
    set_submitting(false);
  }, [open, target]);

  if (!open || !target) return null;

  const handle_save = async () => {
    if (!group || !category_name.trim()) {
      set_error("그룹/카테고리명을 확인해주세요.");
      return;
    }

    try {
      set_submitting(true);
      set_error("");

      // ✅ 반드시 숫자 ID로 전송
      const res = await fetch(`/api/category/${Number(target.category_id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          group,
          category_name: category_name.trim(),
        }),
      });

      const raw = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { msg = (raw ? JSON.parse(raw) : null)?.message || msg; } catch {}
        throw new Error(msg);
      }

      const updated: ApiCategory =
        raw ? JSON.parse(raw) : { category_id: target.category_id, group, category_name: category_name.trim() };

      onSaved(updated);                                      // 리스트 즉시 반영
      // ✅ 추가: 화면 전역에 즉시 반영되도록 브로드캐스트
      window.dispatchEvent(new CustomEvent("category:edited", { detail: updated }));
      alert("카테고리 수정이 완료되었습니다.");               // 안내
      onClose();                                             // 모달 닫기
    } catch (e: any) {
      set_error(e?.message || "수정에 실패했습니다.");
    } finally {
      set_submitting(false);
    }
  };

  const on_input_keydown: React.KeyboardEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handle_save();
    }
  };

  return (
    <div style={overlay_style} onClick={onClose}>
      <div style={modal_style} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 12px 0" }}>카테고리 수정</h3>

        <div style={field_wrap}>
          <label style={label_block}>group</label>
          <select value={group} onChange={(e) => set_group(e.target.value)} onKeyDown={on_input_keydown} style={control_block}>
            <option value="">선택</option>
            {GROUP_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div style={field_wrap}>
          <label style={label_block}>category_name</label>
          <input
            type="text"
            value={category_name}
            onChange={(e) => set_category_name(e.target.value)}
            onKeyDown={on_input_keydown}
            style={control_block}
            placeholder="예) 우삼겹"
          />
        </div>

        {error && <div style={{ color: "crimson", fontSize: 12, marginBottom: 8 }}>{error}</div>}

        <div style={actions_row}>
          <button type="button" onClick={onClose} disabled={submitting}>취소</button>
          <button
            type="button"
            onClick={handle_save}
            disabled={submitting}
            style={{ background: "#111827", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryEditPage;
