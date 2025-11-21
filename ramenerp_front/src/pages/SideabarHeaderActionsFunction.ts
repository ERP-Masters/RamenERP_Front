// src/components/SidebarHeaderActionsFunction.ts
// 사이드바 헤더에서 사용하는 공통 액션 훅
import { useNavigate } from "react-router-dom";

export type UseSidebarHeaderActionsReturn = {
  go_home: () => void;
  handle_logout: () => void;
};

export function useSidebarHeaderActions(): UseSidebarHeaderActionsReturn {
  const navigate = useNavigate();

  // ✅ 집 아이콘: 메인 대시보드로 이동
  const go_home = () => {
    navigate("/dashboard");
  };

  // ✅ 전원 아이콘: 로그아웃 + 확인창
  const handle_logout = () => {
    const ok = window.confirm("로그아웃 하시겠습니까?");
    if (!ok) return;

    // 로그인 플래그 제거 (로그인 훅에서 사용한 키와 동일하게)
    try {
      sessionStorage.removeItem("ramenerp_login_ok");
    } catch {
      // sessionStorage 접근 실패해도 그냥 진행
    }

    navigate("/login");
  };

  return { go_home, handle_logout };
}
