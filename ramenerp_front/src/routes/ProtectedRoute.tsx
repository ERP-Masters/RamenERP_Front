// src/routes/ProtectedRoute.tsx

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { is_logged_in } from "@/auth/auth_session";

const ProtectedRoute: React.FC = () => {
  if (!is_logged_in()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
