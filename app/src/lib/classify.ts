import type { FetchResult, ServerLogEntry } from './api'

/** What the browser cache did for one fetch() call. */
export type Outcome =
  'cache' | 'revalidated' | 'downloaded' | 'stale-revalidating' | 'error'

/**
 * Figures out what happened by comparing what JavaScript received with what the server logged.
 *
 * @param newEntries requests the server logged since the previous click
 * @param background true when those requests only showed up a moment *after* fetch() had already resolved
 */
export function classify(
  result: FetchResult,
  newEntries: Array<ServerLogEntry>,
  background: boolean,
): Outcome {
  if (!result.ok || !result.body) return 'error'

  // The server never heard about this click: the browser answered on its own.
  if (newEntries.length === 0) return 'cache'

  // fetch() already had its answer, the server request came later: a background refresh.
  if (background) return 'stale-revalidating'

  if (newEntries.some((e) => e.status === 304)) return 'revalidated'

  const matching = newEntries.find(
    (e) => e.requestNumber === result.body?.requestNumber,
  )
  return matching ? 'downloaded' : 'stale-revalidating'
}

export interface OutcomeInfo {
  label: string
  icon: string
  short: string
  /** Tailwind classes for the badge. */
  badge: string
  /** Accent color class used by the diagram for this outcome. */
  stroke: string
}

export const outcomeInfo: Record<Outcome, OutcomeInfo> = {
  cache: {
    label: 'From browser cache',
    icon: '⚡',
    short:
      'The browser had a fresh copy and used it. The server was not contacted at all.',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
    stroke: 'text-emerald-500',
  },
  revalidated: {
    label: '304 Not Modified',
    icon: '↺',
    short:
      'The browser’s copy was stale, so it asked the server "has this changed?". The server answered 304 (no body) and the browser reused its copy.',
    badge: 'bg-sky-100 text-sky-800 ring-sky-300',
    stroke: 'text-sky-500',
  },
  downloaded: {
    label: '200 Full download',
    icon: '⬇',
    short:
      'The browser had no usable copy, so the server sent the whole response again.',
    badge: 'bg-amber-100 text-amber-800 ring-amber-300',
    stroke: 'text-amber-500',
  },
  'stale-revalidating': {
    label: 'Stale copy + background refresh',
    icon: '⚡↻',
    short:
      'The browser answered instantly with its stale copy, and at the same time quietly asked the server for a new one, ready for next time.',
    badge: 'bg-violet-100 text-violet-800 ring-violet-300',
    stroke: 'text-violet-500',
  },
  error: {
    label: 'Error',
    icon: '✕',
    short:
      'The request failed. Is the ASP.NET Core API running on http://localhost:5201?',
    badge: 'bg-red-100 text-red-800 ring-red-300',
    stroke: 'text-red-500',
  },
}
