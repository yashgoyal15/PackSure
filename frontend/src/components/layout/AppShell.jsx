import { Outlet, Navigate } from "react-router-dom";
import TopNav from "./TopNav";
import MobileTabBar from "./MobileTabBar";
import ToastHost from "../ui/Toast";
import { useApp } from "../../context/AppContext";

export default function AppShell() {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <TopNav />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <MobileTabBar />
      <ToastHost />
    </div>
  );
}
