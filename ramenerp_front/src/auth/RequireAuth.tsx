// src/auth/RequireAuth.tsx

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { is_logged_in } from "@/auth/auth_session";

type RequireAuthProps = {
  children: React.ReactNode;
};

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const location = useLocation();
  const is_ok = is_logged_in();

  if (!is_ok) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default RequireAuth;
