import { useEffect, useState } from "react";
import { UserPlus, MoreVertical, ShieldCheck, ScanLine, ChartColumn } from "lucide-react";
import { Card, Input, Select } from "../../components/ui/Primitives";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { listUsers, inviteUser } from "../../api/misc";
import { ApiError } from "../../api/client";
import { useApp } from "../../context/AppContext";
import AdminTabs from "./AdminTabs";

export default function AdminUsers() {
  const { showToast } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Inspector" });
  const [inviting, setInviting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    setLoading(true);
    return listUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.email) {
      setFormError("Name and email are required.");
      return;
    }
    setInviting(true);
    try {
      await inviteUser(form);
      showToast(`Invitation sent to ${form.email}`, "success");
      setModalOpen(false);
      setForm({ name: "", email: "", role: "Inspector" });
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail : "Could not invite this user.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-800">Administration</h1>
          <p className="text-sm text-ink-500 mt-1">Manage users and compliance rule configuration</p>
        </div>
        <Button icon={UserPlus} onClick={() => setModalOpen(true)}>Invite User</Button>
      </div>

      <AdminTabs active="users" />

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            <Card className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-primary-600" /></div>
              <div><div className="font-extrabold text-ink-800 text-lg">{users.length}</div><div className="text-xs text-ink-500">Total Users</div></div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success-50 flex items-center justify-center"><ScanLine className="h-5 w-5 text-success-600" /></div>
              <div><div className="font-extrabold text-ink-800 text-lg">{users.filter((u) => u.status === "Active").length}</div><div className="text-xs text-ink-500">Active Accounts</div></div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent-50 flex items-center justify-center"><ChartColumn className="h-5 w-5 text-accent-600" /></div>
              <div><div className="font-extrabold text-ink-800 text-lg">{users.reduce((a, u) => a + u.inspections, 0)}</div><div className="text-xs text-ink-500">Total Inspections</div></div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-ink-400 border-b border-ink-100">
                    <th className="font-bold px-5 py-3">Name</th>
                    <th className="font-bold px-3 py-3 hidden sm:table-cell">Email</th>
                    <th className="font-bold px-3 py-3">Role</th>
                    <th className="font-bold px-3 py-3 hidden md:table-cell">Inspections</th>
                    <th className="font-bold px-3 py-3">Status</th>
                    <th className="font-bold px-5 py-3 text-right">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-accent-100 text-accent-700 border border-accent-600/30 flex items-center justify-center text-xs font-bold shrink-0">
                            {u.initials}
                          </div>
                          <span className="font-semibold text-ink-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-ink-500 hidden sm:table-cell">{u.email}</td>
                      <td className="px-3 py-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.role === "Administrator" ? "bg-primary-50 text-primary-700" : "bg-ink-100 text-ink-600"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-ink-600 hidden md:table-cell">{u.inspections}</td>
                      <td className="px-3 py-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.status === "Active" ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button className="h-8 w-8 rounded-lg hover:bg-ink-100 inline-flex items-center justify-center">
                          <MoreVertical className="h-4 w-4 text-ink-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Invite User"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} loading={inviting}>{inviting ? "" : "Send Invite"}</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleInvite}>
          <Input label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option>Inspector</option>
            <option>Administrator</option>
          </Select>
          {formError && <p className="text-xs font-semibold text-danger-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  );
}
