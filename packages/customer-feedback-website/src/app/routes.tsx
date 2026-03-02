import { createBrowserRouter, Navigate } from "react-router";
import { LoginPage } from "./pages/login-page";
import { ComplaintsPage } from "./pages/complaints-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/complaints",
    Component: ComplaintsPage,
  },
]);
