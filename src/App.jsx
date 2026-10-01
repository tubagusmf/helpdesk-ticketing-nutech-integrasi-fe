import {BrowserRouter, Routes, Route} from "react-router-dom";
import { Toaster } from "react-hot-toast";
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
import ProtectedRoute from "./components/ProtectedRoute";

const dashboardPages = [
  {
    suffix: "",
    component: Dashboard,
  },
  {
    suffix: "/ticket",
    component: DashboardTicket,
  },
  {
    suffix: "/project",
    component: DashboardProject,
  },
  {
    suffix: "/staff",
    component: DashboardStaff,
  },
];

const roleBases = [
  {
    base: "/admin",
    role: 1,
  },
  {
    base: "/staff",
    role: 2,
  },
  {
    base: "/user",
    role: 3,
  },
  {
    base: "/executive",
    role: 4,
  },
  {
    base: "/engineer",
    role: 5,
  },
];

const dashboardRoutes =
  roleBases.flatMap(
    ({ base, role }) =>
      dashboardPages.map(
        ({
          suffix,
          component: Component,
        }) => ({
          path: `${base}/dashboard${suffix}`,
          role,
          Component,
        }),
      ),
  );

const protectedRoutes = [
  {
    path: "/admin/users",
    role: 1,
    component: UserManagement,
  },
  {
    path: "/admin/master",
    role: 1,
    component: MasterDataAdmin,
  },
  {
    path: "/admin/tickets",
    role: 1,
    component: TicketManagement,
  },

  {
    path: "/staff/tickets",
    role: 2,
    component: TicketManagement,
  },

  {
    path: "/user/tickets",
    role: 3,
    component: TicketManagement,
  },

  {
    path: "/executive/tickets",
    role: 4,
    component: TicketManagement,
  },

  {
    path: "/engineer/tickets",
    role: 5,
    component: TicketManagement,
  },
];

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
      />

      <Routes>
        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/unauthorized"
          element={
            <Unauthorized />
          }
        />

        {dashboardRoutes.map(
          ({
            path,
            role,
            Component,
          }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute
                  role={role}
                >
                  <Component />
                </ProtectedRoute>
              }
            />
          ),
        )}

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
                <ProtectedRoute
                  role={role}
                >
                  <Component />
                </ProtectedRoute>
              }
            />
          ),
        )}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

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