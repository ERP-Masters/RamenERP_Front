// src/pages/CategoryRegisterCheck.tsx
import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ✅ CategoryRegisterPage가 export 하지 않는 타입을 로컬로 선언
type CategoryData = {
  major_category: string;   // 예: "MEAT"
  category_name: string;    // 예: "소고기"
};

const CategoryRegisterCheck: React.FC = () => {
  const navigate_fn = useNavigate();
  const location = useLocation();
  const is_done_ref = useRef(false); // StrictMode 이펙트 2회 호출 가드

  useEffect(() => {
    if (is_done_ref.current) return;
    is_done_ref.current = true;

    const do_submit = async () => {
      const state = location.state as { data?: CategoryData } | null;
      const form = state?.data;

      if (!form) {
        alert("카테고리 등록에 필요한 데이터가 없습니다.");
        navigate_fn("/category/register", { replace: true });
        return;
      }

      // 서버에 보낼 페이로드 (명세: { group, category_name })
      const payload = {
        group: form.major_category,               // 예: "MEAT"
        category_name: form.category_name.trim(), // 예: "소고기"
      };

      try {
        const res = await fetch("/api/category", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const raw = await res.text().catch(() => "");
          try {
            const err = raw ? JSON.parse(raw) : null;
            throw new Error(err?.message || `HTTP ${res.status}`);
          } catch {
            throw new Error(`HTTP ${res.status}`);
          }
        }

        alert("카테고리 등록이 완료되었습니다.");
      } catch (e) {
        alert("카테고리 등록에 실패했습니다.");
      } finally {
        navigate_fn("/category/register", { replace: true });
      }
    };

    do_submit();
  }, [location.state, navigate_fn]);

  return null;
};

export default CategoryRegisterCheck;
