import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const CategoryRegisterCheck: React.FC = () => {
  const navigate_fn = useNavigate();
  const is_done_ref = useRef(false); // StrictMode 이펙트 2회 호출 가드

  useEffect(() => {
    if (is_done_ref.current) return;
    is_done_ref.current = true;

    // alert 이후 네비게이션을 안전하게 예약
    setTimeout(() => {
      alert("카테고리 등록이 완료되었습니다.");
      navigate_fn("/category/register", { replace: true });
    }, 0);
  }, [navigate_fn]);

  return null;
};

export default CategoryRegisterCheck;
