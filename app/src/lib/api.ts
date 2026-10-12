/** Body the demo endpoints return with every full (200) response. */
export interface DemoBody {
  requestNumber: number
  serverTime: string
  version: number
  scenario: string
  language: string
  message: string
}

/** One request that actually reached the server. Browser cache hits never appear here. */
export interface ServerLogEntry {
  requestNumber: number
  time: string
  path: string
  status: number
  requestHeaders: Record<string, string>
  responseHeaders: Record<string, string>
  note: string
}

export interface SessionLog {
  version: number
  eTag: string
  lastModified: string
  entries: Array<ServerLogEntry>
}

export interface PlaygroundConfig {
  cacheControl: string | null
  eTag: boolean
  lastModified: boolean
  expiresInSeconds: number | null
  vary: string | null
}

/** What our JavaScript saw after calling fetch(). */
export interface FetchResult {
  ok: boolean
  /** The status fetch() reports. A 304 from the server still shows up here as 200! */
  status: number
  durationMs: number
  headers: Record<string, string>
  body: DemoBody | null
  error?: string
}

export interface SendOptions {
  /** The fetch() `cache` option, see https://developer.mozilla.org/docs/Web/API/Request/cache */
  cacheMode?: RequestCache
  acceptLanguage?: string
}

export async function sendDemoRequest(
  url: string,
  options: SendOptions = {},
): Promise<FetchResult> {
  const start = performance.now()
  try {
    // A completely normal fetch: it goes through the browser's real HTTP cache.
    const response = await fetch(url, {
      cache: options.cacheMode ?? 'default',
      headers: options.acceptLanguage
        ? { 'Accept-Language': options.acceptLanguage }
        : undefined,
    })
    const body = (await response.json()) as DemoBody
    const durationMs = performance.now() - start
    return {
      ok: response.ok,
      status: response.status,
      durationMs,
      headers: Object.fromEntries(response.headers.entries()),
      body,
    }
  } catch (e) {
    return {
      ok: false,
      status: 0,
      durationMs: performance.now() - start,
      headers: {},
      body: null,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

async function sessionApi<T>(
  session: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `/api/session/${encodeURIComponent(session)}${path}`,
    {
      cache: 'no-store',
      ...init,
    },
  )
  if (!response.ok) throw new Error(`API responded ${response.status}`)
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T)
}

export const getLog = (session: string) =>
  sessionApi<SessionLog>(session, '/log')

export const changeResource = (session: string) =>
  sessionApi<{ version: number; eTag: string }>(session, '/change-resource', {
    method: 'POST',
  })

export const deleteSession = (session: string) =>
  sessionApi<void>(session, '', { method: 'DELETE' })

export const getPlaygroundConfig = (session: string) =>
  sessionApi<PlaygroundConfig>(session, '/playground')

export const putPlaygroundConfig = (
  session: string,
  config: PlaygroundConfig,
) =>
  sessionApi<PlaygroundConfig>(session, '/playground', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
