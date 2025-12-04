// src/pages/Notice/function/NoticeContentPreviewFunction.ts
import { useState } from "react";

export type NoticePreviewPosition = {
  x: number;
  y: number;
};

const tooltip_width = 260;
const tooltip_height = 160;
const offset_x = 16;
const offset_y = 16;

const calc_position = (
  client_x: number,
  client_y: number,
): NoticePreviewPosition => {
  let x = client_x + offset_x;
  let y = client_y + offset_y;

  if (typeof window !== "undefined") {
    const max_x = window.innerWidth - tooltip_width - 8;
    const max_y = window.innerHeight - tooltip_height - 8;

    if (x > max_x) x = max_x;
    if (y > max_y) y = max_y;
  }

  return { x, y };
};

export const useNoticeContentPreview = () => {
  const [is_open, set_is_open] = useState(false);
  const [preview_content, set_preview_content] = useState("");
  const [position, set_position] = useState<NoticePreviewPosition>({
    x: 0,
    y: 0,
  });

  const open_preview = (
    content: string,
    client_x: number,
    client_y: number,
  ) => {
    set_preview_content(content);
    set_position(calc_position(client_x, client_y));
    set_is_open(true);
  };

  const move_preview = (client_x: number, client_y: number) => {
    set_position((prev) =>
      is_open ? calc_position(client_x, client_y) : prev,
    );
  };

  const close_preview = () => {
    set_is_open(false);
  };

  return {
    is_open,
    preview_content,
    position,
    open_preview,
    move_preview,
    close_preview,
  };
};
