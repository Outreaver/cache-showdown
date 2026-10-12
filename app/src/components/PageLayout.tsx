import { PageLink } from './PageLink'
import { pages } from '#/lessons/registry'
import type { Page } from '#/lessons/registry'

/** Title, content and previous/next navigation for one page. */
export function PageLayout({ page }: { page: Page }) {
  const index = pages.indexOf(page)
  const prev = index > 0 ? pages[index - 1] : undefined
  const next = index < pages.length - 1 ? pages[index + 1] : undefined
  const { Content } = page

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
      <p className="text-sm font-semibold text-indigo-600">
        {index === 0 ? 'Start here' : `${index} / ${pages.length - 1}`}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        {page.title}
      </h1>
      <p className="mt-2 text-lg text-slate-500">{page.subtitle}</p>
      <div className="mt-6">
        <Content />
      </div>

      <nav className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
        {prev ? (
          <PageLink
            page={prev}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-indigo-300"
          >
            <span className="block text-xs text-slate-500">← Previous</span>
            <span className="font-semibold text-slate-800">{prev.title}</span>
          </PageLink>
        ) : (
          <span />
        )}
        {next && (
          <PageLink
            page={next}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-right hover:border-indigo-400"
          >
            <span className="block text-xs text-indigo-600">Next →</span>
            <span className="font-semibold text-indigo-900">{next.title}</span>
          </PageLink>
        )}
      </nav>
    </article>
  )
}
