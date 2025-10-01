// src/main.tsx (또는 src/index.tsx)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

// Vite에서는 클라 .env는 VITE_ 접두어가 필요합니다 (대문자 + 스네이크 케이스 권장).
// 예: VITE_BASE_PATH="/app"
const base_path = import.meta.env.VITE_BASE_PATH || "/";

const root_el = document.getElementById("root");
if (!root_el) {
  // 루트 엘리먼트 누락 시, 오류를 명확히 표시
  throw new Error("Root element (#root) not found");
}

ReactDOM.createRoot(root_el).render(
  <React.StrictMode>
    <BrowserRouter basename={base_path}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
