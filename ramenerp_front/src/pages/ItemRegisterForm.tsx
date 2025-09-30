// src/pages/ItemRegisterForm.tsx
import React, { useState } from "react";

export interface ProductData {
  category_id: string;
  name: string;
  unit: string;
  unit_price: string;
  expiry_date: string;
  vendor_id: string;
}

interface ItemRegisterFormProps {
  onSubmit: (data: ProductData) => void;
}

const ItemRegisterForm: React.FC<ItemRegisterFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<ProductData>({
    category_id: "",
    name: "",
    unit: "",
    unit_price: "",
    expiry_date: "",
    vendor_id: "",
  });

  const unitOptions = ["팩", "통", "판(계란)", "Kg", "박스", "캔"];
  const categoryOptions = [
    { category_id: "C001", category_name: "육류" },
    { category_id: "C002", category_name: "해산물" },
    { category_id: "C003", category_name: "면류" },
  ];
  const vendorOptions = [
    { vendor_id: "V001", name: "CJ 제일제당" },
    { vendor_id: "V002", name: "농협" },
    { vendor_id: "V003", name: "지역 납품업체" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>카테고리</label>
      <select name="category_id" value={formData.category_id} onChange={handleChange}>
        <option value="">선택</option>
        {categoryOptions.map(c => (
          <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
        ))}
      </select>

      <label>품목명</label>
      <input type="text" name="name" value={formData.name} onChange={handleChange} />

      <label>단위</label>
      <select name="unit" value={formData.unit} onChange={handleChange}>
        <option value="">선택</option>
        {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
      </select>

      <label>단가</label>
      <input type="number" name="unit_price" value={formData.unit_price} onChange={handleChange} />

      <label>유통기한</label>
      <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} />

      <label>거래처</label>
      <select name="vendor_id" value={formData.vendor_id} onChange={handleChange}>
        <option value="">선택</option>
        {vendorOptions.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.name}</option>)}
      </select>

      <button type="submit">등록</button>
    </form>
  );
};

export default ItemRegisterForm;
