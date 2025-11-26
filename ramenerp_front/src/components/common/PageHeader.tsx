// src/components/common/PageHeader.tsx
import React from "react";
import { ui_tok } from "@/ui/ui_tok";

const header_row_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
};

const title_style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
};

const description_style: React.CSSProperties = {
  fontSize: 12,
  color: ui_tok.label,
  marginTop: 2,
};

const actions_style: React.CSSProperties = {
  marginLeft: "auto",
  display: "flex",
  gap: 8,
};

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
}) => {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={header_row_style}>
        <div>
          <div style={title_style}>{title}</div>
          {description && <div style={description_style}>{description}</div>}
        </div>
        {actions && <div style={actions_style}>{actions}</div>}
      </div>
    </div>
  );
};
