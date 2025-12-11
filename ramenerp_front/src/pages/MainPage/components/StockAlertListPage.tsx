// src/pages/StockAlertListPage.tsx
import React, { useState } from "react";
import { use_stock_ai_loader_for_list_page } from "../function/StockDangerAiFunction";

type Tab_type = "WAREHOUSE" | "BRANCH";

const StockAlertListPage: React.FC = () => {
  const [active_tab, set_active_tab] = useState<Tab_type>("WAREHOUSE");

  const {
    warehouse_alert_list,
    branch_alert_list,
    is_loading,
    error_msg,
    has_data,
  } = use_stock_ai_loader_for_list_page(0); // 여기서만 /forecast/run 호출

  const is_initial_loading = is_loading && !has_data;

  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        height: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>AI 재고 알림 리스트</h1>
        {has_data && (
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            ※ 재고 알림 리스트에서만 모델이 실행되며,
            메인 화면 사이드 탭은 축적된 결과만 표시됩니다.
          </div>
        )}
      </div>

      {/* 탭 버튼 영역 */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => set_active_tab("WAREHOUSE")}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border:
              active_tab === "WAREHOUSE"
                ? "2px solid #111827"
                : "1px solid #d1d5db",
            background: active_tab === "WAREHOUSE" ? "#111827" : "#ffffff",
            color: active_tab === "WAREHOUSE" ? "#ffffff" : "#111827",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          창고 재고 알림
        </button>
        <button
          type="button"
          onClick={() => set_active_tab("BRANCH")}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border:
              active_tab === "BRANCH"
                ? "2px solid #111827"
                : "1px solid #d1d5db",
            background: active_tab === "BRANCH" ? "#111827" : "#ffffff",
            color: active_tab === "BRANCH" ? "#ffffff" : "#111827",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          직영점 재고 알림
        </button>
      </div>

      {/* 로딩 / 에러 영역 */}
      {is_initial_loading && (
        <div
          style={{
            flex: 1,
            borderRadius: 18,
            border: "1px solid #e5e7eb",
            boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "4px solid #e5e7eb",
              borderTopColor: "#1d4ed8",
              animation: "spin 1s linear infinite",
            }}
          />
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            AI 재고 예측 모델을 실행 중입니다...
          </div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            10만 건 이상의 데이터를 분석 중입니다. 잠시만 기다려 주세요.
          </div>
          {/* CSS 애니메이션을 위해 전역에 @keyframes spin 하나만 추가해두면 좋음 */}
        </div>
      )}

      {!is_initial_loading && error_msg && !has_data && (
        <div
          style={{
            flex: 1,
            borderRadius: 18,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            padding: 24,
            fontSize: 13,
            color: "#b91c1c",
          }}
        >
          {error_msg}
        </div>
      )}

      {/* 리스트 테이블 영역 */}
      {!is_initial_loading && has_data && (
        <div
          style={{
            flex: 1,
            borderRadius: 18,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            padding: 16,
            overflow: "auto",
          }}
        >
          {active_tab === "WAREHOUSE" ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    품목(창고)
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    수량 정보
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    위험 단계
                  </th>
                </tr>
              </thead>
              <tbody>
                {warehouse_alert_list.map((row) => (
                  <tr key={row.id}>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #f3f4f6",
                        fontWeight: 500,
                      }}
                    >
                      {row.name}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #f3f4f6",
                        color: "#6b7280",
                      }}
                    >
                      {row.qty_text}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #f3f4f6",
                        color: "#b91c1c",
                        fontWeight: 600,
                      }}
                    >
                      {row.level_text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    지점 / 품목
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    수요 정보
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 8,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    수준
                  </th>
                </tr>
              </thead>
              <tbody>
                {branch_alert_list.map((row) => (
                  <tr key={row.id}>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #f3f4f6",
                        fontWeight: 500,
                      }}
                    >
                      {row.name}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #f3f4f6",
                        color: "#6b7280",
                      }}
                    >
                      {row.qty_text}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #f3f4f6",
                        color: "#1d4ed8",
                        fontWeight: 600,
                      }}
                    >
                      {row.level_text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default StockAlertListPage;
