import type { ReactNode } from 'react'
import { directiveDocs, headerDocs } from '#/lib/headerDocs'

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-10 mb-3 text-2xl font-semibold tracking-tight text-slate-900">
      {children}
    </h2>
  )
}

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-900">
      {children}
    </h3>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p className="my-3 leading-7 text-slate-700">{children}</p>
}

/** Inline code. */
export function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800 ring-1 ring-slate-200">
      {children}
    </code>
  )
}

export function Steps({ children }: { children: ReactNode }) {
  return (
    <ol className="my-3 list-decimal space-y-2 pl-6 leading-7 text-slate-700 marker:font-semibold">
      {children}
    </ol>
  )
}

export function Bullets({ children }: { children: ReactNode }) {
  return (
    <ul className="my-3 list-disc space-y-2 pl-6 leading-7 text-slate-700">
      {children}
    </ul>
  )
}

/**
 * A raw HTTP message, e.g. `GET /photo.jpg HTTP/1.1` followed by headers.
 * Header names we know get a tooltip; lines listed in `highlight` are emphasised.
 */
export function HttpMessage({
  title,
  lines,
  highlight = [],
}: {
  title?: string
  lines: Array<string>
  highlight?: Array<string>
}) {
  const marked = highlight.map((h) => h.toLowerCase())
  return (
    <figure className="my-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-sm">
      {title && (
        <figcaption className="border-b border-slate-800 px-4 py-2 text-xs font-medium text-slate-400">
          {title}
        </figcaption>
      )}
      <pre className="overflow-x-auto px-4 py-3 font-mono leading-6 text-slate-200">
        {lines.map((line, i) => {
          const colon = line.indexOf(':')
          const name =
            colon > 0 && !line.includes(' HTTP/') && !line.startsWith('HTTP/')
              ? line.slice(0, colon)
              : null
          const isMarked = name !== null && marked.includes(name.toLowerCase())
          return (
            <div
              key={i}
              className={isMarked ? '-mx-4 bg-amber-400/15 px-4' : undefined}
            >
              {name ? (
                <>
                  <span
                    className={
                      isMarked ? 'font-semibold text-amber-300' : 'text-sky-300'
                    }
                    title={headerDocs[name.toLowerCase()]}
                  >
                    {name}
                  </span>
                  <span className="text-slate-300">{line.slice(colon)}</span>
                </>
              ) : (
                <span
                  className={i === 0 ? 'text-emerald-300' : 'text-slate-400'}
                >
                  {line || ' '}
                </span>
              )}
            </div>
          )
        })}
      </pre>
    </figure>
  )
}

/** A Cache-Control value where each directive explains itself on hover. */
export function Directives({ value }: { value: string }) {
  const parts = value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return (
    <>
      {parts.map((part, i) => {
        const name = part.split('=')[0].toLowerCase()
        const doc = directiveDocs[name]
        return (
          <span key={i}>
            {i > 0 && ', '}
            <span
              className={
                doc
                  ? 'cursor-help underline decoration-dotted underline-offset-2'
                  : undefined
              }
              title={doc}
            >
              {part}
            </span>
          </span>
        )
      })}
    </>
  )
}
