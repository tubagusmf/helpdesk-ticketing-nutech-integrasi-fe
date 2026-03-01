import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardStaff from "./pages/DashboardStaff";
import DashboardUser from "./pages/DashboardUser";
import Unauthorized from "./pages/Unauthorized";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role={1}>
              <DashboardAdmin />
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

        <Route path="/unauthorized" element={<Unauthorized />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;