// src/components/common/SectionCard.tsx
import React from "react";
import { ui_tok } from "@/ui/ui_tok";

const card_style: React.CSSProperties = {
  background: ui_tok.surface,
  borderRadius: ui_tok.radius,
  padding: "14px 18px 16px",
  boxShadow: "0 10px 26px rgba(15,23,42,0.07)",
  border: `1px solid ${ui_tok.border}`,
  display: "flex",
  flexDirection: "column",
};

const card_header_style: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginBottom: 8,
  gap: 8,
};

const card_title_style: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
};

const card_subtitle_style: React.CSSProperties = {
  fontSize: 12,
  color: ui_tok.label,
};

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  right_slot?: React.ReactNode;
  children: React.ReactNode;
};

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  right_slot,
  children,
}) => {
  const has_header = Boolean(title || subtitle || right_slot);

  return (
    <section style={card_style}>
      {has_header && (
        <header style={card_header_style}>
          <div style={{ flex: 1 }}>
            {title && <div style={card_title_style}>{title}</div>}
            {subtitle && <div style={card_subtitle_style}>{subtitle}</div>}
          </div>
          {right_slot && <div>{right_slot}</div>}
        </header>
      )}

      <div>{children}</div>
    </section>
  );
};
