import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { Page } from '#/lessons/registry'

/** A typed link to any page in the registry. */
export function PageLink({
  page,
  className,
  children,
}: {
  page: Page
  className?: string
  children: ReactNode
}) {
  if (page.path === '/lessons/$slug') {
    return (
      <Link
        to="/lessons/$slug"
        params={{ slug: page.slug }}
        className={className}
      >
        {children}
      </Link>
    )
  }
  return (
    <Link to={page.path} className={className}>
      {children}
    </Link>
  )
}
