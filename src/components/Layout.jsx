
import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-4">
        <h2 className="text-xl font-bold">Helpdesk</h2>
        <nav className="space-y-2">
          <Link to="/dashboard" className="block hover:text-gray-300">Dashboard</Link>
          <Link to="/masters" className="block hover:text-gray-300">Master Data</Link>
          <Link to="/tickets" className="block hover:text-gray-300">Tickets</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
}
