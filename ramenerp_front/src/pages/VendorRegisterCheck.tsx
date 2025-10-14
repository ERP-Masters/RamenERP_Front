// src/pages/VendorRegisterCheck.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import VendorRegisterForm, { VendorData } from "./VendorRegisterForm";

interface CreateVendorDto {
  name: string;     // 거래처명
  manager: string;  // 담당자명
  contact: string;  // 담당자 이메일
  address: string;  // 평문 주소 (도롬명+상세)
}

interface VendorResponse {
  vendor_id: number; // 자동 증가
  name: string;
  manager: string;
  contact: string;
  address: string;
}

const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, set_vendors] = useState<VendorData[]>([]);
  const [error_message, set_error_message] = useState<string>("");

  const handleSubmit = async (data: VendorData) => {
    // 기존 동작 유지
    set_error_message("");

    // CreateVendorDto 매핑
    const payload: CreateVendorDto = {
      name: data.name.trim(),
      manager: data.contact_name.trim(),
      contact: data.contact_email.trim(),
      address: (data.address_road || "").trim(), // VendorRegisterForm에서 합쳐 전달됨
    };

    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const raw_text = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const err_json = JSON.parse(raw_text);
          msg = err_json?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      let saved: VendorResponse;
      try {
        saved = JSON.parse(raw_text) as VendorResponse;
      } catch {
        throw new Error("서버 응답을 파싱할 수 없습니다.");
      }

      // 기존 로컬 상태 적재 로직 유지
      set_vendors(prev => [
        ...prev,
        {
          name: saved.name,
          contact_name: payload.manager,
          contact_email: payload.contact,
          address_road: saved.address,
          address_detail: "",
        },
      ]);

      // ✅ 추가: 등록 직후 조회 패널에게 새로고침 신호
      window.dispatchEvent(new CustomEvent("vendor:created", { detail: { id: saved.vendor_id } }));

      alert(`거래처 등록이 완료되었습니다. (ID: ${saved.vendor_id})`);
      navigate("/vendor/register"); // 기존 경로 유지
    } catch (e: any) {
      set_error_message(e?.message || "등록 중 오류가 발생했습니다.");
      alert(error_message || e?.message || "등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div>
      <h1>거래처 관리</h1>
      <VendorRegisterForm onSubmit={handleSubmit} />
    </div>
  );
};

export default VendorRegisterPage;
