import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { computeFreshness } from '#/lib/freshness'
import type { CachedCopy } from '#/lib/freshness'

/** Live view of how old the browser's cached copy is: fresh → (stale-while-revalidate) → stale. */
export function FreshnessBar({ copy }: { copy: CachedCopy | null }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(timer)
  }, [])

  if (!copy) {
    return (
      <Shell
        label="Browser cache: empty"
        detail="Nothing stored for this URL yet."
      />
    )
  }

  const f = computeFreshness(copy.headers)
  if (!f.stored) {
    return (
      <Shell
        label="Browser cache: not stored"
        detail="The response said no-store, so the browser threw it away immediately."
        tone="red"
      />
    )
  }

  const age = Math.max(0, (now - copy.storedAt) / 1000)
  const swrEnd = f.lifetime + f.swr
  // Show a bit of the "stale" zone after everything ran out.
  const scale = Math.max(swrEnd * 1.25, f.lifetime + 5, 10)
  const pct = (s: number) => `${Math.min(100, (s / scale) * 100)}%`

  let label: string
  let tone: 'green' | 'violet' | 'amber'
  if (age < f.lifetime) {
    label = `FRESH for ${(f.lifetime - age).toFixed(1)} s more → next request is served from the cache`
    tone = 'green'
  } else if (age < swrEnd) {
    label = `STALE, but inside stale-while-revalidate for ${(swrEnd - age).toFixed(1)} s more → instant answer + background refresh`
    tone = 'violet'
  } else {
    label = f.hasValidator
      ? 'STALE → next request asks the server (with a validator, so maybe a cheap 304)'
      : 'STALE → no ETag/Last-Modified, so the next request downloads everything again'
    tone = 'amber'
  }

  const source = {
    'max-age': `max-age = ${f.lifetime} s`,
    expires: `from Expires − Date = ${f.lifetime.toFixed(0)} s`,
    'no-cache': 'no-cache = stale immediately, always check',
    heuristic: `no max-age/Expires: browser guesses ~10% of time since Last-Modified ≈ ${f.lifetime.toFixed(1)} s`,
    none: 'no freshness info = stale immediately',
  }[f.source]

  return (
    <Shell
      label={label}
      detail={`Copy age ${age.toFixed(1)} s · lifetime: ${source}`}
      tone={tone}
    >
      <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-amber-200">
        <div
          className="absolute inset-y-0 left-0 bg-emerald-400"
          style={{ width: pct(f.lifetime) }}
        />
        {f.swr > 0 && (
          <div
            className="absolute inset-y-0 bg-violet-300"
            style={{ left: pct(f.lifetime), width: pct(f.swr) }}
          />
        )}
        <div
          className="absolute inset-y-0 w-0.5 bg-slate-900 transition-[left] duration-200 ease-linear"
          style={{ left: pct(age) }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>0 s (stored)</span>
        <span className="flex gap-3">
          <Legend className="bg-emerald-400" text="fresh" />
          {f.swr > 0 && (
            <Legend className="bg-violet-300" text="stale-while-revalidate" />
          )}
          <Legend className="bg-amber-200" text="stale" />
        </span>
        <span>{scale.toFixed(0)} s</span>
      </div>
    </Shell>
  )
}

function Legend({ className, text }: { className: string; text: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-2 w-2 rounded-full ${className}`} />
      {text}
    </span>
  )
}

const tones = {
  slate: 'border-slate-200 bg-white',
  green: 'border-emerald-200 bg-emerald-50/50',
  violet: 'border-violet-200 bg-violet-50/50',
  amber: 'border-amber-200 bg-amber-50/50',
  red: 'border-red-200 bg-red-50/50',
}

function Shell({
  label,
  detail,
  tone = 'slate',
  children,
}: {
  label: string
  detail: string
  tone?: keyof typeof tones
  children?: ReactNode
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <div className="text-sm font-semibold text-slate-800">{label}</div>
      <div className="text-xs text-slate-500">{detail}</div>
      {children}
    </div>
  )
}
