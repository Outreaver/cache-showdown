import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '#/components/PageLayout'
import { pageBySlug } from '#/lessons/registry'

export const Route = createFileRoute('/playground')({
  head: () => ({ meta: [{ title: 'Playground · CacheShowdown' }] }),
  component: () => <PageLayout page={pageBySlug('playground')!} />,
})
