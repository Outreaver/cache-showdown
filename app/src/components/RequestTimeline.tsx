import type { ReactNode } from 'react'
import { HeaderView } from './HeaderView'
import { OutcomeBadge } from './OutcomeBadge'
import { outcomeInfo } from '#/lib/classify'
import { cacheHeaderNames } from '#/lib/headerDocs'
import type { TimelineItem } from '#/hooks/useDemoSession'

const requestHeaderNames = [
  'if-none-match',
  'if-modified-since',
  'cache-control',
  'pragma',
  'accept-language',
]

/** One card per click, newest first. */
export function RequestTimeline({ items }: { items: Array<TimelineItem> }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
        No requests yet. Press <strong>Send request</strong> to start.
      </p>
    )
  }
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <TimelineCard
          key={item.id}
          item={item}
          clickNumber={items.length - i}
          isLatest={i === 0}
        />
      ))}
    </ol>
  )
}

function TimelineCard({
  item,
  clickNumber,
  isLatest,
}: {
  item: TimelineItem
  clickNumber: number
  isLatest: boolean
}) {
  const { result, outcome, serverEntries } = item
  const sawServer304 = serverEntries.some((e) => e.status === 304)
  const askedConditionally = serverEntries.some((e) =>
    Object.keys(e.requestHeaders).some((k) => k.startsWith('If-')),
  )
  const explanation =
    outcome === 'downloaded' && askedConditionally
      ? 'The browser\u2019s copy was stale, so it asked the server "has this changed?". It had, so the server sent the new version in full.'
      : outcomeInfo[outcome].short
  const body = result.body
  const oldBody =
    body &&
    serverEntries.length > 0 &&
    serverEntries.every((e) => e.requestNumber !== body.requestNumber)

  return (
    <li
      className={`rounded-xl border bg-white p-4 transition-shadow ${isLatest ? 'border-slate-300 shadow-md' : 'border-slate-200 opacity-90'}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-sm font-semibold text-slate-500">
          Click #{clickNumber}
        </span>
        <span className="text-xs text-slate-400">
          {new Date(item.clickedAt).toLocaleTimeString()}
        </span>
        <OutcomeBadge outcome={outcome} />
        <span
          className={`font-mono text-sm ${result.durationMs < 50 ? 'font-semibold text-emerald-700' : 'text-slate-600'}`}
          title="How long fetch() took. The server adds ~300 ms of fake network delay."
        >
          {Math.round(result.durationMs)} ms
        </span>
        {item.options.acceptLanguage && (
          <Tag>Accept-Language: {item.options.acceptLanguage}</Tag>
        )}
        {item.options.cacheMode && item.options.cacheMode !== 'default' && (
          <Tag>fetch cache: '{item.options.cacheMode}'</Tag>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {explanation}
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <section className="rounded-lg bg-slate-50 p-3">
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            What your JavaScript got
          </h4>
          {result.error ? (
            <p className="text-sm text-red-700">{result.error}</p>
          ) : (
            <>
              <p className="text-sm text-slate-700">
                <code className="font-mono">response.status</code> ={' '}
                <strong>{result.status}</strong>
                {sawServer304 && (
                  <span className="ml-1 text-xs text-sky-700">
                    ← even though the server sent 304! The browser turns it back
                    into the cached 200, your code never sees the 304.
                  </span>
                )}
              </p>
              {body && (
                <p className="mt-1 text-sm text-slate-700">
                  Body: <strong>request #{body.requestNumber}</strong>, version{' '}
                  {body.version}, “{body.message.split(' This')[0]}”
                  {(outcome === 'cache' || oldBody) && (
                    <span className="ml-1 text-xs text-slate-500">
                      (an old body, made earlier)
                    </span>
                  )}
                </p>
              )}
              <div className="mt-2">
                <HeaderView
                  headers={result.headers}
                  show={cacheHeaderNames}
                  highlight={[
                    'cache-control',
                    'expires',
                    'etag',
                    'last-modified',
                    'vary',
                  ]}
                />
              </div>
            </>
          )}
        </section>

        <section className="rounded-lg bg-slate-50 p-3">
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            What reached the server
          </h4>
          {serverEntries.length === 0 ? (
            <p className="text-sm text-slate-700">
              <strong>Nothing.</strong> The server has no idea you clicked. 😴
            </p>
          ) : (
            serverEntries.map((e) => (
              <div key={e.requestNumber} className="mb-2 last:mb-0">
                <p className="mb-1 text-sm text-slate-700">
                  Request #{e.requestNumber}
                  {outcome === 'stale-revalidating' && (
                    <span className="text-violet-700">
                      {' '}
                      (sent in the background)
                    </span>
                  )}{' '}
                  → server replied{' '}
                  <strong
                    className={
                      e.status === 304 ? 'text-sky-700' : 'text-amber-700'
                    }
                  >
                    {e.status === 304 ? '304 Not Modified' : '200 OK'}
                  </strong>
                </p>
                <HeaderView
                  headers={e.requestHeaders}
                  show={requestHeaderNames.filter(
                    (n) =>
                      n.startsWith('if-') || n in lowerKeys(e.requestHeaders),
                  )}
                  highlight={['if-none-match', 'if-modified-since']}
                  showMissing
                />
                <p className="mt-1 text-xs text-slate-500 italic">{e.note}</p>
              </div>
            ))
          )}
        </section>
      </div>
    </li>
  )
}

const lowerKeys = (headers: Record<string, string>) =>
  Object.fromEntries(Object.keys(headers).map((k) => [k.toLowerCase(), true]))

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
      {children}
    </span>
  )
}
