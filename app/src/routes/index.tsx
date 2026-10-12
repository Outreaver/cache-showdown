import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '#/components/PageLayout'
import { pages } from '#/lessons/registry'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return <PageLayout page={pages[0]} />
}
