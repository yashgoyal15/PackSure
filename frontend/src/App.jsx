import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import AppShell from "./components/layout/AppShell";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewInspection from "./pages/NewInspection";
import Repository from "./pages/Repository";
import InspectionDetail from "./pages/InspectionDetail";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import More from "./pages/More";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRules from "./pages/admin/AdminRules";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route path="/app" element={<AppShell />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inspection/new" element={<NewInspection />} />
            <Route path="inspection/:id" element={<InspectionDetail />} />
            <Route path="repository" element={<Repository />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="more" element={<More />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/rules" element={<AdminRules />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
