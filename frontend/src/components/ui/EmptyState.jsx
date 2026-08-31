export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="h-16 w-16 rounded-2xl bg-ink-100 border border-ink-200 flex items-center justify-center mb-4">
          <Icon className="h-7 w-7 text-ink-400" />
        </div>
      )}
      <h3 className="text-base font-bold text-ink-800">{title}</h3>
      {description && <p className="text-sm text-ink-500 mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
