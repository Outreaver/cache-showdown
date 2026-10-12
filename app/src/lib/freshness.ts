/** Our model of the copy sitting in the browser cache (the browser won't show us the real one). */
export interface CachedCopy {
  /** When the server produced (or last re-validated) this copy, in ms since epoch. */
  storedAt: number
  /** Response headers of the copy, lower-case names. */
  headers: Record<string, string>
}

export type Directives = Map<string, string | true>

/** "max-age=10, no-cache" -> { max-age: "10", no-cache: true } */
export function parseCacheControl(value: string | undefined): Directives {
  const directives: Directives = new Map()
  if (!value) return directives
  for (const part of value.split(',')) {
    const [rawName, ...rest] = part.split('=')
    const name = rawName.trim().toLowerCase()
    if (!name) continue
    directives.set(
      name,
      rest.length ? rest.join('=').trim().replace(/^"|"$/g, '') : true,
    )
  }
  return directives
}

export interface Freshness {
  /** False when the response said `no-store`: nothing was kept. */
  stored: boolean
  /** How many seconds the copy is fresh for (0 = stale immediately). */
  lifetime: number
  /** Where the lifetime came from. */
  source: 'max-age' | 'expires' | 'no-cache' | 'heuristic' | 'none'
  /** Extra seconds during which a stale copy may be served while refreshing (stale-while-revalidate). */
  swr: number
  /** Can the browser cheaply check a stale copy (ETag or Last-Modified)? */
  hasValidator: boolean
}

const seconds = (value: string | true | undefined) => {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Rough version of the freshness rules from RFC 9111 §4.2, as seen by a browser (private) cache. */
export function computeFreshness(
  headers: Record<string, string | undefined>,
): Freshness {
  const cc = parseCacheControl(headers['cache-control'])
  const hasValidator = Boolean(headers['etag'] || headers['last-modified'])
  const swr = seconds(cc.get('stale-while-revalidate'))

  if (cc.has('no-store'))
    return { stored: false, lifetime: 0, source: 'none', swr: 0, hasValidator }
  if (cc.has('no-cache'))
    return {
      stored: true,
      lifetime: 0,
      source: 'no-cache',
      swr: 0,
      hasValidator,
    }
  if (cc.has('max-age'))
    return {
      stored: true,
      lifetime: seconds(cc.get('max-age')),
      source: 'max-age',
      swr,
      hasValidator,
    }

  const date = Date.parse(headers['date'] ?? '')
  const expires = headers['expires']
  if (expires !== undefined) {
    const expiresAt = Date.parse(expires)
    const lifetime =
      Number.isNaN(expiresAt) || Number.isNaN(date)
        ? 0
        : Math.max(0, (expiresAt - date) / 1000)
    return { stored: true, lifetime, source: 'expires', swr, hasValidator }
  }

  // No explicit lifetime but a Last-Modified date: browsers guess ~10% of the document's age.
  const lastModified = Date.parse(headers['last-modified'] ?? '')
  if (!Number.isNaN(lastModified) && !Number.isNaN(date)) {
    return {
      stored: true,
      lifetime: Math.max(0, (date - lastModified) / 1000) * 0.1,
      source: 'heuristic',
      swr,
      hasValidator,
    }
  }

  return { stored: true, lifetime: 0, source: 'none', swr, hasValidator }
}

export function lowerCaseKeys(
  headers: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  )
}
