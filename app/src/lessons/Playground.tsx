import { useEffect, useState } from 'react'
import { Callout } from '#/components/Callout'
import { DemoPanel } from '#/components/DemoPanel'
import { Directives, C, P } from '#/components/Prose'
import { getPlaygroundConfig, putPlaygroundConfig } from '#/lib/api'
import type { PlaygroundConfig } from '#/lib/api'

const quickDirectives = [
  'max-age=10',
  'max-age=60',
  'no-cache',
  'no-store',
  'private',
  'public',
  'must-revalidate',
  'stale-while-revalidate=20',
  'immutable',
  's-maxage=600',
]

export function Playground() {
  return (
    <>
      <P>
        Build any response you like and see how your browser treats it. Set the
        headers, press <strong>Apply to server</strong>, then send requests. You
        can also change how the <em>request</em> is made with <C>fetch()</C>
        &apos;s <C>cache</C> option, which is how reload and hard reload behave.
      </P>
      <Callout kind="try" title="Experiments worth doing">
        <ul>
          <li>
            <strong>You can&apos;t take it back:</strong> apply{' '}
            <C>max-age=60</C>, send once, then apply <C>no-store</C> and send
            again. The browser keeps using its copy: it never asked the server,
            so it doesn&apos;t know the rules changed.
          </li>
          <li>
            <strong>Heuristic caching:</strong> empty Cache-Control, tick
            Last-Modified only, press Change resource, wait ~20 s, send twice.
          </li>
          <li>
            <strong>Reload vs hard reload:</strong> with <C>max-age=60</C> and
            an ETag, compare <C>cache: &apos;no-cache&apos;</C> (304) with{' '}
            <C>cache: &apos;reload&apos;</C> (200).
          </li>
          <li>
            <strong>force-cache:</strong> let a copy go stale, then send with{' '}
            <C>cache: &apos;force-cache&apos;</C>. Stale or not, it&apos;s used.
          </li>
          <li>
            <strong>Unknown directives are ignored:</strong> type{' '}
            <C>max-age=10, banana</C>.
          </li>
        </ul>
      </Callout>

      <DemoPanel
        scenario="playground"
        title="Playground"
        showChangeResource
        showLanguage
        showCacheMode
      >
        {(session) => <PlaygroundForm session={session} />}
      </DemoPanel>
    </>
  )
}

function PlaygroundForm({ session }: { session: string | null }) {
  const [config, setConfig] = useState<PlaygroundConfig | null>(null)
  const [applied, setApplied] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!session) return
    getPlaygroundConfig(session)
      .then((c) => {
        setConfig(c)
        setApplied(JSON.stringify(c))
        setError('')
      })
      .catch(() =>
        setError(
          'Could not reach the API. Is it running on http://localhost:5201?',
        ),
      )
  }, [session])

  if (!config)
    return (
      <p className="mb-3 text-sm text-slate-500">
        {error || 'Loading server settings…'}
      </p>
    )

  const update = (patch: Partial<PlaygroundConfig>) =>
    setConfig({ ...config, ...patch })
  const dirty = JSON.stringify(config) !== applied

  const apply = async () => {
    if (!session) return
    try {
      const saved = await putPlaygroundConfig(session, config)
      setApplied(JSON.stringify(saved))
      setError('')
    } catch {
      setError('Saving failed.')
    }
  }

  const addDirective = (d: string) => {
    const name = d.split('=')[0]
    const parts = (config.cacheControl ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p && p.split('=')[0] !== name)
    update({ cacheControl: [...parts, d].join(', ') })
  }

  const input =
    'rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-mono text-sm'

  return (
    <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-indigo-900">
        Response headers the server will send
      </h4>

      <label className="block text-sm text-slate-700">
        <span className="font-mono font-semibold">Cache-Control:</span>
        <input
          className={`${input} mt-1 w-full`}
          value={config.cacheControl ?? ''}
          placeholder="(not sent)"
          onChange={(e) => update({ cacheControl: e.target.value || null })}
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {quickDirectives.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => addDirective(d)}
            className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 font-mono text-xs text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
          >
            + {d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => update({ cacheControl: null })}
          className="px-2 text-xs text-slate-500 hover:text-slate-800"
        >
          clear
        </button>
      </div>
      {config.cacheControl && (
        <p className="mt-2 text-xs text-slate-500">
          Hover to read:{' '}
          <span className="font-mono text-slate-700">
            <Directives value={config.cacheControl} />
          </span>
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={config.eTag}
            onChange={(e) => update({ eTag: e.target.checked })}
          />
          <span>
            Send <span className="font-mono">ETag</span>
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={config.lastModified}
            onChange={(e) => update({ lastModified: e.target.checked })}
          />
          <span>
            Send <span className="font-mono">Last-Modified</span>
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span className="font-mono">Expires:</span> now +
          <input
            type="number"
            className={`${input} w-20`}
            value={config.expiresInSeconds ?? ''}
            placeholder="—"
            onChange={(e) =>
              update({
                expiresInSeconds:
                  e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
          s
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span className="font-mono">Vary:</span>
          <input
            className={`${input} flex-1`}
            value={config.vary ?? ''}
            placeholder="(not sent)"
            onChange={(e) => update({ vary: e.target.value || null })}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void apply()}
          disabled={!dirty}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
        >
          Apply to server
        </button>
        <span className="text-xs text-slate-500">
          {dirty
            ? 'Not applied yet: the server still sends the old headers.'
            : '✓ The server is sending these headers.'}
        </span>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  )
}
