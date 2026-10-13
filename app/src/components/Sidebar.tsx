import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { PageLink } from './PageLink'
import { pages } from '#/lessons/registry'
import type { Page } from '#/lessons/registry'

const STORAGE_KEY = 'cacheshowdown.visited'
const REPO_URL = 'https://github.com/Outreaver/cache-showdown'

const hrefOf = (page: Page) =>
  page.path === '/lessons/$slug' ? `/lessons/${page.slug}` : page.path

function readVisited(): Array<string> {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    ) as Array<string>
  } catch {
    return []
  }
}

/** Lesson list with a ✓ next to the pages you've already opened (remembered in this browser only). */
export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [visited, setVisited] = useState<Array<string>>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const current = pages.find((p) => hrefOf(p) === pathname)
    const next = new Set(readVisited())
    if (current) next.add(current.slug)
    setVisited([...next])
    setOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
    } catch {
      // Storage unavailable (private mode etc.): progress just isn't remembered.
    }
  }, [pathname])

  return (
    <aside className="border-b border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:overflow-y-auto md:border-r md:border-b-0">
      <div className="flex items-center justify-between px-5 py-4">
        <PageLink page={pages[0]} className="block">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            ⚡ CacheShowdown
          </span>
          <span className="block text-xs text-slate-500">
            HTTP cache headers, visualized
          </span>
        </PageLink>
        <div className="flex items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source code on GitHub"
            title="Source code on GitHub"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <svg
              viewBox="0 0 16 16"
              width="22"
              height="22"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {open ? 'Close' : 'Lessons'}
          </button>
        </div>
      </div>
      <nav className={`${open ? 'block' : 'hidden'} px-3 pb-4 md:block`}>
        <p className="px-2 pb-2 text-xs text-slate-400">
          {visited.length} of {pages.length} visited
        </p>
        <ol className="space-y-0.5">
          {pages.map((page, i) => {
            const active = hrefOf(page) === pathname
            return (
              <li key={page.slug}>
                <PageLink
                  page={page}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                    active
                      ? 'bg-indigo-50 font-semibold text-indigo-900'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      visited.includes(page.slug)
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {visited.includes(page.slug) ? '✓' : i}
                  </span>
                  {page.title}
                </PageLink>
              </li>
            )
          })}
        </ol>
      </nav>
    </aside>
  )
}
