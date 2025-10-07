// src/pages/CategoryRegisterPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CategoryListPanel from "../components/CategoryListPanel";

// 대분류 Enum
export enum MajorCategory {
  MEAT = "MEAT",
  SEAFOOD = "SEAFOOD",
  NOODLES = "NOODLES",
  VEGETABLES = "VEGETABLES",
  DAIRY = "DAIRY",
  EGGS = "EGGS",
  PROCESSED = "PROCESSED",
  SAUCE = "SAUCE",
  BROTH_SOUP = "BROTH_SOUP",
}

export interface CategoryData {
  major_category: MajorCategory;
  category_name: string;
}

const CategoryRegisterPage: React.FC = () => {
  const navigate_fn = useNavigate();

  const [major_category, set_major_category] = useState<MajorCategory>(MajorCategory.MEAT);
  const [category_name, set_category_name] = useState<string>("");

  const handle_major_change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    set_major_category(e.target.value as MajorCategory);
  };

  const handle_name_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    set_category_name(e.target.value);
  };

  const handle_submit = (e: React.FormEvent) => {
    e.preventDefault();
    // 필요한 검증 후 완료 페이지로 이동
    navigate_fn("/category/register/check", {
      state: {
        data: {
          major_category,
          category_name: category_name.trim(),
        } as CategoryData,
      },
    });
  };

  return (
    <div>
      <h1>카테고리 관리 페이지</h1>
      <form onSubmit={handle_submit}>
        {/* ✅ 가로 정렬: group 선택 → category_name 입력 → 등록 버튼 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          <label htmlFor="group" style={{ marginRight: 4 }}>group</label>
          <select id="group" value={major_category} onChange={handle_major_change}>
            {Object.values(MajorCategory).map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>

          <label htmlFor="category_name" style={{ marginLeft: 8, marginRight: 4 }}>category_name</label>
          <input
            id="category_name"
            type="text"
            name="category_name"
            value={category_name}
            onChange={handle_name_change}
            placeholder="예) 우삼겹, 냉장육, 건면 등"
            style={{ width: 240 }}
          />

          <button type="submit" style={{ marginLeft: 8 }}>등록</button>
        </div>

        {/* 기존처럼 폼 아래에 목록 패널 표시 */}
        <CategoryListPanel />
      </form>
    </div>
  );
};

export default CategoryRegisterPage;
