// src/components/NoticeSideSection.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ui_tok = {
  surface: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  label: "#6b7280",
  radius: 18,
} as const;

const card_style: React.CSSProperties = {
  background: ui_tok.surface,
  borderRadius: ui_tok.radius,
  padding: "14px 18px 16px",
  boxShadow: "0 10px 26px rgba(15,23,42,0.07)",
  border: `1px solid ${ui_tok.border}`,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

const header_style: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 6,
};

const title_style: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
};

const more_link_style: React.CSSProperties = {
  fontSize: 11,
  color: ui_tok.label,
  textDecoration: "none",
};

const list_style: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  fontSize: 12,
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  // ✅ 공지 3개 기준으로 탭 높이 고정 (데이터 없을 때도 동일한 높이 유지)
  height: 72,
};

const item_style: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 6,
};

const item_title_style: React.CSSProperties = {
  fontWeight: 500,
  marginRight: 4,
};

const date_style: React.CSSProperties = {
  fontSize: 11,
  color: ui_tok.label,
};

const date_emergency_style: React.CSSProperties = {
  fontSize: 11,
  color: "#b91c1c",
};

const empty_item_style: React.CSSProperties = {
  marginTop: 4,
  fontSize: 10,
  color: "#b91c1c",
};

// ✅ 사이드 공지에서 사용할 간단 타입
type SideNotice = {
  id: number;
  title: string;
  date_text: string;
  is_emergency?: boolean;
  sort_key?: string;
};

const NoticeSideSection: React.FC = () => {
  const navigate = useNavigate();

  const [latest_notices, set_latest_notices] = useState<SideNotice[]>([]);

  // ✅ /api/notice 에서 최신 데이터만 가져오기
  useEffect(() => {
    const fetch_latest = async () => {
      try {
        const res = await fetch("/api/notice", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        const text = await res.text();
        if (!res.ok) {
          throw new Error(text || `HTTP ${res.status}`);
        }

        const json = text ? JSON.parse(text) : null;
        const raw: any[] = Array.isArray(json) ? json : json ? [json] : [];

        const normalized: SideNotice[] = raw.map((n) => {
          const created_raw = String(n.created_at ?? "");
          const updated_raw = String((n as any).updated_at ?? created_raw);
          const sort_key = updated_raw || created_raw;
          const display_date = (updated_raw || created_raw).slice(0, 10);

          return {
            id: Number(n.id),
            title: String(n.title ?? "").trim(),
            date_text: display_date,
            is_emergency: Boolean((n as any).is_emergency),
            sort_key,
          };
        });

        // 생성/수정 시간 기준 최신순 정렬 (updated_at 우선)
        normalized.sort((a, b) => {
          const a_key = a.sort_key ?? "";
          const b_key = b.sort_key ?? "";
          if (a_key === b_key) return 0;
          return a_key < b_key ? 1 : -1; // 최신이 위로
        });

        // ✅ 사이드바에는 최신 3개만
        set_latest_notices(normalized.slice(0, 3));
      } catch {
        // 실패 시에도 더 이상 더미는 사용하지 않고 그냥 빈 상태 유지
        set_latest_notices([]);
      }
    };

    void fetch_latest();
  }, []);

  const display_list: SideNotice[] = latest_notices;

  return (
    <div style={card_style}>
      <div style={header_style}>
        <div style={title_style}>공지사항</div>
        <a
          href="#"
          style={more_link_style}
          onClick={(e) => {
            e.preventDefault();
            navigate("/notice"); // ✅ 공지사항 전체 페이지로 이동
          }}
        >
          더 보기
        </a>
      </div>
      <ul style={list_style}>
        {display_list.length === 0 ? (
          <li style={empty_item_style}>등록된 공지가 없습니다.</li>
        ) : (
          display_list.map((n, index) => (
            <li key={n.id} style={index === 0 ? undefined : item_style}>
              <span style={item_title_style}>{n.title}</span>
              <span style={n.is_emergency ? date_emergency_style : date_style}>
                {n.date_text}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default NoticeSideSection;
