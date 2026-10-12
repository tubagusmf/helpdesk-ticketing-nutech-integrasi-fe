
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ROLE } from "./constants/role";
import {canAccessDashboard, DASHBOARD_BASE_BY_ROLE, normalizeRole} from "./utils/dashboard";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import DashboardTicket from "./pages/DashboardTicket";
import DashboardProject from "./pages/DashboardProject";
import DashboardStaff from "./pages/DashboardStaff";
import MasterDataAdmin from "./pages/MasterDataAdmin";
import UserManagement from "./pages/UserManagement";
import TicketManagement from "./pages/TicketManagement";
import TicketDetail from "./pages/TicketDetail";
import ExportCustom from "./pages/ExportCustom";
import ProtectedRoute from "./components/ProtectedRoute";

const dashboardPages = [
  {
    key: "summary",
    suffix: "",
    component: Dashboard,
  },
  {
    key: "ticket",
    suffix: "/ticket",
    component: DashboardTicket,
  },
  {
    key: "project",
    suffix: "/project",
    component: DashboardProject,
  },
  {
    key: "staff",
    suffix: "/staff",
    component: DashboardStaff,
  },
];

const roleBases = [
  {
    base: "/admin",
    role: ROLE.ADMINISTRATOR,
  },
  {
    base: "/staff",
    role: ROLE.STAFF,
  },
  {
    base: "/user",
    role: ROLE.USER,
  },
  {
    base: "/executive",
    role: ROLE.EXECUTIVE,
  },
  {
    base: "/engineer",
    role: ROLE.ENGINEER,
  },
];

const protectedRoutes = [
  {
    path: "/admin/users",
    role: ROLE.ADMINISTRATOR,
    component: UserManagement,
  },
  {
    path: "/admin/master",
    role: ROLE.ADMINISTRATOR,
    component: MasterDataAdmin,
  },
  {
    path: "/admin/tickets",
    role: ROLE.ADMINISTRATOR,
    component: TicketManagement,
  },
  {
    path: "/admin/export-custom",
    role: ROLE.ADMINISTRATOR,
    component: ExportCustom,
  },

  {
    path: "/staff/tickets",
    role: ROLE.STAFF,
    component: TicketManagement,
  },
  {
    path: "/staff/export-custom",
    role: ROLE.STAFF,
    component: ExportCustom,
  },

  {
    path: "/user/tickets",
    role: ROLE.USER,
    component: TicketManagement,
  },

  {
    path: "/executive/tickets",
    role: ROLE.EXECUTIVE,
    component: TicketManagement,
  },
  {
    path: "/executive/export-custom",
    role: ROLE.EXECUTIVE,
    component: ExportCustom,
  },

  {
    path: "/engineer/tickets",
    role: ROLE.ENGINEER,
    component: TicketManagement,
  },
];

const dashboardRoutes = roleBases.flatMap(
  ({ base, role }) =>
    dashboardPages.map(
      ({ key, suffix, component: Component }) => ({
        path: `${base}/dashboard${suffix}`,
        base,
        role,
        pageKey: key,
        Component,
      }),
    ),
);

function ProtectedPage({ role, Component }) {
  return (
    <ProtectedRoute role={role}>
      <Component />
    </ProtectedRoute>
  );
}

function DashboardRoutePage({
  role,
  base,
  pageKey,
  Component,
}) {
  const hasAccess = canAccessDashboard(
    role,
    pageKey,
  );

  if (!hasAccess) {
    const fallbackBase =
      DASHBOARD_BASE_BY_ROLE[role] || base;

    return (
      <Navigate
        to={`${fallbackBase}/dashboard`}
        replace
      />
    );
  }
  
  return (
    <ProtectedPage
      role={role}
      Component={Component}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        reverseOrder={false}
      />

      <Routes>
        {/* PUBLIC ROUTES */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />

        {/* DASHBOARD ROUTES */}

        {dashboardRoutes.map(
          ({
            path,
            base,
            role,
            pageKey,
            Component,
          }) => (
            <Route
              key={path}
              path={path}
              element={
                <DashboardRoutePage
                  role={role}
                  base={base}
                  pageKey={pageKey}
                  Component={Component}
                />
              }
            />
          ),
        )}

        {/* OTHER PROTECTED ROUTES */}

        {protectedRoutes.map(
          ({
            path,
            role,
            component: Component,
          }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedPage
                  role={role}
                  Component={Component}
                />
              }
            />
          ),
        )}

        {/* PROFILE */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* TICKET DETAIL */}

        <Route
          path="/tickets/:id"
          element={
            <ProtectedRoute>
              <TicketDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
