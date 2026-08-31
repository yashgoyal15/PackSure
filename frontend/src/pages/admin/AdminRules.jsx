import { useEffect, useState } from "react";
import { Plus, Pencil, GitBranch } from "lucide-react";
import { Card, Input, Select } from "../../components/ui/Primitives";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { listRules, createRule } from "../../api/misc";
import { ApiError } from "../../api/client";
import { useApp } from "../../context/AppContext";
import AdminTabs from "./AdminTabs";

const severityStyle = {
  High: "bg-danger-50 text-danger-700",
  Medium: "bg-warning-50 text-warning-700",
  Low: "bg-ink-100 text-ink-600",
};

export default function AdminRules() {
  const { showToast } = useApp();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ category: "", ruleText: "", severity: "Medium", status: "Draft" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    setLoading(true);
    return listRules()
      .then(setRules)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.category || !form.ruleText) {
      setFormError("Category and rule description are required.");
      return;
    }
    setSaving(true);
    try {
      await createRule(form);
      showToast("Compliance rule created", "success");
      setModalOpen(false);
      setForm({ category: "", ruleText: "", severity: "Medium", status: "Draft" });
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail : "Could not create this rule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-800">Administration</h1>
          <p className="text-sm text-ink-500 mt-1">Manage users and compliance rule configuration</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>New Rule</Button>
      </div>

      <AdminTabs active="rules" />

      <Card className="p-4 mb-5 flex items-center gap-3 bg-primary-50/60 border-primary-100">
        <GitBranch className="h-5 w-5 text-primary-600 shrink-0" />
        <p className="text-xs text-primary-800">
          New rules are created as <strong>Draft</strong> and never affect inspections already saved, preserving traceability.
        </p>
      </Card>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-400 border-b border-ink-100">
                  <th className="font-bold px-5 py-3">Category</th>
                  <th className="font-bold px-3 py-3">Rule Description</th>
                  <th className="font-bold px-3 py-3">Severity</th>
                  <th className="font-bold px-3 py-3">Status</th>
                  <th className="font-bold px-5 py-3 text-right">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/70">
                    <td className="px-5 py-3.5 font-semibold text-ink-800 whitespace-nowrap">{r.category}</td>
                    <td className="px-3 py-3.5 text-ink-600 max-w-md">{r.rule_text}</td>
                    <td className="px-3 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${severityStyle[r.severity]}`}>{r.severity}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.status === "Active" ? "bg-success-50 text-success-700" : "bg-ink-100 text-ink-500"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="h-8 w-8 rounded-lg hover:bg-ink-100 inline-flex items-center justify-center">
                        <Pencil className="h-3.5 w-3.5 text-ink-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Compliance Rule"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}>{saving ? "" : "Save Rule"}</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          <Input label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label="Rule Description" required value={form.ruleText} onChange={(e) => setForm({ ...form, ruleText: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Draft</option>
              <option>Active</option>
            </Select>
          </div>
          {formError && <p className="text-xs font-semibold text-danger-600">{formError}</p>}
        </form>
      </Modal>
    </div>
  );
}
