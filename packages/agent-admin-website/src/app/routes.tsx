import { createBrowserRouter, Navigate } from "react-router";
import { AdminLoginPage } from "./pages/admin-login-page";
import { AdminDashboardPage } from "./pages/admin-dashboard-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/admin/login" replace />,
  },
  {
    path: "/admin/login",
    Component: AdminLoginPage,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboardPage,
  },
]);
