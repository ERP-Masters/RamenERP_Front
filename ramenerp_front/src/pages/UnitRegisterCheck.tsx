// src/pages/UnitRegisterCheck.tsx
import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// 체크 페이지에서만 쓰는 최소 타입 (선택)
type UnitPayload = { unit_id?: number; code?: string; name?: string };

const UnitRegisterCheck: React.FC = () => {
  const navigate_fn = useNavigate();
  const location = useLocation();
  const is_done_ref = useRef(false); // StrictMode 중복 가드

  useEffect(() => {
    if (is_done_ref.current) return;
    is_done_ref.current = true;

    const unit = (location.state as { unit?: UnitPayload } | null)?.unit;

    setTimeout(() => {
      if (unit?.unit_id) {
        alert(`단위 등록이 완료되었습니다.\n(ID: ${unit.unit_id}, 단위: ${unit.code}, 단위명: ${unit.name})`);
      } else {
        alert("단위 등록이 완료되었습니다.");
      }
      navigate_fn("/unit/register", { replace: true });
    }, 0);
  }, [location.state, navigate_fn]);

  return null;
};

export default UnitRegisterCheck;
