import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="lg:pl-[300px]">
        <Topbar />

        <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}