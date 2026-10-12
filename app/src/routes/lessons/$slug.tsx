import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageLayout } from '#/components/PageLayout'
import { pageBySlug } from '#/lessons/registry'

export const Route = createFileRoute('/lessons/$slug')({
  loader: ({ params }) => {
    const page = pageBySlug(params.slug)
    if (page?.path !== '/lessons/$slug') throw notFound()
    return { slug: page.slug, title: page.title }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? 'Lesson'} · CacheShowdown` }],
  }),
  component: Lesson,
})

function Lesson() {
  const { slug } = Route.useLoaderData()
  // key: a fresh demo state (new sessions) for every lesson.
  return <PageLayout key={slug} page={pageBySlug(slug)!} />
}
