import { Directives } from './Prose'
import { headerDocs } from '#/lib/headerDocs'

const canonical = (name: string) =>
  name === 'etag'
    ? 'ETag'
    : name.replace(
    /(^|-)([a-z])/g,
    (_, dash: string, c: string) => dash + c.toUpperCase(),
  )

/**
 * Shows headers as `Name: value` lines. Only the names in `show` are listed (in that order),
 * names in `highlight` are emphasised. Missing headers can be shown as "(not sent)".
 */
export function HeaderView({
  headers,
  show,
  highlight = [],
  showMissing = false,
}: {
  headers: Record<string, string>
  show: Array<string>
  highlight?: Array<string>
  showMissing?: boolean
}) {
  const lower: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  )
  const rows = show.filter((name) => showMissing || name in lower)

  if (rows.length === 0)
    return (
      <p className="font-mono text-xs text-slate-400 italic">
        (no caching headers)
      </p>
    )

  return (
    <dl className="space-y-0.5 font-mono text-xs leading-5 break-all">
      {rows.map((name) => {
        const value = lower[name]
        const marked = highlight.includes(name) && value !== undefined
        return (
          <div
            key={name}
            className={marked ? '-mx-1 rounded bg-amber-100 px-1' : undefined}
          >
            <dt
              className="inline cursor-help font-semibold text-slate-700"
              title={headerDocs[name]}
            >
              {canonical(name)}:
            </dt>{' '}
            <dd className="inline text-slate-600">
              {value === undefined ? (
                <span className="text-slate-400 italic">(not sent)</span>
              ) : name === 'cache-control' ? (
                <Directives value={value} />
              ) : (
                value
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
