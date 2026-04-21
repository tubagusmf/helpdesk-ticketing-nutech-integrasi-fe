import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardStaff from "./pages/DashboardStaff";
import DashboardUser from "./pages/DashboardUser";
import Unauthorized from "./pages/Unauthorized";
import MasterDataAdmin from "./pages/MasterDataAdmin";
import UserManagement from "./pages/UserManagement";

import ProtectedRoute from "./components/ProtectedRoute";
import TicketManagement from "./pages/TicketManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role={1}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute role={1}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

        <Route
          path="/staff"
          element={
            <ProtectedRoute role={2}>
              <DashboardStaff />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user"
          element={
            <ProtectedRoute role={3}>
              <DashboardUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/master"
          element={
            <ProtectedRoute role={1}>
              <MasterDataAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tickets"
          element={
            <ProtectedRoute role={1}>
              <TicketManagement />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;