type TabItem<T extends string> = { id: T; label: string }

type ModuleTabBarProps<T extends string> = {
  tabs: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  className?: string
}

/** Segmen tab seperti header Manajemen Kasus BK (rounded, teal). */
export function ModuleTabBar<T extends string>({
  tabs,
  value,
  onChange,
  className = '',
}: ModuleTabBarProps<T>) {
  return (
    <div
      role="tablist"
      className={`flex flex-wrap gap-2 rounded-xl bg-teal-50/80 p-1 ring-1 ring-teal-100 ${className}`}
    >
      {tabs.map((t) => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              active
                ? 'bg-white text-teal-900 shadow-sm'
                : 'text-teal-800/80 hover:text-teal-900'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
