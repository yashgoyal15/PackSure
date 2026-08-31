import { Link } from "react-router-dom";

export default function AdminTabs({ active }) {
  const tabs = [
    { key: "users", label: "Users", to: "/app/admin/users" },
    { key: "rules", label: "Compliance Rules", to: "/app/admin/rules" },
  ];
  return (
    <div className="flex gap-1 p-1 bg-ink-100 rounded-lg w-fit mb-6">
      {tabs.map((t) => (
        <Link
          key={t.key}
          to={t.to}
          className={`px-4 h-9 flex items-center rounded-md text-sm font-bold transition-colors ${
            active === t.key ? "bg-white text-primary-700 shadow-sm" : "text-ink-500 hover:text-ink-700"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
