import { useCallback, useEffect, useRef, useState } from 'react'
import {
  changeResource as apiChangeResource,
  deleteSession,
  getLog,
  sendDemoRequest,
} from '#/lib/api'
import type { FetchResult, SendOptions, ServerLogEntry } from '#/lib/api'
import { classify } from '#/lib/classify'
import type { Outcome } from '#/lib/classify'
import { computeFreshness, lowerCaseKeys } from '#/lib/freshness'
import type { CachedCopy } from '#/lib/freshness'

export interface TimelineItem {
  id: number
  clickedAt: number
  options: SendOptions
  result: FetchResult
  outcome: Outcome
  /** Requests that reached the server because of this click. */
  serverEntries: Array<ServerLogEntry>
}

/** How long to keep watching for a background request (stale-while-revalidate) after a cache hit. */
const BACKGROUND_WATCH_MS = 800

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const newSessionId = () => crypto.randomUUID().slice(0, 8)

/**
 * Drives one demo: sends requests to `endpoint(session)`, then reads the server log
 * to work out what the browser cache did.
 */
export function useDemoSession(endpoint: (session: string) => string) {
  // Created on the client only, so server rendering and hydration agree.
  const [session, setSession] = useState<string | null>(null)
  const [items, setItems] = useState<Array<TimelineItem>>([])
  const [cachedCopy, setCachedCopy] = useState<CachedCopy | null>(null)
  const [sending, setSending] = useState(false)
  const [serverVersion, setServerVersion] = useState({
    version: 1,
    eTag: '"v1"',
  })
  const lastSeen = useRef(0)
  const nextId = useRef(1)

  useEffect(() => setSession(newSessionId()), [])

  const newEntriesSince = async (s: string) => {
    try {
      const log = await getLog(s)
      setServerVersion({ version: log.version, eTag: log.eTag })
      return log.entries.filter((e) => e.requestNumber > lastSeen.current)
    } catch {
      return []
    }
  }

  const send = useCallback(
    async (options: SendOptions = {}) => {
      if (!session || sending) return
      setSending(true)
      const id = nextId.current++
      const clickedAt = Date.now()

      const result = await sendDemoRequest(endpoint(session), options)
      let entries = await newEntriesSince(session)
      let outcome = classify(result, entries, false)
      if (entries.length)
        lastSeen.current = Math.max(...entries.map((e) => e.requestNumber))

      setItems((prev) => [
        { id, clickedAt, options, result, outcome, serverEntries: entries },
        ...prev,
      ])

      // A cache hit might have started a background refresh (stale-while-revalidate). Watch for it.
      if (outcome === 'cache') {
        await sleep(BACKGROUND_WATCH_MS)
        const late = await newEntriesSince(session)
        if (late.length) {
          lastSeen.current = Math.max(...late.map((e) => e.requestNumber))
          entries = late
          outcome = classify(result, late, true)
          setItems((prev) =>
            prev.map((it) =>
              it.id === id ? { ...it, outcome, serverEntries: late } : it,
            ),
          )
        }
      }

      if (options.cacheMode !== 'no-store') {
        setCachedCopy((prev) => nextCachedCopy(prev, result, outcome, entries))
      }
      setSending(false)
    },
    [endpoint, session, sending],
  )

  const reset = useCallback(async () => {
    if (session) void deleteSession(session).catch(() => {})
    lastSeen.current = 0
    setItems([])
    setCachedCopy(null)
    setServerVersion({ version: 1, eTag: '"v1"' })
    setSession(newSessionId())
  }, [session])

  const changeResource = useCallback(async () => {
    if (!session) return
    const v = await apiChangeResource(session)
    setServerVersion(v)
  }, [session])

  return {
    session,
    items,
    cachedCopy,
    sending,
    serverVersion,
    send,
    reset,
    changeResource,
  }
}

/** Update our model of the browser's cached copy after a request. */
function nextCachedCopy(
  prev: CachedCopy | null,
  result: FetchResult,
  outcome: Outcome,
  entries: Array<ServerLogEntry>,
): CachedCopy | null {
  const at = (iso: string) => Date.parse(iso)
  switch (outcome) {
    case 'downloaded':
      if (!result.body || !computeFreshness(result.headers).stored) return null
      return { storedAt: at(result.body.serverTime), headers: result.headers }
    case 'revalidated': {
      // A 304 refreshes the stored copy: its freshness clock restarts now.
      const entry = entries.find((e) => e.status === 304) ?? entries[0]
      return { storedAt: at(entry.time), headers: result.headers }
    }
    case 'stale-revalidating': {
      const entry = entries[entries.length - 1]
      return {
        storedAt: at(entry.time),
        headers: lowerCaseKeys({ ...result.headers, ...entry.responseHeaders }),
      }
    }
    case 'cache':
      return (
        prev ??
        (result.body
          ? { storedAt: at(result.body.serverTime), headers: result.headers }
          : null)
      )
    case 'error':
      return prev
  }
}
