import { outcomeInfo } from '#/lib/classify'
import type { TimelineItem } from '#/hooks/useDemoSession'

type Leg = {
  active: boolean
  dashed?: boolean
  color: string
  request?: string
  response?: string
}

/** Your code → Browser cache → Server, showing how far the latest request travelled. */
export function CacheFlowDiagram({
  latest,
}: {
  latest: TimelineItem | undefined
}) {
  const outcome = latest?.outcome
  const entry = latest?.serverEntries[0]
  const conditional = entry
    ? Object.entries(entry.requestHeaders)
        .filter(([k]) => k.startsWith('If-'))
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    : ''
  const color = outcome ? outcomeInfo[outcome].stroke : 'text-slate-300'
  const ms = latest ? `${Math.round(latest.result.durationMs)} ms` : ''

  let left: Leg = { active: false, color: 'text-slate-300' }
  let right: Leg = { active: false, color: 'text-slate-300' }
  let cacheNote = 'Waiting for your first request…'
  let serverNote = 'Logs every request it receives'

  switch (outcome) {
    case 'cache':
      left = {
        active: true,
        color,
        request: 'fetch()',
        response: `fresh copy (${ms})`,
      }
      right = {
        active: false,
        color: 'text-slate-300',
        dashed: true,
        request: 'not contacted',
      }
      cacheNote = 'HIT: copy is fresh, use it'
      serverNote = 'Heard nothing 😴'
      break
    case 'revalidated':
      left = {
        active: true,
        color,
        request: 'fetch()',
        response: `cached body, reused (${ms})`,
      }
      right = {
        active: true,
        color,
        request: conditional || 'conditional request',
        response: '304 Not Modified (no body)',
      }
      cacheNote = 'Copy is stale → ask server if it changed'
      serverNote = 'Same version → 304'
      break
    case 'downloaded':
      left = {
        active: true,
        color,
        request: 'fetch()',
        response: `new body (${ms})`,
      }
      right = {
        active: true,
        color,
        request: conditional || 'full request',
        response: '200 OK + full body',
      }
      cacheNote = conditional
        ? 'Copy is stale → ask server if it changed'
        : 'MISS: nothing usable → go to server'
      serverNote = conditional ? 'Changed → sends new version' : 'Sends everything'
      break
    case 'stale-revalidating':
      left = {
        active: true,
        color,
        request: 'fetch()',
        response: `stale copy, instantly (${ms})`,
      }
      right = {
        active: true,
        color,
        dashed: true,
        request: 'background refresh',
        response: `${entry?.status ?? 200} (stored for next time)`,
      }
      cacheNote = 'Stale but in SWR window → answer now, refresh later'
      serverNote = 'Refresh happened in background'
      break
    case 'error':
      left = { active: true, color, request: 'fetch()', response: 'failed' }
      cacheNote = 'Request failed'
      serverNote = 'Unreachable?'
      break
  }

  return (
    <div
      key={latest?.id}
      className="flex flex-col items-stretch gap-1 md:flex-row md:items-center"
    >
      <Node
        icon="🧑‍💻"
        title="Your JavaScript"
        note="calls fetch(url)"
        active={!!outcome}
      />
      <Arrow leg={left} />
      <Node
        icon="🗄️"
        title="Browser HTTP cache"
        note={cacheNote}
        active={!!outcome}
        highlight={outcome === 'cache' || outcome === 'stale-revalidating'}
      />
      <Arrow leg={right} />
      <Node
        icon="🖥️"
        title="Server (ASP.NET Core)"
        note={serverNote}
        active={right.active}
      />
    </div>
  )
}

function Node({
  icon,
  title,
  note,
  active,
  highlight,
}: {
  icon: string
  title: string
  note: string
  active: boolean
  highlight?: boolean
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center rounded-xl border-2 px-3 py-3 text-center transition-all duration-500 md:max-w-56 ${
        highlight
          ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100'
          : active
            ? 'border-slate-300 bg-white'
            : 'border-dashed border-slate-200 bg-slate-50 opacity-70'
      }`}
    >
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <span className="text-sm font-semibold text-slate-800">{title}</span>
      <span className="mt-0.5 text-xs text-slate-500">{note}</span>
    </div>
  )
}

function Arrow({ leg }: { leg: Leg }) {
  const line = `${leg.dashed ? 'border-dashed' : 'border-solid'} ${leg.active ? 'border-current' : 'border-slate-300'}`
  return (
    <div
      className={`relative flex min-w-0 flex-1 flex-col justify-center gap-1 px-1 py-2 md:py-0 ${leg.color}`}
    >
      <ArrowRow
        label={leg.request}
        line={line}
        direction="right"
        active={leg.active}
      />
      {leg.response && (
        <ArrowRow
          label={leg.response}
          line={line}
          direction="left"
          active={leg.active}
        />
      )}
    </div>
  )
}

function ArrowRow({
  label,
  line,
  direction,
  active,
}: {
  label?: string
  line: string
  direction: 'left' | 'right'
  active: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="max-w-full px-1 text-center font-mono text-[11px] leading-4 whitespace-pre-line text-slate-600">
        {label}
      </span>
      <div className="relative flex w-full items-center">
        {direction === 'left' && (
          <span className="text-xs leading-none">◀</span>
        )}
        <div className={`relative h-0 flex-1 border-t-2 ${line}`}>
          {active && (
            <span
              className={`absolute -top-[5px] h-2 w-2 rounded-full bg-current ${direction === 'right' ? 'packet-right' : 'packet-left'}`}
            />
          )}
        </div>
        {direction === 'right' && (
          <span className="text-xs leading-none">▶</span>
        )}
      </div>
    </div>
  )
}
