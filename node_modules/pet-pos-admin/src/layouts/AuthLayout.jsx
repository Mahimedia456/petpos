import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <Outlet />
      </div>
    </div>
  );
}