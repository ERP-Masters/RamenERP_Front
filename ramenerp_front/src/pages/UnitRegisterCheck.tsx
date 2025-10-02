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

    const do_submit = async () => {
      const unit = (location.state as { unit?: UnitPayload } | null)?.unit;

      // 필수 값 확인
      const code = unit?.code?.trim();
      const name = unit?.name?.trim();
      if (!code || !name) {
        alert("단위 등록에 실패하였습니다.");
        navigate_fn("/unit/register", { replace: true });
        return;
      }

      // 서버에 보낼 페이로드
      const payload = { code, name };

      try {
        // ✅ Vite proxy 사용: /api -> vite.config.ts의 target(IP:포트)
        const res = await fetch("/api/units", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });

        // 실패 처리
        if (!res.ok) {
          // 서버가 에러 바디를 줄 수도 있으니 text → JSON 시도
          const raw = await res.text().catch(() => "");
          try {
            const err = raw ? JSON.parse(raw) : null;
            // err?.message가 있으면 참고만, 경고 문구는 요구사항대로 고정
            // throw new Error(err?.message || `HTTP ${res.status}`);
            // 요구사항: 실패 문구 고정
            throw new Error(`HTTP ${res.status}`);
          } catch {
            throw new Error(`HTTP ${res.status}`);
          }
        }

        // 성공
        alert("단위 등록이 완료되었습니다.");
      } catch (_) {
        alert("단위 등록에 실패하였습니다.");
      } finally {
        navigate_fn("/unit/register", { replace: true });
      }
    };

    // 기존 setTimeout 패턴 유지 원하면 아래 주석 해제
    // setTimeout(do_submit, 0);
    do_submit();
  }, [location.state, navigate_fn]);

  return null;
};

export default UnitRegisterCheck;
