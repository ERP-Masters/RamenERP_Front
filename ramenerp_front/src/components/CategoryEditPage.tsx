// src/components/CategoryEditPage.tsx
import React, { useEffect, useState } from "react";

export type CategoryEditTarget = {
  category_id: number;
  group: string;
  category_name: string;
};

type ApiCategory = {
  category_id: number;
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
  "MEAT",
  "SEAFOOD",
  "NOODLES",
  "VEGETABLES",
  "DAIRY",
  "EGGS",
  "PROCESSED",
  "SAUCE",
  "BROTH_SOUP",
] as const;

const overlay_style: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal_style: React.CSSProperties = {
  width: 360,
  background: "#fff",
  borderRadius: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 16,
  boxSizing: "border-box",
};

const row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 10,
};

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

  // ⬇️ 버튼 기반 저장 (부모 폼과 충돌 방지)
  const handle_save = async () => {
    if (!group || !category_name.trim()) {
      set_error("그룹/카테고리명을 확인해주세요.");
      return;
    }

    try {
      set_submitting(true);
      set_error("");

      const res = await fetch(`/api/category/${target.category_id}`, {
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
        try {
          const j = raw ? JSON.parse(raw) : null;
          msg = j?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      // 응답이 비어있어도 안전 합성
      const updated: ApiCategory =
        raw ? JSON.parse(raw) : { category_id: target.category_id, group, category_name: category_name.trim() };

      onSaved(updated);
      onClose();
    } catch (e: any) {
      set_error(e?.message || "수정에 실패했습니다.");
    } finally {
      set_submitting(false);
    }
  };

  // Enter로도 저장하고 싶으면 인풋에 onKeyDown 추가 (옵션)
  const on_input_keydown: React.KeyboardEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // 부모 폼으로 올라가지 않게
      e.stopPropagation();
      handle_save();
    }
  };

  return (
    <div style={overlay_style} onClick={onClose}>
      <div style={modal_style} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px 0" }}>카테고리 수정</h3>

        {/* ⬇️ 폼 대신 일반 div */}
        <div>
          <div style={row_style}>
            <label style={{ width: 90 }}>category_id</label>
            <div>{target.category_id}</div>
          </div>

          <div style={row_style}>
            <label style={{ width: 90 }}>group</label>
            <select
              value={group}
              onChange={(e) => set_group(e.target.value)}
              onKeyDown={on_input_keydown}
              style={{ flex: 1 }}
            >
              <option value="">선택</option>
              {GROUP_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div style={row_style}>
            <label style={{ width: 90 }}>category_name</label>
            <input
              type="text"
              value={category_name}
              onChange={(e) => set_category_name(e.target.value)}
              onKeyDown={on_input_keydown}
              style={{ flex: 1 }}
              placeholder="예) 우삼겹"
            />
          </div>

          {error && <div style={{ color: "crimson", fontSize: 12, marginBottom: 8 }}>{error}</div>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button type="button" onClick={handle_save} disabled={submitting}>
              {submitting ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryEditPage;
