import type { ComponentType } from 'react'
import { CheatSheet } from './CheatSheet'
import { ETag } from './ETag'
import { Expires } from './Expires'
import { Intro } from './Intro'
import { LastModified } from './LastModified'
import { MaxAge } from './MaxAge'
import { NoCache } from './NoCache'
import { NoHeaders } from './NoHeaders'
import { NoStore } from './NoStore'
import { Playground } from './Playground'
import { SharedCaches } from './SharedCaches'
import { StaleWhileRevalidate } from './StaleWhileRevalidate'
import { Vary } from './Vary'

export interface Page {
  /** Lessons live at /lessons/$slug; the other pages have their own routes. */
  slug: string
  path: '/' | '/lessons/$slug' | '/playground' | '/cheatsheet'
  title: string
  subtitle: string
  Content: ComponentType
}

const lesson = (
  slug: string,
  title: string,
  subtitle: string,
  Content: ComponentType,
): Page => ({
  slug,
  path: '/lessons/$slug',
  title,
  subtitle,
  Content,
})

/** Every page in reading order (drives the sidebar and the previous/next links). */
export const pages: Array<Page> = [
  {
    slug: 'intro',
    path: '/',
    title: 'What is HTTP caching?',
    subtitle: 'The absolute basics, and how to use this app',
    Content: Intro,
  },
  lesson(
    'no-headers',
    'No cache headers',
    'The baseline: every request goes to the server',
    NoHeaders,
  ),
  lesson(
    'max-age',
    'Cache-Control: max-age',
    '“Reuse this for N seconds without asking”',
    MaxAge,
  ),
  lesson(
    'expires',
    'Expires',
    'The old date-based way, and why max-age wins',
    Expires,
  ),
  lesson(
    'etag',
    'ETag & 304 Not Modified',
    '“Is my copy still current?”, with version labels',
    ETag,
  ),
  lesson(
    'last-modified',
    'Last-Modified',
    'The same question, with dates',
    LastModified,
  ),
  lesson('no-cache', 'no-cache', 'Store it, but always ask first', NoCache),
  lesson(
    'no-store',
    'no-store',
    'Never keep it, and how it differs from no-cache',
    NoStore,
  ),
  lesson(
    'stale-while-revalidate',
    'stale-while-revalidate',
    'Answer instantly, refresh in the background',
    StaleWhileRevalidate,
  ),
  lesson('vary', 'Vary', 'One URL, several versions', Vary),
  lesson(
    'shared-caches',
    'CDNs & other directives',
    'public, private, s-maxage, immutable…',
    SharedCaches,
  ),
  {
    slug: 'playground',
    path: '/playground',
    title: 'Playground',
    subtitle: 'Build your own headers and experiment',
    Content: Playground,
  },
  {
    slug: 'cheatsheet',
    path: '/cheatsheet',
    title: 'Cheat sheet',
    subtitle: 'Recipes, mistakes and glossary',
    Content: CheatSheet,
  },
]

export const pageBySlug = (slug: string) => pages.find((p) => p.slug === slug)
