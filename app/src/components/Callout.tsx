import type { ReactNode } from 'react'

const styles = {
  try: {
    icon: '👉',
    label: 'Try this',
    box: 'border-indigo-200 bg-indigo-50',
    title: 'text-indigo-900',
  },
  tip: {
    icon: '💡',
    label: 'Tip',
    box: 'border-emerald-200 bg-emerald-50',
    title: 'text-emerald-900',
  },
  warn: {
    icon: '⚠️',
    label: 'Watch out',
    box: 'border-amber-300 bg-amber-50',
    title: 'text-amber-900',
  },
  notice: {
    icon: '🔎',
    label: 'What you should have noticed',
    box: 'border-slate-200 bg-slate-50',
    title: 'text-slate-900',
  },
  analogy: {
    icon: '🥛',
    label: 'Everyday analogy',
    box: 'border-rose-200 bg-rose-50',
    title: 'text-rose-900',
  },
}

export function Callout({
  kind,
  title,
  children,
}: {
  kind: keyof typeof styles
  title?: string
  children: ReactNode
}) {
  const s = styles[kind]
  return (
    <aside className={`my-5 rounded-xl border px-5 py-4 ${s.box}`}>
      <div className={`mb-1 flex items-center gap-2 font-semibold ${s.title}`}>
        <span aria-hidden>{s.icon}</span>
        {title ?? s.label}
      </div>
      <div className="leading-7 text-slate-700 [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </aside>
  )
}
