import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { PageLink } from './PageLink'
import { pages } from '#/lessons/registry'
import type { Page } from '#/lessons/registry'

const STORAGE_KEY = 'cacheshowdown.visited'

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
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-1 text-sm md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {open ? 'Close' : 'Lessons'}
        </button>
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
