import { outcomeInfo } from '#/lib/classify'
import type { Outcome } from '#/lib/classify'

export function OutcomeBadge({
  outcome,
  size = 'md',
}: {
  outcome: Outcome
  size?: 'sm' | 'md'
}) {
  const info = outcomeInfo[outcome]
  return (
    <span
      title={info.short}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ring-1 ${info.badge} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <span aria-hidden>{info.icon}</span>
      {info.label}
    </span>
  )
}
