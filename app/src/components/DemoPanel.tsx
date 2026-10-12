import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { CacheFlowDiagram } from './CacheFlowDiagram'
import { FreshnessBar } from './FreshnessBar'
import { RequestTimeline } from './RequestTimeline'
import { useDemoSession } from '#/hooks/useDemoSession'

const languages = [
  { value: 'en', label: '🇬🇧 English' },
  { value: 'pl', label: '🇵🇱 Polski' },
  { value: 'de', label: '🇩🇪 Deutsch' },
]

export const cacheModes: Array<{
  value: RequestCache
  label: string
  help: string
}> = [
  {
    value: 'default',
    label: "'default'",
    help: 'Normal behaviour: follow the response headers.',
  },
  {
    value: 'no-cache',
    label: "'no-cache'",
    help: 'Always check with the server first (like pressing F5 / reload).',
  },
  {
    value: 'reload',
    label: "'reload'",
    help: 'Ignore the cache, download again, store the result (like Ctrl+Shift+R / hard reload).',
  },
  {
    value: 'no-store',
    label: "'no-store'",
    help: 'Ignore the cache completely and don’t store the result.',
  },
  {
    value: 'force-cache',
    label: "'force-cache'",
    help: 'Use any cached copy, even a stale one. Only go to the server if there is none.',
  },
]

interface DemoPanelProps {
  /** Scenario name on the API (`/api/demo/{scenario}`), or "playground". */
  scenario: string
  title?: string
  /** Show the headers this endpoint sends, as a reminder. */
  headers?: Array<string>
  showChangeResource?: boolean
  showLanguage?: boolean
  showCacheMode?: boolean
  /** Extra controls rendered above the buttons (playground config form). */
  children?: (session: string | null) => ReactNode
}

/** A live, self-contained demo: buttons, flow diagram, freshness bar and request timeline. */
export function DemoPanel({
  scenario,
  title = 'Live demo',
  headers,
  showChangeResource,
  showLanguage,
  showCacheMode,
  children,
}: DemoPanelProps) {
  const endpoint = useCallback(
    (session: string) =>
      scenario === 'playground'
        ? `/api/playground?session=${session}`
        : `/api/demo/${scenario}?session=${session}`,
    [scenario],
  )
  const demo = useDemoSession(endpoint)
  const [language, setLanguage] = useState('en')
  const [cacheMode, setCacheMode] = useState<RequestCache>('default')
  const latest = demo.items[0]

  return (
    <section className="my-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm md:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">🧪 {title}</h3>
        <span
          className="font-mono text-xs text-slate-400"
          title="Part of the URL, so a new session means an empty cache for this demo."
        >
          GET {demo.session ? endpoint(demo.session) : '…'}
        </span>
      </div>

      {headers && (
        <div className="mb-3 rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-slate-200">
          <span className="text-slate-500">Server responds with: </span>
          {headers.map((h) => (
            <div key={h} className="text-amber-300">
              {h}
            </div>
          ))}
        </div>
      )}

      {children?.(demo.session)}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            void demo.send({
              acceptLanguage: showLanguage ? language : undefined,
              cacheMode: showCacheMode ? cacheMode : undefined,
            })
          }
          disabled={!demo.session || demo.sending}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95 disabled:cursor-wait disabled:opacity-60"
        >
          {demo.sending ? 'Sending…' : 'Send request'}
        </button>

        {showLanguage && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            Language:
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5"
            >
              {languages.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {showCacheMode && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            fetch(url, {'{'} cache: {'}'})
            <select
              value={cacheMode}
              onChange={(e) => setCacheMode(e.target.value as RequestCache)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono"
              title={cacheModes.find((m) => m.value === cacheMode)?.help}
            >
              {cacheModes.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {showChangeResource && (
          <button
            type="button"
            onClick={() => void demo.changeResource()}
            disabled={!demo.session}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            title="Pretend someone edited the content on the server. Its ETag and Last-Modified change."
          >
            ✏️ Change resource on server
          </button>
        )}

        <button
          type="button"
          onClick={() => void demo.reset()}
          disabled={!demo.session || demo.sending}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          title="Start a new session: a new URL, so the browser has nothing cached for it."
        >
          ↺ Reset (empty cache)
        </button>

        {showChangeResource && (
          <span className="ml-auto text-xs text-slate-500">
            Server now has <strong>version {demo.serverVersion.version}</strong>{' '}
            (ETag <code className="font-mono">{demo.serverVersion.eTag}</code>)
          </span>
        )}
      </div>

      {showCacheMode && (
        <p className="mt-2 text-xs text-slate-500">
          {cacheModes.find((m) => m.value === cacheMode)?.help}
        </p>
      )}

      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <CacheFlowDiagram latest={latest} />
      </div>

      <div className="mt-3">
        <FreshnessBar copy={demo.cachedCopy} />
      </div>

      <div className="mt-4">
        <RequestTimeline items={demo.items} />
      </div>
    </section>
  )
}
