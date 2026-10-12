import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '#/components/PageLayout'
import { pageBySlug } from '#/lessons/registry'

export const Route = createFileRoute('/cheatsheet')({
  head: () => ({ meta: [{ title: 'Cheat sheet · CacheShowdown' }] }),
  component: () => <PageLayout page={pageBySlug('cheatsheet')!} />,
})
